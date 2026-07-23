/**
 * Saleor Relay global IDs are base64("ProductVariant:12345").
 * Short spoken code for tickets: N° CH-12345.
 */
export function formatTripNumber(variantId: string, prefix = "CH"): string {
  const raw = (variantId ?? "").trim();
  if (!raw) return `${prefix}-—`;

  try {
    if (typeof atob === "function") {
      const decoded = atob(raw); // "ProductVariant:12345"
      const num = decoded.split(":")[1]?.trim();
      if (num && /^\d+$/.test(num)) return `${prefix}-${num}`;
    }
  } catch {
    // fall through
  }

  const tail = raw.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  return `${prefix}-${tail || "—"}`;
}

/** Display label with French prefix, e.g. "N° CH-12345". */
export function formatTripNumberLabel(variantId: string, prefix = "CH"): string {
  return `N° ${formatTripNumber(variantId, prefix)}`;
}
