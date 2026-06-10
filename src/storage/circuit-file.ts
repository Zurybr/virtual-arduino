export interface CircuitData {
  id: string;
  name: string;
  components: unknown[];
  wires: unknown[];
  subBoards: unknown[];
  createdAt: string;
  modifiedAt: string;
}

export function serializeCircuit(data: CircuitData): string {
  return JSON.stringify(data, null, 2);
}

export function deserializeCircuit(json: string): CircuitData {
  const parsed: unknown = JSON.parse(json);
  const validation = validateCircuitData(parsed);
  if (!validation.valid) {
    throw new Error(
      `Invalid circuit data: ${validation.errors?.join(", ") ?? "unknown error"}`,
    );
  }
  return parsed as CircuitData;
}

export function validateCircuitData(data: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (data === null || data === undefined || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["Data must be a non-null object"] };
  }

  const record = data as Record<string, unknown>;

  if (typeof record.id !== "string" || record.id.length === 0) {
    errors.push("id must be a non-empty string");
  }

  if (typeof record.name !== "string" || record.name.length === 0) {
    errors.push("name must be a non-empty string");
  }

  if (!Array.isArray(record.components)) {
    errors.push("components must be an array");
  }

  if (!Array.isArray(record.wires)) {
    errors.push("wires must be an array");
  }

  if (!Array.isArray(record.subBoards)) {
    errors.push("subBoards must be an array");
  }

  if (typeof record.createdAt !== "string" || record.createdAt.length === 0) {
    errors.push("createdAt must be a non-empty string");
  }

  if (typeof record.modifiedAt !== "string" || record.modifiedAt.length === 0) {
    errors.push("modifiedAt must be a non-empty string");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
