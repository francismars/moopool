import { rebuildUcowxoFromLedger } from "./replay.js";

async function run() {
  const result = await rebuildUcowxoFromLedger();
  console.log("Replay result:", JSON.stringify(result));
}

run().catch((error) => {
  console.error("Replay check failed", error);
  process.exit(1);
});
