/**
 * Human-facing confirmation code shown on customer tickets.
 * Same algorithm as operators app — staff search uses metadata key confirmation_code.
 */
export const CONFIRMATION_CODE_KEY = "confirmation_code";

export const generateShortCode = (saleorId: string): string => {
  let hash = 0;
  for (let i = 0; i < saleorId.length; i++) {
    const char = saleorId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase().substring(0, 5);
};

export function confirmationCodeMetadataInput(
  saleorId: string,
): Array<{ key: string; value: string }> {
  return [{ key: CONFIRMATION_CODE_KEY, value: generateShortCode(saleorId) }];
}

/** Prefer stored metadata (searchable); fall back to hashing the order id (legacy tickets). */
export function getConfirmationCode(order: {
  id: string;
  metadata?: Array<{ key?: string | null; value?: string | null }> | null;
}): string {
  for (const m of order.metadata ?? []) {
    if ((m.key ?? "").trim().toLowerCase() === CONFIRMATION_CODE_KEY) {
      const v = (m.value ?? "").trim().toUpperCase();
      if (v) return v;
    }
  }
  return generateShortCode(order.id);
}
