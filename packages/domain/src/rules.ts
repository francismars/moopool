import type { ActorRole, AssetState, EventType, TransactionEvent, ValidationResult } from "./types.js";

type TransitionKey = `${AssetState}->${AssetState}`;

const allowedTransitions = new Set<TransitionKey>([
  "REGISTERED->ON_FARM",
  "ON_FARM->IN_TRANSIT",
  "IN_TRANSIT->RECEIVED_AT_SLAUGHTERHOUSE",
  "RECEIVED_AT_SLAUGHTERHOUSE->SLAUGHTERED",
  "SLAUGHTERED->IN_COOL_ROOM_CONFIRMED",
  "IN_COOL_ROOM_CONFIRMED->CUT_LOT",
  "CUT_LOT->PACKED_LOT",
  "PACKED_LOT->DISTRIBUTED_LOT"
]);

const eventRoleRequirements: Record<EventType, ActorRole[]> = {
  REGISTER_ANIMAL: ["FarmOperator"],
  TRANSFER_CUSTODY: ["FarmOperator", "Transporter", "Slaughterhouse"],
  RECORD_HEALTH_EVENT: ["FarmOperator"],
  RECORD_SLAUGHTER: ["Slaughterhouse", "Inspector"],
  CONFIRM_COOL_ROOM: ["Slaughterhouse", "Inspector"],
  SPLIT_LOT: ["Slaughterhouse"],
  MERGE_LOT: ["Slaughterhouse"]
};

export function isStateTransitionAllowed(from: AssetState, to: AssetState): boolean {
  return allowedTransitions.has(`${from}->${to}`);
}

export function requiredRolesForEvent(eventType: EventType): ActorRole[] {
  return eventRoleRequirements[eventType];
}

export function hasRoleThreshold(event: TransactionEvent): boolean {
  const requiredRoles = requiredRolesForEvent(event.event_type);
  const rolesOnTx = new Set(event.signatures.map((s) => s.role));
  if (event.event_type === "RECORD_SLAUGHTER" || event.event_type === "CONFIRM_COOL_ROOM") {
    return requiredRoles.every((role) => rolesOnTx.has(role));
  }
  return requiredRoles.some((role) => rolesOnTx.has(role));
}

export function isMinedState(eventType: EventType, outputState: AssetState): boolean {
  return eventType === "CONFIRM_COOL_ROOM" && outputState === "IN_COOL_ROOM_CONFIRMED";
}

export function validateBasicDomainRules(event: TransactionEvent): ValidationResult {
  const reasons: string[] = [];
  if (!event.event_type) reasons.push("INVALID_EVENT_TYPE");
  if (!event.created_at) reasons.push("MISSING_CREATED_AT");
  if (!event.outputs.length) reasons.push("MISSING_OUTPUTS");
  if (!event.signatures.length) reasons.push("MISSING_SIGNATURES");
  if (!hasRoleThreshold(event)) reasons.push("ATTESTATION_THRESHOLD_NOT_MET");
  return { valid: reasons.length === 0, reasons };
}
