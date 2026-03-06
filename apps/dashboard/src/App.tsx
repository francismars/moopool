import { FormEvent, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://localhost:4000/api/v1";

type EventType = "REGISTER_ANIMAL" | "TRANSFER_CUSTODY" | "RECORD_SLAUGHTER" | "CONFIRM_COOL_ROOM";

function requestSignature(path: string): string {
  void path;
  return "dev";
}

export function App() {
  const [assetId, setAssetId] = useState("EID-12345");
  const [ownerOrgId, setOwnerOrgId] = useState("ORG_FARM_A");
  const [eventType, setEventType] = useState<EventType>("REGISTER_ANIMAL");
  const [inputUcowxoId, setInputUcowxoId] = useState("");
  const [output, setOutput] = useState<string>("");
  const [queryResult, setQueryResult] = useState<string>("");
  const [actorOrgId, setActorOrgId] = useState("ORG_FARM_A");
  const [newKeyId, setNewKeyId] = useState("dev-key-2");
  const [newKeyPem, setNewKeyPem] = useState("-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----");
  const [eventFilter, setEventFilter] = useState("");

  const state = useMemo(() => {
    if (eventType === "REGISTER_ANIMAL") return "ON_FARM";
    if (eventType === "TRANSFER_CUSTODY") return "IN_TRANSIT";
    if (eventType === "RECORD_SLAUGHTER") return "SLAUGHTERED";
    return "IN_COOL_ROOM_CONFIRMED";
  }, [eventType]);

  async function submitTx(e: FormEvent) {
    e.preventDefault();
    try {
      const tx = {
        event_type: eventType,
        created_at: new Date().toISOString(),
        inputs: inputUcowxoId ? [{ ucowxo_id: inputUcowxoId }] : [],
        outputs: [
          {
            asset_type: eventType === "REGISTER_ANIMAL" || eventType === "TRANSFER_CUSTODY" ? "animal" : "carcass",
            asset_id: assetId,
            owner_org_id: ownerOrgId,
            state
          }
        ],
        signatures: [
          {
            org_id: ownerOrgId,
            role:
              eventType === "RECORD_SLAUGHTER" || eventType === "CONFIRM_COOL_ROOM"
                ? "Slaughterhouse"
                : "FarmOperator",
            key_id: "dev-key",
            algorithm: "ed25519",
            signature: "ZGV2"
          },
          ...(eventType === "RECORD_SLAUGHTER" || eventType === "CONFIRM_COOL_ROOM"
            ? [
                {
                  org_id: "ORG_INSPECT_9",
                  role: "Inspector",
                  key_id: "inspect-key",
                  algorithm: "ed25519",
                  signature: "ZGV2"
                }
              ]
            : [])
        ]
      };

      const path = "/transactions/submit";
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mupool-signature": requestSignature(path)
        },
        body: JSON.stringify({ tx })
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      setOutput(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function fetchCurrent() {
    const path = `/assets/${assetId}/current`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function fetchProvenance() {
    const path = `/assets/${assetId}/provenance`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function fetchMinedProof() {
    const path = `/proofs/mined/${assetId}`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function fetchIntegrity() {
    const path = "/audit/integrity";
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function fetchActor() {
    const path = `/actors/${actorOrgId}`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function addKey(e: FormEvent) {
    e.preventDefault();
    const path = `/actors/${actorOrgId}/keys`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mupool-signature": requestSignature(path)
      },
      body: JSON.stringify({ key_id: newKeyId, public_key_pem: newKeyPem })
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function revokeKey() {
    const path = `/actors/${actorOrgId}/keys/${newKeyId}/revoke`;
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  async function fetchAuditEvents() {
    const query = eventFilter ? `?event_type=${encodeURIComponent(eventFilter)}` : "";
    const path = `/audit/events${query}`;
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "x-mupool-signature": requestSignature(path) }
    });
    const data = await res.json();
    setQueryResult(JSON.stringify(data, null, 2));
  }

  return (
    <main className="container">
      <h1>Mupool Operator Console</h1>
      <p className="sub">UCowXO lifecycle and moopool submission workflow</p>

      <section className="panel">
        <h2>Lifecycle Event</h2>
        <form onSubmit={submitTx} className="grid">
          <label>
            Event Type
            <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
              <option value="REGISTER_ANIMAL">Register Animal</option>
              <option value="TRANSFER_CUSTODY">Transfer Custody</option>
              <option value="RECORD_SLAUGHTER">Record Slaughter</option>
              <option value="CONFIRM_COOL_ROOM">Confirm Cool Room</option>
            </select>
          </label>
          <label>
            Asset ID
            <input value={assetId} onChange={(e) => setAssetId(e.target.value)} />
          </label>
          <label>
            Owner Org ID
            <input value={ownerOrgId} onChange={(e) => setOwnerOrgId(e.target.value)} />
          </label>
          <label>
            Input UCowXO ID (optional)
            <input value={inputUcowxoId} onChange={(e) => setInputUcowxoId(e.target.value)} />
          </label>
          <button type="submit">Submit to moopool</button>
        </form>
        <pre>{output}</pre>
      </section>

      <section className="panel">
        <h2>Trace and Proof</h2>
        <div className="actions">
          <button onClick={fetchCurrent}>Current Asset State</button>
          <button onClick={fetchProvenance}>Provenance</button>
          <button onClick={fetchMinedProof}>Mined Proof</button>
          <button onClick={fetchIntegrity}>Integrity Snapshot</button>
        </div>
        <pre>{queryResult}</pre>
      </section>

      <section className="panel">
        <h2>Actor and Key Management</h2>
        <form onSubmit={addKey} className="grid">
          <label>
            Actor Org ID
            <input value={actorOrgId} onChange={(e) => setActorOrgId(e.target.value)} />
          </label>
          <label>
            Key ID
            <input value={newKeyId} onChange={(e) => setNewKeyId(e.target.value)} />
          </label>
          <label>
            Public Key PEM
            <input value={newKeyPem} onChange={(e) => setNewKeyPem(e.target.value)} />
          </label>
          <button type="submit">Add Key</button>
        </form>
        <div className="actions">
          <button onClick={fetchActor}>Get Actor</button>
          <button onClick={revokeKey}>Revoke Key</button>
        </div>
      </section>

      <section className="panel">
        <h2>Auditor Events</h2>
        <div className="actions">
          <input
            placeholder="Optional event type filter"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          />
          <button onClick={fetchAuditEvents}>Fetch Audit Events</button>
        </div>
      </section>
    </main>
  );
}
