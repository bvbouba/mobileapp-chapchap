/** Company physical ticket numbers (N° ticket compagnie) on order metadata. */

export const COMPANY_TICKET_NUMBER_KEY = "company_ticket_number";
export const COMPANY_TICKET_NUMBERS_KEY = "company_ticket_numbers";

function metaValue(
  metadata: Array<{ key?: string | null; value?: string | null }> | null | undefined,
  key: string,
): string {
  const want = key.toLowerCase();
  for (const m of metadata ?? []) {
    if ((m.key ?? "").toLowerCase() === want) return (m.value ?? "").trim();
  }
  return "";
}

/** Parse stored company ticket numbers (multi CSV + legacy single key). */
export function parseCompanyTicketNumbers(
  metadata: Array<{ key?: string | null; value?: string | null }> | null | undefined,
): string[] {
  const csv = metaValue(metadata, COMPANY_TICKET_NUMBERS_KEY);
  if (csv) {
    return csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = metaValue(metadata, COMPANY_TICKET_NUMBER_KEY);
  return single ? [single] : [];
}
