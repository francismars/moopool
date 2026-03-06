# Mupool MVP Implementation Plan (v0.1)

## 1) Objective

Deliver a production-shaped MVP for beef traceability using:
- `moopool` pending event queue
- `UCowXO` state model
- Proof of Moo attestation/finality
- mined condition = slaughter + cool-room confirmation

No tradable token or exchange mechanics are included.

## 2) MVP Capabilities

- Register animals and initialize UCowXO genesis outputs
- Transfer custody across organizations
- Record slaughter events and derive carcass branches
- Confirm cool-room status with required multi-party attestations
- Query current status and full provenance by asset ID
- Export audit/integrity reports

## 3) Delivery Phases

## Phase 1: Protocol and Data Foundation (Week 1-2)

Deliverables:
- frozen domain vocabulary and state machine
- relational schema for append-only ledger and UCowXO tables
- canonical payload serialization and tx hashing utility

Milestones:
- `M1.1` schema migration scripts run cleanly
- `M1.2` replay engine can process synthetic genesis dataset
- `M1.3` deterministic re-run produces identical checksums

Exit criteria:
- architecture review sign-off
- replay determinism demonstrated in CI

## Phase 2: Validation Engine + Moopool (Week 3-4)

Deliverables:
- transaction submission endpoint
- validation pipeline with reason codes
- moopool queue processor
- block/batch finalization writer

Milestones:
- `M2.1` validation rejects invalid signatures/transitions
- `M2.2` duplicate input spend is consistently blocked
- `M2.3` accepted events finalize into blocks with lineage links

Exit criteria:
- conflict handling tests passing
- throughput baseline captured

## Phase 3: Proof of Moo Attestations (Week 5)

Deliverables:
- role-based attestation checks
- threshold policy enforcement for slaughter/cool-room
- finality state progression (`SOFT_ACCEPTED` -> `FINALIZED` -> `IRREVERSIBLE`)

Milestones:
- `M3.1` slaughter tx blocked without required role signatures
- `M3.2` cool-room confirmation blocked without inspector attestation
- `M3.3` irreversible height advancement works at configured depth

Exit criteria:
- mined rule can be proven for test carcass assets

## Phase 4: Query API + Dashboard (Week 6-7)

Deliverables:
- provenance endpoints
- current asset state endpoint with mined flag
- audit/integrity endpoints
- simple operator dashboard (register, transfer, slaughter, cool-room, trace view)

Milestones:
- `M4.1` dashboard supports complete happy-path workflow
- `M4.2` provenance endpoint returns full lineage graph
- `M4.3` mined proof endpoint returns required evidence bundle

Exit criteria:
- end-to-end UAT scenario passes with multiple actors

## Phase 5: Pilot Hardening (Week 8)

Deliverables:
- observability dashboards and alerting basics
- backup/snapshot strategy
- operational runbook
- security review checklist completion

Milestones:
- `M5.1` recovery drill from snapshot to latest block
- `M5.2` key revocation flow tested and documented
- `M5.3` audit export accepted by pilot compliance reviewer

Exit criteria:
- pilot readiness sign-off

## 4) Suggested Team Split

- Backend Engineer: ledger, validation, finality
- Platform Engineer: auth, key management, observability, deployment
- Frontend Engineer: dashboard workflows and trace visualization
- Domain Lead (Ops/Compliance): state rules and acceptance data scenarios

## 5) Test Plan

### Unit Tests

- canonical serialization and tx hash consistency
- state machine transition validity matrix
- signature verification and key status checks
- attestation threshold evaluator

### Integration Tests

- submit -> validate -> moopool -> finalize pipeline
- UCowXO spend/create behavior across split/merge
- conflict rejection on duplicate spends
- mined condition enforcement

### End-to-End Scenarios

1. Register cow -> transfer -> slaughter -> cool-room -> query mined proof.
2. Attempt cool-room confirm before slaughter -> expect rejection.
3. Attempt duplicate slaughter on same animal branch -> expect rejection.
4. Revoke signer key and resubmit signed tx -> expect signature rejection.

### Non-Functional Tests

- replay performance from genesis target dataset
- concurrent submissions under load
- database failover and recovery test

## 6) Acceptance Test Checklist

- [ ] Every finalized tx is attributable to authorized signer role(s)
- [ ] UCowXO set recomputes deterministically from genesis
- [ ] Conflicting custody/slaughter claims are rejected
- [ ] Asset marked mined only after slaughter + cool-room confirmation
- [ ] Provenance retrieval works by package/batch/carcass identifier

## 7) Risks and Mitigations

- Ambiguous real-world process variations
  - Mitigation: role/state matrix as policy config with versioning
- Incomplete partner signature participation
  - Mitigation: queue alerts and SLA escalation for missing attestations
- Key compromise or poor key hygiene
  - Mitigation: key rotation policy and immediate revocation endpoint
- Data ingestion quality from external systems
  - Mitigation: schema validation and quarantined ingestion path

## 8) Definition of Done (MVP)

MVP is complete when:
- all phase exit criteria are met
- acceptance checklist is fully passed
- pilot actor group can run traceability workflow in staging
- compliance reviewer can independently verify mined and provenance proofs
