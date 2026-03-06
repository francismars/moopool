# UCowXO State Model and Ledger Schema (v0.1)

## 1) Overview

This document defines:
- append-only ledger storage structures
- transaction/event schema
- UCowXO materialized state model
- deterministic replay rules

Design objective: any node can rebuild the same UCowXO set from genesis with no ambiguity.

## 2) Logical Data Stores

- `ledger_blocks` (append-only): finalized block/batch headers
- `ledger_transactions` (append-only): canonical transactions/events
- `ledger_attestations` (append-only): per-role signatures for transactions
- `ucowxo_current` (materialized): current unspent outputs for fast queries
- `ucowxo_history` (derived or query view): spent/unspent lineage traversal

## 3) Canonical Event Schema

```json
{
  "tx_id": "sha256(canonical_payload)",
  "event_type": "REGISTER_ANIMAL",
  "created_at": "2026-03-06T11:22:33Z",
  "network_time": 1772805753,
  "inputs": [
    {
      "ucowxo_id": "prev_output_hash",
      "owner_org_id": "ORG_FARM_A"
    }
  ],
  "outputs": [
    {
      "asset_type": "animal",
      "asset_id": "EID-12345",
      "owner_org_id": "ORG_FARM_A",
      "state": "ON_FARM",
      "metadata_hash": "sha256(blob)"
    }
  ],
  "refs": {
    "parent_tx_ids": ["..."],
    "transport_doc_id": null,
    "facility_id": "FAC-001"
  },
  "signatures": [
    {
      "org_id": "ORG_FARM_A",
      "role": "FarmOperator",
      "key_id": "k-2026-01",
      "algorithm": "ed25519",
      "signature": "base64..."
    }
  ]
}
```

## 4) Table-Level Schema (MVP)

### 4.1 `ledger_blocks`

- `height` BIGINT PK
- `block_id` TEXT UNIQUE
- `prev_block_id` TEXT NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `validator_set_hash` TEXT NOT NULL
- `tx_root_hash` TEXT NOT NULL
- `status` TEXT CHECK in (`FINALIZED`, `IRREVERSIBLE`)

### 4.2 `ledger_transactions`

- `tx_id` TEXT PK
- `height` BIGINT NOT NULL FK -> `ledger_blocks.height`
- `event_type` TEXT NOT NULL
- `created_at` TIMESTAMP NOT NULL
- `payload_json` JSONB NOT NULL (canonical serialized payload)
- `payload_hash` TEXT NOT NULL
- `validation_status` TEXT CHECK in (`ACCEPTED`, `REJECTED`)
- `rejection_code` TEXT NULL

### 4.3 `ledger_attestations`

- `attestation_id` TEXT PK
- `tx_id` TEXT NOT NULL FK -> `ledger_transactions.tx_id`
- `org_id` TEXT NOT NULL
- `role` TEXT NOT NULL
- `key_id` TEXT NOT NULL
- `signature` TEXT NOT NULL
- `verified` BOOLEAN NOT NULL
- `verified_at` TIMESTAMP NOT NULL

Unique constraint:
- (`tx_id`, `org_id`, `role`) to prevent duplicate role attestations from one org.

### 4.4 `ucowxo_current`

- `ucowxo_id` TEXT PK
- `origin_tx_id` TEXT NOT NULL
- `asset_type` TEXT NOT NULL
- `asset_id` TEXT NOT NULL
- `owner_org_id` TEXT NOT NULL
- `state` TEXT NOT NULL
- `metadata_hash` TEXT NULL
- `created_height` BIGINT NOT NULL
- `spent_by_tx_id` TEXT NULL
- `spent_height` BIGINT NULL

Indexes:
- (`asset_id`)
- (`owner_org_id`, `state`)
- partial index where `spent_by_tx_id IS NULL`

## 5) Input/Output Linking Model

To preserve lineage:

- `tx_inputs`:
  - `tx_id`, `input_index`, `ucowxo_id`
- `tx_outputs`:
  - `tx_id`, `output_index`, `ucowxo_id`

`ucowxo_id` recommended derivation:
`sha256(tx_id + ":" + output_index)`.

## 6) Materialized UCowXO Derivation Rules

Replay algorithm (deterministic):
1. Read blocks in ascending `height`.
2. For each accepted tx:
   - verify all input UCowXOs are unspent at replay time
   - mark inputs as spent by current tx
   - create outputs as new UCowXO rows
3. Reject tx during replay if:
   - input missing
   - input already spent
   - transition invalid by state machine
4. Commit block atomically; rollback whole block on inconsistency.

Determinism requirements:
- canonical serialization for tx hash
- stable conflict ordering by `tx_id` lexical order within same block
- identical validator rule set version on replay

## 7) State Machine Rules for Storage Layer

Storage and validation layer must enforce:
- no two active unspent UCowXOs for same non-split branch output
- slaughter events must consume an `animal` asset branch output
- cool-room confirmations must consume a `carcass` branch output produced by slaughter
- split outputs must carry `parent_ucowxo_id` reference
- merge inputs must share compatible provenance constraints (configurable)

## 8) Lineage and Provenance Queries

Required query patterns:
- by `asset_id`: current state + owner + mined flag
- by `tx_id`: full tx payload, attestations, block inclusion
- forward lineage from genesis output to current leaves
- backward lineage from package lot to originating animal

Recommended approach:
- recursive SQL CTE for lineage traversal in MVP
- optional graph projection for scale phase

## 9) Integrity and Operational Controls

- append-only protections on ledger tables (no update/delete except explicit admin migration mode)
- periodic state snapshots:
  - `snapshot_height`
  - UCowXO checksum
  - ledger checksum
- integrity checks:
  - sum(active + spent) consistency
  - no orphan input references
  - signature verification sampling or full pass

## 10) Migration Path

MVP: PostgreSQL relational model with JSON payload columns.

Scale options:
- partition `ledger_transactions` by height range
- dedicated event streaming + state service
- cryptographic accumulator for lightweight inclusion proofs
