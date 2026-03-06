# Mupool

Bitcoin-inspired beef traceability using:
- `moopool` queue for pending lifecycle events
- `UCowXO` unspent output model for cattle/carcass/lot state
- Proof of Moo validator logic for role-based attestation and finality
- mined state only after slaughter + cool-room confirmation

## Monorepo Layout

- `apps/api`: Fastify API for transaction intake, queries, and audits
- `apps/worker`: BullMQ finalization worker
- `apps/dashboard`: React operator/auditor console
- `packages/domain`: protocol types/rules
- `packages/crypto`: canonical serialization, hashing, signature helpers
- `packages/db`: PostgreSQL schema, migrations, replay/query helpers
- `infra`: Docker Compose and operational scripts

## Quick Start

1. Start infrastructure and services:
   - `docker compose -f infra/docker-compose.yml up`
2. Apply DB migration and seed:
   - `pnpm --filter @mupool/db migrate`
   - `pnpm --filter @mupool/db seed`
3. API: `http://localhost:4000`
4. Dashboard: `http://localhost:4173`

For local API calls in dev, set request header:
- `x-mupool-signature: dev`

## Acceptance Signals

- Duplicate spend attempts are rejected.
- Slaughter and cool-room events enforce role thresholds.
- Asset becomes mined only when state is `IN_COOL_ROOM_CONFIRMED`.
- Provenance and mined-proof endpoints return auditable evidence.
