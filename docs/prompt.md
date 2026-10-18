# Chronicles Vault — Continuation Prompt

Continue implementation in this project folder. The latest verified work is
recorded in `docs/IMPLEMENTATION_PLAN.md` and `docs/IMPLEMENTATION_STATE.md`;
read those, plus the relevant contracts, before editing. Treat the actual code
and contract documents as authoritative. Do not reimplement completed features
or mark a cycle complete without running its relevant checks.

## Current state

- Cycle 6, Private Vault Security Boundary, is implemented for browser-local
  private notes: Argon2id/AES-GCM, wrapped-key persistence and encrypted item
  persistence in IndexedDB, reactive lock/unlock, unlocked-only note search,
  plaintext guards for the public localStorage repository, 15-minute inactivity
  and visibility locking, manual locking, and lock shortcut.
- Cycle 6 does not yet migrate every Vault-classified domain record or use
  native SQLite. The web implementation does not claim protection from
  same-origin script compromise or a compromised device.
- Cycle 7 is partially implemented: updates derive from local repository
  entries, the UI displays certainty/staleness/source health and numeric
  backlog, and tested pure policies select safe local/healthy source fallbacks
  and compute backoff. Automated health scheduling/persistence and full cycle
  integration remain incomplete.
- Cycle 8 provider-adapter work was not completed. No scraping, access-control
  bypass, credential collection, or unsafe automatic tab closing is authorized.
- Cycles 2–5 are partially complete as recorded in the implementation state;
  Cycle 3 still lacks native file access.
- The selected native packaging direction is Capacitor for the existing
  React/Vite client on iOS and Android, replacing the former Tauri proposal. The
  workspace does not yet contain Capacitor scaffolding or plugins. Capacitor
  does not imply Windows/Linux desktop support.

## Work to resume later

Continue from the next incomplete cycle, starting with Cycle 7 and proceeding
through Cycle 8. Integrate the existing source-health/update policy into the
client where contractually appropriate, then implement the legal, bounded
provider-adapter slice in `packages/source` using official public APIs and
user-supplied HTTPS feeds only. Use injected network and clock dependencies,
explicit rate limits, cancellation, conditional requests, and safe failure
states. Do not invent live polling or claim freshness unless a provider is
actually wired and tested.

After Cycle 8, reconcile outstanding work in Cycles 2–5 against their contracts,
then run focused tests for each changed cycle and overall typecheck, build,
format, and integration checks. Update implementation plan/state documents only
with results verified in this workspace. Record test/tooling blockers
explicitly; do not hide failures or loosen security checks to make a cycle pass.

## Platform direction

Keep the browser app working while preparing the React/Vite client for
Capacitor. Before adding native plugins, select compatible versions and keep
filesystem, SQLite, and lifecycle integrations behind narrow typed adapters. Use
explicit permissions, validate bridge arguments, avoid logging secrets, and lock
the vault on application backgrounding. Do not create a Tauri shell or claim
native file access until a Capacitor host and its tests exist.

## Working rules

- Preserve unrelated user changes and work directly in this folder; it is a
  folder-backed project without Git.
- Read the relevant contract documents before touching a feature; do not alter
  contracts casually. Update platform-specific references consistently when the
  approved Capacitor direction requires it.
- Follow local-first privacy, legality, token, package-boundary, migration,
  type-safety, cancellation, and test requirements.
- Keep private data out of public localStorage, public search indexes,
  telemetry, logs, and network requests.
- Avoid unnecessary dependencies and broad unrelated refactors. Do not ask the
  user to say “continue” after each cycle; complete the requested bounded scope
  autonomously and report verified work and remaining blockers.
- Do not proceed beyond Cycle 8 unless explicitly requested.
