CREATE TABLE IF NOT EXISTS actors (
  org_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS actor_keys (
  key_id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES actors(org_id),
  public_key_pem TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS ledger_blocks (
  height BIGINT PRIMARY KEY,
  block_id TEXT UNIQUE NOT NULL,
  prev_block_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validator_set_hash TEXT NOT NULL,
  tx_root_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('FINALIZED', 'IRREVERSIBLE'))
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  tx_id TEXT PRIMARY KEY,
  height BIGINT REFERENCES ledger_blocks(height),
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  payload_json JSONB NOT NULL,
  payload_hash TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('SOFT_ACCEPTED', 'FINALIZED', 'IRREVERSIBLE', 'REJECTED')),
  rejection_code TEXT NULL
);

CREATE TABLE IF NOT EXISTS ledger_attestations (
  attestation_id TEXT PRIMARY KEY,
  tx_id TEXT NOT NULL REFERENCES ledger_transactions(tx_id),
  org_id TEXT NOT NULL,
  role TEXT NOT NULL,
  key_id TEXT NOT NULL,
  signature TEXT NOT NULL,
  verified BOOLEAN NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_id, org_id, role)
);

CREATE TABLE IF NOT EXISTS tx_inputs (
  tx_id TEXT NOT NULL REFERENCES ledger_transactions(tx_id),
  input_index INT NOT NULL,
  ucowxo_id TEXT NOT NULL,
  PRIMARY KEY (tx_id, input_index)
);

CREATE TABLE IF NOT EXISTS tx_outputs (
  tx_id TEXT NOT NULL REFERENCES ledger_transactions(tx_id),
  output_index INT NOT NULL,
  ucowxo_id TEXT NOT NULL,
  PRIMARY KEY (tx_id, output_index),
  UNIQUE (ucowxo_id)
);

CREATE TABLE IF NOT EXISTS ucowxo_current (
  ucowxo_id TEXT PRIMARY KEY,
  origin_tx_id TEXT NOT NULL,
  parent_ucowxo_id TEXT NULL,
  asset_type TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  owner_org_id TEXT NOT NULL,
  state TEXT NOT NULL,
  metadata_hash TEXT NULL,
  created_height BIGINT NOT NULL,
  spent_by_tx_id TEXT NULL,
  spent_height BIGINT NULL
);

CREATE INDEX IF NOT EXISTS idx_ucowxo_asset_id ON ucowxo_current(asset_id);
CREATE INDEX IF NOT EXISTS idx_ucowxo_owner_state ON ucowxo_current(owner_org_id, state);
CREATE INDEX IF NOT EXISTS idx_ucowxo_unspent ON ucowxo_current(ucowxo_id) WHERE spent_by_tx_id IS NULL;

CREATE TABLE IF NOT EXISTS integrity_snapshots (
  snapshot_height BIGINT PRIMARY KEY,
  ucowxo_checksum TEXT NOT NULL,
  ledger_checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
