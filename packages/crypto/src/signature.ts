import { verify } from "node:crypto";
import type { TxSignature } from "@mupool/domain";

export interface KeyRecord {
  key_id: string;
  org_id: string;
  public_key_pem: string;
  active: boolean;
}

export function verifyEventSignature(payload: string, sig: TxSignature, key: KeyRecord): boolean {
  if (!key.active || key.key_id !== sig.key_id || key.org_id !== sig.org_id) return false;
  try {
    return verify(null, Buffer.from(payload), key.public_key_pem, Buffer.from(sig.signature, "base64"));
  } catch {
    return false;
  }
}
