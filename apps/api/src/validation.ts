import { canonicalSerialize, sha256Hex } from "@mupool/crypto";
import {
  isStateTransitionAllowed,
  validateBasicDomainRules,
  type TransactionEvent,
  type ValidationResult
} from "@mupool/domain";
import { pool } from "@mupool/db";

export async function validateTx(event: TransactionEvent): Promise<ValidationResult> {
  const basic = validateBasicDomainRules(event);
  if (!basic.valid) return basic;

  const reasons: string[] = [];
  if (event.event_type !== "REGISTER_ANIMAL" && event.inputs.length === 0) {
    reasons.push("MISSING_INPUTS");
  }

  type InputRow = { ucowxo_id: string; state: string; asset_type: string };
  const inputRows: InputRow[] = [];

  for (const input of event.inputs) {
    const res = await pool.query(
      `SELECT ucowxo_id, state, asset_type
       FROM ucowxo_current
       WHERE ucowxo_id = $1 AND spent_by_tx_id IS NULL`,
      [input.ucowxo_id]
    );
    if (res.rowCount !== 1) {
      reasons.push("INPUT_NOT_FOUND_OR_SPENT");
      continue;
    }
    inputRows.push(res.rows[0] as InputRow);
  }

  if (event.event_type === "REGISTER_ANIMAL" && event.inputs.length > 0) reasons.push("REGISTER_HAS_INPUTS");
  if (event.event_type !== "REGISTER_ANIMAL" && event.outputs.length === 0) reasons.push("MISSING_OUTPUTS");

  if (inputRows[0] && event.outputs[0]) {
    const fromState = inputRows[0].state;
    const toState = event.outputs[0].state;
    if (fromState !== toState && !isStateTransitionAllowed(fromState as never, toState as never)) {
      reasons.push("STATE_TRANSITION_INVALID");
    }
  }

  if (event.event_type === "RECORD_SLAUGHTER" && inputRows[0]?.asset_type !== "animal") {
    reasons.push("SLAUGHTER_INPUT_NOT_ANIMAL");
  }

  if (event.event_type === "CONFIRM_COOL_ROOM") {
    if (inputRows[0]?.asset_type !== "carcass") reasons.push("COOL_ROOM_INPUT_NOT_CARCASS");
    if (inputRows[0]?.state !== "SLAUGHTERED") reasons.push("DEPENDENCY_NOT_FINALIZED");
  }

  return { valid: reasons.length === 0, reasons };
}

export function attachTxHash(event: TransactionEvent): TransactionEvent {
  const canonical = canonicalSerialize(event);
  return { ...event, tx_id: sha256Hex(canonical) };
}
