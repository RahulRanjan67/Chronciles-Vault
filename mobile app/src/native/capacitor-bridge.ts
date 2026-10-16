/**
 * Capacitor Native Bridge & Security Boundary (ADR-001, ADR-009, ADR-010)
 *
 * Provides:
 * 1. Runtime platform detection (`web` | `ios` | `android`) without requiring
 *    native packages to be bundled when running in a standard browser.
 * 2. ADR-009 Curated Mobile Subset helpers so power-user desktop surfaces can
 *    offer a deliberate hand-off to the full browser experience when running
 *    inside the native mobile shell.
 * 3. Strict argument-validated boundaries for Capacitor Filesystem and SQLite
 *    plugins, rejecting path traversal, arbitrary host paths, and multi-statement SQL.
 */

export type CapacitorPlatform = "web" | "ios" | "android";

export type AllowedSandboxDirectory = "DATA" | "DOCUMENTS" | "CACHE";

const ALLOWED_DIRECTORIES: ReadonlySet<AllowedSandboxDirectory> = new Set([
  "DATA",
  "DOCUMENTS",
  "CACHE",
]);

const DB_NAME_PATTERN = /^[a-z0-9_-]{1,64}\.db$/i;

interface WindowWithCapacitor extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      Filesystem?: {
        readFile?: (opts: { path: string; directory: AllowedSandboxDirectory }) => Promise<{ data: string }>;
        writeFile?: (opts: {
          path: string;
          data: string;
          directory: AllowedSandboxDirectory;
          recursive?: boolean;
        }) => Promise<{ uri: string }>;
      };
      CapacitorSQLite?: {
        execute?: (opts: { database: string; statements: string }) => Promise<unknown>;
        query?: (opts: { database: string; statement: string; values?: readonly unknown[] }) => Promise<{ values?: unknown[] }>;
      };
    };
  };
}

/**
 * Returns the active Capacitor platform (`ios`, `android`, or `web`).
 */
export function getCapacitorPlatform(): CapacitorPlatform {
  if (typeof window === "undefined") return "web";
  const cap = (window as WindowWithCapacitor).Capacitor;
  if (!cap || typeof cap.getPlatform !== "function") return "web";
  const raw = cap.getPlatform();
  if (raw === "ios" || raw === "android") return raw;
  return "web";
}

/**
 * Returns true only when running inside an installed Capacitor iOS/Android shell.
 */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as WindowWithCapacitor).Capacitor;
  if (cap && typeof cap.isNativePlatform === "function") {
    return Boolean(cap.isNativePlatform());
  }
  const platform = getCapacitorPlatform();
  return platform === "ios" || platform === "android";
}

/**
 * ADR-009: The native mobile app intentionally ships a curated touch-first subset
 * rather than cramming 12-step bulk operations or dense editors onto a phone screen.
 * Standard responsive web in a mobile browser retains 100% desktop parity.
 */
export function isNativeCuratedSubset(): boolean {
  return isCapacitorNative();
}

/**
 * Validates a relative path destined for the Capacitor Filesystem plugin.
 * Strictly prohibits:
 * - Empty paths or paths exceeding 255 characters
 * - Null bytes or control characters
 * - Parent directory traversal (`..`)
 * - Leading slashes or Windows drive letters (`C:\`)
 * - URL schemes (`file://`, `content://`, `http://`)
 */
export function validateNativeFilePath(relativePath: string): string {
  if (typeof relativePath !== "string") {
    throw new Error("Native file path must be a string.");
  }
  const trimmed = relativePath.trim();
  if (trimmed.length === 0 || trimmed.length > 255) {
    throw new Error("Native file path must be between 1 and 255 characters.");
  }
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    throw new Error("Native file path contains forbidden control characters.");
  }
  if (trimmed.includes("\\")) {
    throw new Error("Native file path must use forward slashes only.");
  }
  if (trimmed.startsWith("/") || /^[a-zA-Z]:/.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    throw new Error("Native file path must be relative to the sandbox directory.");
  }
  const segments = trimmed.split("/");
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new Error("Path traversal segments are forbidden in native file paths.");
    }
  }
  return trimmed;
}

/**
 * Validates that the target sandbox directory is in the strict allowlist.
 */
export function validateSandboxDirectory(directory: AllowedSandboxDirectory): AllowedSandboxDirectory {
  if (!ALLOWED_DIRECTORIES.has(directory)) {
    throw new Error(`Unsupported Capacitor sandbox directory: ${String(directory)}`);
  }
  return directory;
}

/**
 * Validates a SQLite database filename for the Capacitor SQLite plugin.
 */
export function validateDatabaseName(dbName: string): string {
  if (typeof dbName !== "string" || !DB_NAME_PATTERN.test(dbName.trim())) {
    throw new Error(
      "Invalid SQLite database name. Must match /^[a-z0-9_-]{1,64}\\.db$/i.",
    );
  }
  return dbName.trim();
}

/**
 * Validates a parameterized SQL statement before passing it to the native SQLite bridge.
 * Rejects empty statements, null bytes, and stacked multi-statement queries (`;`).
 */
export function validateParameterizedSql(statement: string): string {
  if (typeof statement !== "string") {
    throw new Error("SQL statement must be a string.");
  }
  const trimmed = statement.trim();
  if (trimmed.length === 0 || trimmed.length > 10_000) {
    throw new Error("SQL statement length out of bounds.");
  }
  if (trimmed.includes("\0")) {
    throw new Error("SQL statement contains null byte.");
  }
  // Strip trailing semicolon if present, then reject any remaining semicolons
  const withoutTrailing = trimmed.endsWith(";") ? trimmed.slice(0, -1).trim() : trimmed;
  if (withoutTrailing.includes(";")) {
    throw new Error("Multi-statement SQL queries are forbidden across the native bridge.");
  }
  return trimmed;
}

/**
 * Safe wrapper for reading a file from the Capacitor sandboxed filesystem.
 */
export async function readNativeSandboxFile(
  relativePath: string,
  directory: AllowedSandboxDirectory = "DATA",
): Promise<string> {
  const safePath = validateNativeFilePath(relativePath);
  const safeDir = validateSandboxDirectory(directory);
  const cap = typeof window !== "undefined" ? (window as WindowWithCapacitor).Capacitor : undefined;
  const fsPlugin = cap?.Plugins?.Filesystem;
  if (!fsPlugin?.readFile) {
    throw new Error("Capacitor Filesystem plugin is not available in this runtime.");
  }
  const result = await fsPlugin.readFile({ path: safePath, directory: safeDir });
  return result.data;
}

/**
 * Safe wrapper for writing a file to the Capacitor sandboxed filesystem.
 */
export async function writeNativeSandboxFile(
  relativePath: string,
  base64OrUtf8Data: string,
  directory: AllowedSandboxDirectory = "DATA",
): Promise<string> {
  const safePath = validateNativeFilePath(relativePath);
  const safeDir = validateSandboxDirectory(directory);
  if (typeof base64OrUtf8Data !== "string" || base64OrUtf8Data.length > 128 * 1024 * 1024) {
    throw new Error("Payload exceeds 128 MB native write limit.");
  }
  const cap = typeof window !== "undefined" ? (window as WindowWithCapacitor).Capacitor : undefined;
  const fsPlugin = cap?.Plugins?.Filesystem;
  if (!fsPlugin?.writeFile) {
    throw new Error("Capacitor Filesystem plugin is not available in this runtime.");
  }
  const result = await fsPlugin.writeFile({
    path: safePath,
    data: base64OrUtf8Data,
    directory: safeDir,
    recursive: true,
  });
  return result.uri;
}

/**
 * Safe wrapper for parameterized queries against the Capacitor SQLite plugin.
 */
export async function queryNativeSqlite(
  database: string,
  statement: string,
  values: readonly unknown[] = [],
): Promise<unknown[]> {
  const safeDb = validateDatabaseName(database);
  const safeSql = validateParameterizedSql(statement);
  const cap = typeof window !== "undefined" ? (window as WindowWithCapacitor).Capacitor : undefined;
  const sqlitePlugin = cap?.Plugins?.CapacitorSQLite;
  if (!sqlitePlugin?.query) {
    throw new Error("CapacitorSQLite plugin is not available in this runtime.");
  }
  const res = await sqlitePlugin.query({
    database: safeDb,
    statement: safeSql,
    values,
  });
  return res.values ?? [];
}
