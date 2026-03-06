# Mupool

Bitcoin-inspired beef traceability infrastructure:
- `moopool` queue for pending lifecycle events
- `UCowXO` unspent output model for cattle/carcass/lot state
- Proof of Moo validator logic for role-based attestation and finality
- mined state only after slaughter + cool-room confirmation (`IN_COOL_ROOM_CONFIRMED`)

Mupool is designed as real-world supply-chain infrastructure, not a tradable token product.

## The Idea

Mupool exists to make food trust verifiable.

Today, beef supply chains often rely on fragmented records, manual reconciliation, and trust assumptions between parties that do not share a single source of truth. When something goes wrong (quality issue, compliance breach, recall), the cost is high, response is slow, and accountability is blurry.

Our idea is simple:
- treat each major lifecycle event as a signed, verifiable state transition
- preserve custody history as an auditable lineage, not disconnected paperwork
- define a strict real-world milestone for value completion: a cow is not "mined" until slaughter and cool-room confirmation are both complete

The long-term vision is bigger than software tooling. We aim to create a trust layer that helps:
- producers prove quality and handling standards
- processors and distributors reduce disputes and compliance friction
- auditors and regulators verify evidence faster
- consumers and brands access reliable provenance claims

Mupool starts with beef, but the model is designed to expand into broader protein and food traceability networks over time.

## Founder Manifesto

We believe trust in food should not be a marketing slogan. It should be provable.

We are building Mupool for producers, operators, and communities who do the hard work and deserve systems that protect truth, not hide it behind fragmented paperwork and opaque intermediaries.

We reject speculation-first models. We build utility-first infrastructure.

Our mission is to make provenance undeniable, accountability immediate, and quality claims verifiable at scale.

If the future of food is going to be more local, more resilient, and more sovereign, it needs a trust layer built by people who actually care about the real world. That is what Mupool is here to become.

## Monorepo Layout

- `apps/api`: Fastify API for transaction intake, queries, and audits
- `apps/worker`: BullMQ finalization worker
- `apps/dashboard`: React operator/auditor console
- `packages/domain`: protocol types/rules
- `packages/crypto`: canonical serialization, hashing, signature helpers
- `packages/db`: PostgreSQL schema, migrations, replay/query helpers
- `infra`: Docker Compose and operational scripts
- `docs`: protocol, API, roadmap, investor, and budget docs

## Run Locally

1. Install dependencies:
   - `pnpm install`
2. Start data services:
   - `docker compose -f infra/docker-compose.yml up -d postgres redis`
3. Apply DB migration and seed:
   - `pnpm --filter @mupool/db migrate`
   - `pnpm --filter @mupool/db seed`
4. Start app services (separate terminals):
   - API: `pnpm --filter @mupool/api dev`
   - Worker: `pnpm --filter @mupool/worker dev`
   - Dashboard: `pnpm --filter @mupool/dashboard dev -- --host 0.0.0.0 --port 4173`
5. Open:
   - API: `http://localhost:4000`
   - Dashboard: `http://localhost:4173`

For local API calls in dev, set header:
- `x-mupool-signature: dev`

## Core API Endpoints

- `POST /api/v1/transactions/submit`
- `POST /api/v1/transactions/validate`
- `GET /api/v1/transactions/:txId`
- `GET /api/v1/assets/:assetId/current`
- `GET /api/v1/assets/:assetId/provenance`
- `GET /api/v1/proofs/mined/:assetId`
- `GET /api/v1/audit/events`
- `GET /api/v1/audit/integrity`

## Operations

- Backup DB: `./infra/scripts/backup-db.sh`
- Restore DB: `./infra/scripts/restore-db.sh <backup-file.sql>`
- Replay integrity check: `pnpm --filter @mupool/db replay:check`
- CI workflow: `.github/workflows/ci.yml`

## Validation Signals

- Duplicate spend attempts are rejected.
- Slaughter and cool-room events enforce role thresholds.
- Asset becomes mined only when state is `IN_COOL_ROOM_CONFIRMED`.
- Provenance and mined-proof endpoints return auditable evidence.

## Key Docs

- Protocol spec: `docs/mupool-protocol.md`
- UCowXO state model: `docs/ucowxo-state-model.md`
- API spec: `docs/api-spec.md`
- MVP roadmap: `docs/mvp-plan.md`
- Release gate report: `docs/release-gate-report.md`
- Investor/ops brief: `docs/mupool-investor-operations-brief.md`
- Timeline and budget: `docs/mupool-timeline-and-budget.md`
- Investor introduction letter: `docs/mupool-investor-introduction-letter.md`
