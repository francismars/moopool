# Mupool Protocol Specification (v0.1)

## 1) Purpose

Mupool is a beef traceability protocol inspired by Bitcoin's transaction model.
It tracks livestock and carcass custody as a verifiable chain of signed events.

Core naming and semantics:
- `moopool` (double `oo`): queue of valid pending events not yet finalized
- `UCowXO`: Unspent Cattle Output, representing the current valid state object
- `Proof of Moo`: validator attestation/finality process
- "Mined": a carcass is considered mined only after slaughter and cool-room confirmation

The protocol intentionally excludes tradable token economics.

## 2) Participants and Roles

- `FarmOperator`: registers animals, records farm-side events
- `Transporter`: accepts and transfers custody during transport legs
- `Slaughterhouse`: records slaughter event and carcass identifiers
- `Inspector`: provides compliance checks and cool-room confirmation
- `Auditor`: read-only verification role with elevated query access
- `Validator`: verifies signatures/rules and finalizes event batches

One organization may hold multiple roles, but every signed action must declare role context.

## 3) Identity and Signatures

Every organization has:
- organization ID (`org_id`)
- one or more public keys (`key_id`, algorithm, validity period)
- role assignment and status (active/suspended/revoked)

All protocol events are signed with:
- signer key ID
- signer org ID
- signer role used for that event
- signature over canonical serialized event payload

Events with invalid signatures, expired keys, revoked keys, or inactive roles are rejected.

## 4) UCowXO Model

`UCowXO` is the current unspent state output for an animal or derived carcass lot.

Each UCowXO has:
- `ucowxo_id` (hash-derived identifier)
- `asset_type` (`animal`, `carcass`, `lot`)
- `asset_id` (physical identity, tag ID, or lot ID)
- `owner_org_id` (current custodian)
- `state` (lifecycle state machine value)
- `origin_tx_id` (transaction creating this output)
- `created_at_block_height`
- optional metadata hash references

Spending model:
- A valid transaction consumes one or more existing UCowXOs as inputs.
- The transaction produces one or more new UCowXOs as outputs.
- Consumed UCowXOs become spent and can never be used again.
- Exactly one active UCowXO exists per non-split asset branch.

## 5) Lifecycle States and Allowed Transitions

Primary animal flow:
1. `REGISTERED`
2. `ON_FARM`
3. `IN_TRANSIT`
4. `RECEIVED_AT_SLAUGHTERHOUSE`
5. `SLAUGHTERED`
6. `IN_COOL_ROOM_CONFIRMED` (mined condition reached)
7. optional downstream lot states (`CUT_LOT`, `PACKED_LOT`, `DISTRIBUTED_LOT`)

Allowed transition examples:
- `REGISTER_ANIMAL`: genesis output for tagged animal
- `TRANSFER_CUSTODY`: owner changes; state may remain same or move to transit/received
- `RECORD_HEALTH_EVENT`: metadata update with no owner change (consumes/recreates UCowXO)
- `RECORD_SLAUGHTER`: animal UCowXO spent, carcass UCowXO(s) created
- `CONFIRM_COOL_ROOM`: carcass UCowXO state updates to `IN_COOL_ROOM_CONFIRMED`
- `SPLIT_LOT`: one UCowXO to many lot UCowXOs
- `MERGE_LOT`: many compatible lot UCowXOs to one UCowXO

Invalid transitions are rejected deterministically.

## 6) "Mined" Rule

A cow/carcass is "mined" only when all are true:
1. A valid `RECORD_SLAUGHTER` transaction is finalized.
2. A valid `CONFIRM_COOL_ROOM` transaction is finalized.
3. Required multi-party attestations exist (see Proof of Moo thresholds).
4. Event timestamps and custody continuity checks pass.

Before this point, the asset is not mined, even if slaughter is recorded but cool-room confirmation is missing.

## 7) Proof of Moo

Proof of Moo is a role-aware attestation and validation process for finalizing moopool events.

### 7.1 Validation pipeline

1. Event enters `moopool`.
2. Validators verify:
   - schema validity and canonical hash
   - signature and key validity
   - role authorization
   - UCowXO input existence and unspent status
   - state machine transition rules
   - timestamp and sequence constraints
3. Event is accepted/rejected with deterministic reason codes.
4. Accepted events are included into finalized blocks/batches.

### 7.2 Signature thresholds by event class

- Standard custody events (`REGISTER_ANIMAL`, `TRANSFER_CUSTODY`, transport receipts):
  - minimum 1 valid signer from authorized owning/receiving org context
- High-risk transformation events (`RECORD_SLAUGHTER`):
  - at least 2 attestations:
    - one from `Slaughterhouse`
    - one from `Inspector` or independent compliance actor
- Mined-completion event (`CONFIRM_COOL_ROOM`):
  - at least 2 attestations:
    - one from `Slaughterhouse`
    - one from `Inspector`

If threshold not met, event cannot finalize.

### 7.3 Finality

- `SoftAccepted`: event validated and queued, not yet irreversible
- `Finalized`: event included in finalized batch at height `H`
- `Irreversible`: event has at least `N` confirmed finalized batches after `H`

Default `N` for MVP: `2`.
Once irreversible, event rollback is disallowed by protocol policy.

## 8) Double-Spend and Conflict Rules

The protocol rejects:
- duplicate spend of any UCowXO input
- concurrent custody claims for same asset branch
- incompatible split/merge lineage
- duplicate slaughter claims on already transformed animal branch
- out-of-order cool-room confirmation without prior slaughter finalization

Tie-breaking for same-height conflicts is deterministic by transaction hash ordering.

## 9) Audit and Query Guarantees

The protocol must support:
- full provenance path from genesis to current output
- current custodian and state lookup for any asset ID
- mined status proofs (slaughter + cool-room confirmations)
- cryptographic inclusion proof for finalized transactions
- deterministic recomputation of UCowXO set from genesis ledger

## 10) Non-Goals for v0.1

- No speculative tokenomics
- No decentralized anonymous participation
- No smart-contract runtime
- No consumer-facing payment rails
