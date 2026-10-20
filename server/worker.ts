/**
 * Grimoire Cloudflare Worker & D1 Storage Backend
 * Provides:
 * 1. Health & Server Telemetry (/api/health)
 * 2. Identity & Passkey Session Relay (/api/auth/*)
 * 3. Zero-Knowledge E2EE Sync Mailbox (/api/sync/*)
 * 4. CORS Safe Metadata & Synopsis Cache (/api/metadata/resolve)
 */

export interface Env {
  DB?: D1Database;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  CORS_ALLOW_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.CORS_ALLOW_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-ID",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // 1. Health Check
      if (url.pathname === "/api/health" || url.pathname === "/api/v1/health") {
        return jsonResponse(
          {
            status: "healthy",
            service: "grimoire-d1-relay",
            timestamp: new Date().toISOString(),
            d1: Boolean(env.DB),
          },
          corsHeaders
        );
      }

      // 2. Auth: Register / Session
      if (url.pathname === "/api/auth/register" && request.method === "POST") {
        if (!env.DB) {
          return jsonResponse(
            { error: "Cloudflare D1 database is not bound. Grimoire operates in sovereign local-first mode." },
            corsHeaders,
            503
          );
        }

        const body: any = await request.json();
        const { username, authTokenHash, publicKey } = body;
        if (!username || !authTokenHash) {
          return jsonResponse({ error: "username and authTokenHash required" }, corsHeaders, 400);
        }

        const now = new Date().toISOString();
        const userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

        await env.DB.prepare(
          `INSERT OR REPLACE INTO users (id, username, auth_token_hash, public_key, created_at, last_active_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(userId, username.toLowerCase().trim(), authTokenHash, publicKey || null, now, now)
          .run();

        return jsonResponse({ success: true, userId, username }, corsHeaders);
      }

      // 3. E2EE Sync: Push Encrypted Blob
      if (url.pathname === "/api/sync/push" && request.method === "POST") {
        if (!env.DB) {
          return jsonResponse(
            { error: "Cloudflare D1 database is not bound. Sync operates in sovereign local-first mode." },
            corsHeaders,
            503
          );
        }

        const body: any = await request.json();
        const { userId, deviceId, clientTimestamp, stateVector, encryptedPayload } = body;

        if (!userId || !deviceId || !encryptedPayload) {
          return jsonResponse({ error: "Missing required sync payload fields" }, corsHeaders, 400);
        }

        const now = new Date().toISOString();
        const syncId = `sync_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

        await env.DB.prepare(
          `INSERT OR REPLACE INTO sync_mailboxes (id, user_id, device_id, client_timestamp, state_vector, encrypted_payload, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(syncId, userId, deviceId, clientTimestamp || now, stateVector || null, encryptedPayload, now, now)
          .run();

        return jsonResponse({ success: true, syncId, storedAt: now }, corsHeaders);
      }

      // 4. E2EE Sync: Pull Encrypted Blobs
      if (url.pathname === "/api/sync/pull" && request.method === "GET") {
        if (!env.DB) {
          return jsonResponse({ success: true, items: [] }, corsHeaders);
        }

        const userId = url.searchParams.get("userId");
        const excludeDeviceId = url.searchParams.get("excludeDeviceId");

        if (!userId) {
          return jsonResponse({ error: "userId query param required" }, corsHeaders, 400);
        }

        let query = "SELECT id, device_id, client_timestamp, state_vector, encrypted_payload, updated_at FROM sync_mailboxes WHERE user_id = ?";
        const params: any[] = [userId];

        if (excludeDeviceId) {
          query += " AND device_id != ?";
          params.push(excludeDeviceId);
        }

        query += " ORDER BY updated_at DESC LIMIT 50";

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return jsonResponse({ success: true, items: results || [] }, corsHeaders);
      }

      // 5. CORS Safe Metadata Proxy / Resolver
      if (url.pathname === "/api/metadata/resolve" && request.method === "GET") {
        const targetUrl = url.searchParams.get("url");
        if (!targetUrl) {
          return jsonResponse({ error: "url param required" }, corsHeaders, 400);
        }

        let parsed: URL;
        try {
          parsed = new URL(targetUrl);
        } catch {
          return jsonResponse({ error: "invalid target URL" }, corsHeaders, 400);
        }

        const domain = parsed.hostname;
        const itemKey = parsed.pathname;

        // Check D1 Cache first if DB is configured
        if (env.DB) {
          const cached: any = await env.DB.prepare(
            "SELECT metadata_json, expires_at FROM portal_metadata_cache WHERE domain = ? AND item_key = ?"
          )
            .bind(domain, itemKey)
            .first();

          if (cached && new Date(cached.expires_at) > new Date()) {
            return jsonResponse(JSON.parse(cached.metadata_json), corsHeaders);
          }
        }

        // Fetch external HTML and parse title / description safely
        const fetchRes = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrimoireBot/1.0",
          },
        });

        const html = await fetchRes.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : domain;

        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const description = descMatch ? descMatch[1].trim() : "";

        const payload = {
          domain,
          itemKey,
          title,
          description,
          resolvedAt: new Date().toISOString(),
        };

        const now = new Date();
        const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        if (env.DB) {
          await env.DB.prepare(
            `INSERT OR REPLACE INTO portal_metadata_cache (domain, item_key, title, metadata_json, cached_at, expires_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
            .bind(domain, itemKey, title, JSON.stringify(payload), now.toISOString(), expires)
            .run();
        }

        return jsonResponse(payload, corsHeaders);
      }

      // 404 Not Found for unhandled API routes
      if (url.pathname.startsWith("/api/")) {
        return jsonResponse({ error: "API route not found" }, corsHeaders, 404);
      }

      // Static assets pass-through for client SPA
      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response("Grimoire Sovereign Sanctum is Live", { status: 200 });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Internal server error" }, corsHeaders, 500);
    }
  },
};

function jsonResponse(data: unknown, headers: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
