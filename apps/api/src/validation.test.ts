import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TransactionEvent } from "@mupool/domain";

const queryMock = vi.fn();

vi.mock("@mupool/db", () => {
  return {
    pool: {
      query: queryMock
    }
  };
});

describe("validateTx", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("rejects cool-room confirm when input is not slaughtered carcass", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ ucowxo_id: "u1", state: "IN_TRANSIT", asset_type: "animal" }]
    });
    const { validateTx } = await import("./validation.js");
    const tx: TransactionEvent = {
      event_type: "CONFIRM_COOL_ROOM",
      created_at: new Date().toISOString(),
      inputs: [{ ucowxo_id: "u1" }],
      outputs: [
        {
          asset_type: "carcass",
          asset_id: "C-1",
          owner_org_id: "ORG_SLAUGHTER_7",
          state: "IN_COOL_ROOM_CONFIRMED"
        }
      ],
      signatures: [
        {
          org_id: "ORG_SLAUGHTER_7",
          role: "Slaughterhouse",
          key_id: "k1",
          algorithm: "ed25519",
          signature: "ZGV2"
        },
        {
          org_id: "ORG_INSPECT_9",
          role: "Inspector",
          key_id: "k2",
          algorithm: "ed25519",
          signature: "ZGV2"
        }
      ]
    };

    const result = await validateTx(tx);
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain("COOL_ROOM_INPUT_NOT_CARCASS");
    expect(result.reasons).toContain("DEPENDENCY_NOT_FINALIZED");
  });
});
