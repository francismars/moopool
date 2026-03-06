import { describe, expect, it } from "vitest";
import { hasRoleThreshold, isMinedState, validateBasicDomainRules } from "./rules.js";
import type { TransactionEvent } from "./types.js";

function baseTx(): TransactionEvent {
  return {
    event_type: "TRANSFER_CUSTODY",
    created_at: new Date().toISOString(),
    inputs: [{ ucowxo_id: "u1" }],
    outputs: [
      {
        asset_type: "animal",
        asset_id: "EID-1",
        owner_org_id: "ORG_X",
        state: "IN_TRANSIT"
      }
    ],
    signatures: [
      {
        org_id: "ORG_X",
        role: "Transporter",
        key_id: "k1",
        algorithm: "ed25519",
        signature: "ZGV2"
      }
    ]
  };
}

describe("domain rules", () => {
  it("accepts standard events with one authorized role", () => {
    expect(hasRoleThreshold(baseTx())).toBe(true);
  });

  it("requires slaughterhouse + inspector for slaughter", () => {
    const firstSig = baseTx().signatures[0];
    if (!firstSig) throw new Error("missing base signature");
    const tx: TransactionEvent = {
      ...baseTx(),
      event_type: "RECORD_SLAUGHTER",
      signatures: [firstSig]
    };
    expect(hasRoleThreshold(tx)).toBe(false);
  });

  it("marks mined only at cool-room confirmation", () => {
    expect(isMinedState("CONFIRM_COOL_ROOM", "IN_COOL_ROOM_CONFIRMED")).toBe(true);
    expect(isMinedState("RECORD_SLAUGHTER", "SLAUGHTERED")).toBe(false);
  });

  it("rejects missing signatures", () => {
    const tx: TransactionEvent = { ...baseTx(), signatures: [] };
    const validation = validateBasicDomainRules(tx);
    expect(validation.valid).toBe(false);
    expect(validation.reasons).toContain("MISSING_SIGNATURES");
  });
});
