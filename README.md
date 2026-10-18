# Chronicles Vault

> Your personal reading intelligence system — own your library, understand your reading, protect your privacy.

Chronicles Vault is a **local-first**, **privacy-respecting** application that unifies your entire reading life: books, articles, papers, manga, comics, and more. It tracks what you read, captures your thoughts, surfaces connections between works, and keeps everything encrypted in a vault only you can open.

---

## ✨ What It Does

| Feature | Description |
|---|---|
| 📚 **Universal Library** | Track any work across any format or platform |
| 🔒 **Encrypted Vault** | AES-256-GCM + Argon2id for all sensitive data |
| 🧠 **Memory System** | Capture quotes, insights, and connections |
| 📖 **Built-in Reader** | EPUB, PDF, CBZ/CBR with progress sync |
| 🔍 **Full-Text Search** | FTS5 over library and memories |
| 🌐 **Browser Extension** | Capture from any web source |
| 🤖 **AI Assistant** | Local or cloud LLM for reading intelligence |

---

## 🏗️ Architecture

This is a **pnpm monorepo** orchestrated by **Turborepo**:

```
chronicles-vault/
  apps/
    client/        → React + Vite main UI (web application & planned Capacitor native shell)
    browser/
      chromium/    → Manifest V3 Chrome/Edge extension
      firefox/     → Firefox extension
  packages/
    domain/        → Business entities, invariants, events (@cv/domain)
    database/      → SQLite repositories, migrations, FTS5 (@cv/database)
    ui/            → Design system, shadcn-compatible components (@cv/ui)
    state/         → Zustand stores, session management (@cv/state)
    search/        → FTS5 abstraction layer (@cv/search)
    memory/        → Memory services and capture pipeline (@cv/memory)
    reader/        → Reader adapters for EPUB/PDF/CBZ (@cv/reader)
    source/        → AccessPath providers (library APIs) (@cv/source)
    vault/         → Encryption/decryption, session lifecycle (@cv/vault)
    shared/        → Utilities, shared types, constants (@cv/shared)
  services/
    api/           → FastAPI backend (AI, heavy processing)
  docs/            → All architecture and contract documents
  tests/
    integration/   → Cross-package integration tests
    e2e/           → Playwright end-to-end tests
    performance/   → Benchmark suite
  scripts/
    seed/          → Database seed data
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 20.0.0 |
| pnpm | ≥ 9.0.0 |
| Python | ≥ 3.12 (for FastAPI service) |

### Install Dependencies

```bash
pnpm install
```

### Run in Development

```bash
# Client only (web application)
pnpm --filter @chronicles-vault/client dev

# Full workspace build
pnpm build

# Run all test suites
pnpm test
```

### Build for Production

```bash
# All packages
pnpm build

# Desktop app (generates installer)
pnpm --filter @cv/desktop build
```

### Run Tests

```bash
# Unit + integration
pnpm test

# End-to-end
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Seed Database

```bash
pnpm seed
```

---

## 📁 Documentation

All contract and architecture documents live in [`docs/`](./docs/):

| Document | Purpose |
|---|---|
| [PRODUCT.md](./docs/PRODUCT.md) | Product thesis and user stories |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System overview and data flow |
| [DOMAIN.md](./docs/DOMAIN.md) | All domain entities with full field specs |
| [DATABASE.md](./docs/DATABASE.md) | Tables, indexes, FTS5, migrations |
| [EVENTS.md](./docs/EVENTS.md) | Domain events and payload shapes |
| [UI-CONTRACT.md](./docs/UI-CONTRACT.md) | Design system, tokens, components |
| [SOURCE-CONTRACT.md](./docs/SOURCE-CONTRACT.md) | AccessPath providers and adapters |
| [READER-CONTRACT.md](./docs/READER-CONTRACT.md) | Reader adapters and progress locators |
| [VAULT-CONTRACT.md](./docs/VAULT-CONTRACT.md) | Encryption model and session lifecycle |
| [INTEGRATION-RULES.md](./docs/INTEGRATION-RULES.md) | Provider legality and API rules |
| [PERFORMANCE.md](./docs/PERFORMANCE.md) | Targets, benchmarks, device matrix |
| [AGENT_RULES.md](./docs/AGENT_RULES.md) | Development agent rules |
| [IMPLEMENTATION_STATE.md](./docs/IMPLEMENTATION_STATE.md) | Feature implementation tracking |
| [DECISIONS.md](./docs/DECISIONS.md) | Architecture decision records |

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` in the relevant app or service directory:

```bash
cp apps/client/.env.example apps/client/.env
cp services/api/.env.example services/api/.env
```

### Path Aliases

All packages are available as `@cv/*` imports from any workspace member:

```typescript
import { Work } from "@cv/domain";
import { useLibraryStore } from "@cv/state";
import { Button } from "@cv/ui";
```

---

## 📜 License

Private — All Rights Reserved © Chronicles Vault Contributors
