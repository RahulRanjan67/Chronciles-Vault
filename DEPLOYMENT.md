# Grimoire — Production Cloudflare Deployment Guide

## 1. Quick Deploy with Cloudflare Workers & D1 (Free Tier — $0/Month)

Grimoire is architected as a Local-First, Zero-Knowledge application. Central servers never store plaintext reading libraries, covers, or private passwords. The Cloudflare backend handles:
1. User registration & cryptographic public key registry
2. End-to-end encrypted (E2EE) sync mailbox
3. CORS-safe edge metadata caching for novel/manga/drama sites

### Prerequisites
- Node.js 18+ & pnpm
- Cloudflare Account (Free plan)
- Wrangler CLI: `pnpm add -D wrangler` or `npx wrangler`

### Step 1: Login to Cloudflare
```bash
npx wrangler login
```

### Step 2: (Optional) Create Production D1 Database
If you wish to enable edge E2EE multi-device sync and metadata caching:
```bash
npx wrangler d1 create grimoire_d1_production
```
*Uncomment the `[[d1_databases]]` block in `wrangler.toml` and set `database_id` to the returned UUID.*

### Step 3: (Optional) Run Database Migrations
```bash
# Apply initial schema to production D1 database (if D1 is configured)
npx wrangler d1 migrations apply grimoire_d1_production --remote
```

### Step 4: Build Client Frontend
```bash
pnpm --filter @grimoire/client build
```

### Step 5: Deploy to Cloudflare Network
```bash
npx wrangler deploy
```
Your Grimoire Sanctum will immediately be live globally on Cloudflare's 300+ edge datacenter network with 0ms cold starts, automatic SSL, and zero server maintenance!

---

## 2. Final 3 Best Deployment Candidates Comparison

| Candidate | Monthly Cost | Storage / Engine | Best For |
| :--- | :--- | :--- | :--- |
| **1. Cloudflare Pages + Workers + D1** *(Top Recommended)* | **$0.00 / mo** (Free Tier: 5GB D1, 100k req/day) | Edge SQLite (D1) + Edge Worker CDN | Zero maintenance, infinite scaling, sub-10ms global latency, native local-first sync. |
| **2. Vercel + Turso (libSQL)** | **$0.00 / mo** (Free Tier: 9GB Turso, 100GB Vercel) | Distributed libSQL + Serverless Next/Vite | Easy Git-push workflow, preview branches, excellent developer dashboard. |
| **3. Render.com / Fly.io + Supabase** | **$0.00 / mo** (Free Tier: 500MB Postgres, 50k MAU) | PostgreSQL + Dockerized Express / Fastify | Full container control, background workers, traditional relational SQL. |
