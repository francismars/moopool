# Mupool API Specification (v0.1)

## 1) API Conventions

- Base path: `/api/v1`
- Content type: `application/json`
- Auth: mTLS and/or signed bearer token per org
- Idempotency: supported on write endpoints via `Idempotency-Key` header
- Time format: ISO 8601 UTC

Standard response envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "request_id": "req_abc123"
}
```

Error envelope:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Signature verification failed",
    "details": {}
  },
  "request_id": "req_abc123"
}
```

## 2) Transaction Submission and Validation

### POST `/transactions/submit`

Submits a signed event to `moopool`.

Request:

```json
{
  "tx": {
    "event_type": "TRANSFER_CUSTODY",
    "created_at": "2026-03-06T10:11:12Z",
    "inputs": [{ "ucowxo_id": "u1" }],
    "outputs": [
      {
        "asset_type": "animal",
        "asset_id": "EID-12345",
        "owner_org_id": "ORG_TRANSPORT_1",
        "state": "IN_TRANSIT"
      }
    ],
    "refs": { "transport_doc_id": "DOC-7788" },
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
}
```

Response (`202 Accepted`):

```json
{
  "ok": true,
  "data": {
    "tx_id": "tx_0xabc",
    "status": "SOFT_ACCEPTED",
    "moopool_position": 12033
  },
  "error": null,
  "request_id": "req_01"
}
```

### POST `/transactions/validate`

Performs deterministic dry-run validation without enqueueing.

Response (`200 OK`):

```json
{
  "ok": true,
  "data": {
    "tx_id": "tx_0xabc",
    "valid": false,
    "reasons": ["INPUT_ALREADY_SPENT", "STATE_TRANSITION_INVALID"]
  },
  "error": null,
  "request_id": "req_02"
}
```

### GET `/transactions/{tx_id}`

Returns transaction payload, attestations, and finality status.

Response fields:
- `status`: `SOFT_ACCEPTED | FINALIZED | IRREVERSIBLE | REJECTED`
- `block_height`
- `attestations[]`
- `rejection_code` (if any)

## 3) Provenance and UCowXO Queries

### GET `/assets/{asset_id}/current`

Returns current UCowXO leaf state for asset branch.

Sample response:

```json
{
  "ok": true,
  "data": {
    "asset_id": "EID-12345-CARCASS-A",
    "ucowxo_id": "u_final_123",
    "owner_org_id": "ORG_SLAUGHTER_7",
    "state": "IN_COOL_ROOM_CONFIRMED",
    "is_mined": true,
    "last_tx_id": "tx_0x991"
  },
  "error": null,
  "request_id": "req_03"
}
```

### GET `/assets/{asset_id}/provenance`

Returns full chain-of-custody path (genesis to current).

Query params:
- `direction=full|backward|forward` (default `full`)
- `include_attestations=true|false` (default `false`)

### GET `/ucowxos/{ucowxo_id}`

Returns UCowXO details plus spend info.

### GET `/proofs/mined/{asset_id}`

Returns proof package that mined rule is satisfied:
- slaughter transaction and block proof
- cool-room confirmation transaction and block proof
- required role attestations

## 4) Actor and Key Management

### GET `/actors/{org_id}`

Returns organization roles and status.

### POST `/actors/{org_id}/keys`

Registers a new signing key (role constrained).

### POST `/actors/{org_id}/keys/{key_id}/revoke`

Revokes compromised or retired keys.

## 5) Compliance and Audit APIs

### GET `/audit/events`

Filterable event stream.

Query params:
- `from_height`
- `to_height`
- `event_type`
- `org_id`
- `state`

### GET `/audit/integrity`

Returns node integrity snapshot:
- latest finalized height
- irreversible height
- UCowXO checksum
- ledger checksum

## 6) Webhook Events (Optional MVP+)

Outbound webhook topics:
- `tx.finalized`
- `tx.rejected`
- `asset.mined`
- `key.revoked`

Delivery requirements:
- signed webhook payload
- replay protection nonce
- retry with exponential backoff

## 7) Error Codes

Validation/domain errors:
- `INVALID_SCHEMA`
- `INVALID_SIGNATURE`
- `UNAUTHORIZED_ROLE`
- `INPUT_NOT_FOUND`
- `INPUT_ALREADY_SPENT`
- `STATE_TRANSITION_INVALID`
- `ATTESTATION_THRESHOLD_NOT_MET`
- `DEPENDENCY_NOT_FINALIZED`

Operational errors:
- `RATE_LIMITED`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`

## 8) Versioning and Compatibility

- URI versioning (`/v1`)
- additive response changes only within major version
- breaking changes require `/v2`
- event schema version carried in tx payload (`schema_version`)
