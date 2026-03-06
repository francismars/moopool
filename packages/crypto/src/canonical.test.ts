import { describe, expect, it } from "vitest";
import { canonicalSerialize } from "./canonical.js";
import { sha256Hex } from "./hash.js";

describe("canonical serialization", () => {
  it("serializes object keys in deterministic order", () => {
    const a = canonicalSerialize({ b: 1, a: 2, nested: { z: 9, y: 8 } });
    const b = canonicalSerialize({ nested: { y: 8, z: 9 }, a: 2, b: 1 });
    expect(a).toEqual(b);
  });

  it("produces stable hash", () => {
    const first = sha256Hex(canonicalSerialize({ value: "moo" }));
    const second = sha256Hex(canonicalSerialize({ value: "moo" }));
    expect(first).toEqual(second);
  });
});
