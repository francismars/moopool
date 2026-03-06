# Mupool: Build, Operations, and Investment Brief

## 1) What We Built

Mupool is a Bitcoin-inspired traceability platform for beef supply chains.

Core protocol concepts:
- `moopool` (double `oo`): pending event queue before finalization
- `UCowXO`: unspent cattle output model for current state ownership
- Proof of Moo: role-aware attestation and validation flow
- Mined condition: an animal/carcass is only considered mined after slaughter and confirmed cool-room status

System components delivered:
- API service (`apps/api`) for transaction ingestion, validation, and trace queries
- Finalization worker (`apps/worker`) for moopool processing and block progression
- Dashboard (`apps/dashboard`) for operator and auditor workflows
- Shared protocol packages (`packages/domain`, `packages/crypto`, `packages/db`)
- PostgreSQL ledger/state store + Redis queue
- Docker Compose runtime and DB backup/restore scripts
- Tests and CI workflow for typecheck, protocol tests, and replay checks

Protocol/business outcomes:
- Deterministic chain-of-custody from animal registration to downstream lots
- Conflict rejection for duplicate spend-like custody/slaughter claims
- Auditable provenance with actor attestations and state transitions
- Role- and threshold-driven controls around high-risk events (slaughter, cool-room confirmation)

## 2) How to Operate Mupool

## 2.1 Startup (Local or Pilot Environment)

1. Start infrastructure:
   - `docker compose -f infra/docker-compose.yml up -d postgres redis`
2. Run migrations and seed:
   - `pnpm --filter @mupool/db migrate`
   - `pnpm --filter @mupool/db seed`
3. Start services:
   - API: `pnpm --filter @mupool/api dev`
   - Worker: `pnpm --filter @mupool/worker dev`
   - Dashboard: `pnpm --filter @mupool/dashboard dev -- --host 0.0.0.0 --port 4173`
4. Open dashboard:
   - `http://localhost:4173`

## 2.2 Daily Operations

Operations team:
- Register animals on intake
- Record transfers and custody changes
- Record slaughter events with required signatures
- Confirm cool-room events to unlock mined state
- Run provenance and integrity checks for audits/compliance

Technical ops:
- Monitor API health at `/healthz` and `/readyz`
- Monitor queue throughput and worker errors
- Run periodic integrity snapshots and replay checks
- Enforce key rotation and key revocation workflow

## 2.3 Backup and Recovery

Backup:
- `./infra/scripts/backup-db.sh`

Restore:
- `./infra/scripts/restore-db.sh <backup-file.sql>`

Recommended production cadence:
- Daily logical backups
- Weekly restore drill in staging
- Replay consistency checks after restore

## 2.4 Basic Operator Workflow

1. Register cow (`REGISTER_ANIMAL`)
2. Transfer custody (`TRANSFER_CUSTODY`)
3. Record slaughter (`RECORD_SLAUGHTER`) with multi-party attestation
4. Confirm cool-room (`CONFIRM_COOL_ROOM`) with required signatures
5. Verify current state and mined proof from API/dashboard

## 3) Why This Works in Real-World Beef Supply Chains

## 3.1 Solves Existing Industry Pain

Current pain points:
- Paper-heavy chain-of-custody
- Weak interoperability across farms, transporters, processors, auditors
- Slow recall response due to fragmented records
- Low-trust provenance claims for premium branded beef

Mupool value:
- Shared event ledger with deterministic state transitions
- Fast provenance lookup by asset/package ID
- Stronger tamper-evidence via signed actor attestations
- Clear mined milestone linked to physical processing status

## 3.2 Practical Deployment Fit

Mupool is deployable as a consortium-grade system:
- Farms, logistics, slaughterhouses, and auditors run as authorized actors
- No speculative token required, lowering regulatory and reputational friction
- Existing ERP/WMS/LIMS systems can integrate through API endpoints
- Pilot can start in one region/process line and scale by facility

## 3.3 Compliance and Risk Management Potential

Mupool supports:
- Faster root-cause and trace-back during contamination events
- Better documentation for food safety and quality programs
- Reduced fraud window for premium-label claims
- Better insurer/lender confidence through verifiable operations data

## 4) Why TexasSlim and Beef Investors Should Care

## 4.1 Strategic Alignment

For TexasSlim-style advocates of independent ranchers and transparent food systems:
- Improves producer narrative with verifiable provenance
- Helps premium producers prove quality and handling standards
- Creates trust rails between producers and buyers without adding token speculation

For beef-focused investors:
- Addresses a large, real operational market problem
- Builds defensible data infrastructure rather than a one-off app
- Creates recurring revenue options (SaaS + compliance + integrations + analytics)

## 4.2 Economic Thesis

Primary value drivers:
- Reduced recall investigation cost and response time
- Premium pricing support through verified provenance
- Lower dispute and reconciliation costs across counterparties
- Data network effects as more participants join and standardize workflows

Revenue pathways:
- Per-facility platform subscriptions
- Event volume pricing for high-throughput operators
- Integration and onboarding services
- Enterprise audit/compliance modules

## 4.3 Why Invest Early

Early capital accelerates:
- Pilot deployments with real operators
- Hardened security/compliance controls for production
- Integration adapters for dominant ag/processing software
- Brand-level consumer provenance experiences

Potential moat:
- Protocol + operations + consortium relationships
- Transition rule library tuned for real beef workflows
- High switching cost once chain-of-custody standards are embedded

## 5) What We Need Next

## 5.1 6-12 Month Execution Priorities

- Production security hardening (KMS/HSM, stricter signing policy)
- Expanded integration connectors (ERP/WMS/LIMS)
- Multi-facility pilot and SLA-backed operations
- Rich analytics for yield, handling, and compliance performance
- Formal governance model for consortium operators

## 5.2 Investment Use of Funds

- Product engineering and platform reliability
- Field implementation with pilot partners
- Compliance/legal readiness and third-party assurance
- Sales and partnership development in beef value chains

## 6) Balanced Risk Statement

Mupool is a serious infrastructure play, not a meme token.
Risks include stakeholder adoption friction, integration timelines, and operational change management.
However, the core architecture and prototype already demonstrate the key ingredients investors look for:
- clear painkiller use case
- practical deployment model
- auditable technical foundation
- scalable business pathways tied to real industry economics

## 7) One-Line Positioning

Mupool brings Bitcoin-style state integrity to beef operations: verifiable custody, provable processing milestones, and production-grade traceability that can compound value for producers, processors, and long-term investors.
