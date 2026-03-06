export type EventType =
  | "REGISTER_ANIMAL"
  | "TRANSFER_CUSTODY"
  | "RECORD_HEALTH_EVENT"
  | "RECORD_SLAUGHTER"
  | "CONFIRM_COOL_ROOM"
  | "SPLIT_LOT"
  | "MERGE_LOT";

export type AssetType = "animal" | "carcass" | "lot";

export type AssetState =
  | "REGISTERED"
  | "ON_FARM"
  | "IN_TRANSIT"
  | "RECEIVED_AT_SLAUGHTERHOUSE"
  | "SLAUGHTERED"
  | "IN_COOL_ROOM_CONFIRMED"
  | "CUT_LOT"
  | "PACKED_LOT"
  | "DISTRIBUTED_LOT";

export type ActorRole =
  | "FarmOperator"
  | "Transporter"
  | "Slaughterhouse"
  | "Inspector"
  | "Auditor"
  | "Validator";

export interface TxInput {
  ucowxo_id: string;
  owner_org_id?: string;
}

export interface TxOutput {
  asset_type: AssetType;
  asset_id: string;
  owner_org_id: string;
  state: AssetState;
  metadata_hash?: string | null;
}

export interface TxSignature {
  org_id: string;
  role: ActorRole;
  key_id: string;
  algorithm: "ed25519";
  signature: string;
}

export interface TransactionEvent {
  tx_id?: string;
  schema_version?: string;
  event_type: EventType;
  created_at: string;
  network_time?: number;
  inputs: TxInput[];
  outputs: TxOutput[];
  refs?: Record<string, unknown>;
  signatures: TxSignature[];
}

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}
