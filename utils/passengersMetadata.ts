/**
 * Passenger list stored on Checkout/Order public metadata (key: `passengers`).
 * Legacy fallback: `customerNote` as `LastName,FirstName;LastName,FirstName`.
 */

export const PASSENGERS_METADATA_KEY = "passengers";

export type PassengerRecord = {
  firstName: string;
  lastName: string;
};

type MetaItem = { key?: string | null; value?: string | null };

export function metaGet(
  metadata: Array<MetaItem> | null | undefined,
  key: string,
): string {
  const want = key.toLowerCase();
  for (const m of metadata ?? []) {
    if ((m.key ?? "").toLowerCase() === want) return (m.value ?? "").trim();
  }
  return "";
}

export function serializePassengers(passengers: PassengerRecord[]): string {
  return JSON.stringify(
    passengers.map((p) => ({
      firstName: (p.firstName || "").trim(),
      lastName: (p.lastName || "").trim(),
    })),
  );
}

export function passengersMetadataInput(
  passengers: PassengerRecord[],
): { key: string; value: string } {
  return {
    key: PASSENGERS_METADATA_KEY,
    value: serializePassengers(passengers),
  };
}

export function formatPassengerDisplayName(p: PassengerRecord): string {
  const first = (p.firstName || "").trim();
  const last = (p.lastName || "").trim();
  return `${first} ${last}`.trim();
}

function parseFromLegacyNote(note?: string | null): PassengerRecord[] {
  const blocks = (note || "")
    .split(";")
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block) => {
    const parts = block.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return { lastName: parts[0] || "", firstName: parts[1] || "" };
    }
    // Single token — treat as last name
    return { lastName: block, firstName: "" };
  });
}

function parseFromMetadataJson(raw: string): PassengerRecord[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const out: PassengerRecord[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const firstName = String(
        (item as { firstName?: unknown }).firstName ?? "",
      ).trim();
      const lastName = String(
        (item as { lastName?: unknown }).lastName ?? "",
      ).trim();
      if (!firstName && !lastName) continue;
      out.push({ firstName, lastName });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/** Prefer metadata JSON; fall back to legacy customerNote. */
export function parsePassengerRecords(input: {
  metadata?: Array<MetaItem> | null;
  customerNote?: string | null;
}): PassengerRecord[] {
  const fromMeta = parseFromMetadataJson(
    metaGet(input.metadata, PASSENGERS_METADATA_KEY),
  );
  if (fromMeta) return fromMeta;
  return parseFromLegacyNote(input.customerNote);
}

/** Display names for tickets / manifests. */
export function getPassengerDisplayNames(input: {
  metadata?: Array<MetaItem> | null;
  customerNote?: string | null;
  fallback?: string | null;
}): string[] {
  const records = parsePassengerRecords(input);
  const names = records
    .map(formatPassengerDisplayName)
    .map((n) => n.trim())
    .filter(Boolean);
  if (names.length > 0) return names;
  const fb = (input.fallback || "").trim();
  return fb ? [fb] : [];
}
