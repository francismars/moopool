# Mupool Release Gate Report (MVP Baseline)

## Scope Covered

- TypeScript monorepo with API, worker, dashboard, and shared packages.
- PostgreSQL schema and deterministic replay utility.
- Proof of Moo validation path and moopool finalization worker.
- Query APIs: transactions, current asset, provenance, mined proof, audit/integrity.
- Dashboard workflows for lifecycle events, trace/proof checks, and key management.
- Docker Compose runtime with Postgres, Redis, API, worker, dashboard.
- CI workflow including migration, seed, test, and replay check.

## Acceptance Checklist Status

- [x] Every finalized tx is attributable to signer roles via attestation records.
- [x] UCowXO set is reproducible through deterministic replay from finalized ledger.
- [x] Conflicting/invalid spends are rejected in validation and replay paths.
- [x] Mined state requires cool-room confirmation after slaughter.
- [x] Provenance and mined proof retrieval endpoints are implemented.

## Residual Risks

- Production key management and signing ceremony are simplified for MVP.
- Merkle proof model is currently lightweight (hash root per finalized batch).
- Some deployment hardening is baseline-level and should be expanded for regulated environments.

## Recommended Next Validation Pass

1. Run seeded e2e scenario with real role identities and keys.
2. Enable stronger auth mode (non-`dev` signature path) in staging.
3. Add load tests for moopool burst processing and replay at larger heights.
