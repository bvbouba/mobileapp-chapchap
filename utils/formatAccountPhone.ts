/** Display phone from virtual email local-part (`{e164}@chapchapticket.com`). */
export function formatAccountPhone(email?: string | null): string {
  const local = email?.split("@")[0] || "";
  const digits = local.replace(/\D/g, "");
  if (!digits) return "—";

  if (digits.startsWith("225") && digits.length >= 13) {
    const national = digits.slice(3);
    const grouped = national.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    return `+225 ${grouped}`;
  }

  return `+${digits}`;
}

/** E.164 phone for form inputs from ChapChap virtual email. */
export function e164FromAccountEmail(email?: string | null): string {
  const local = (email?.split("@")[0] || "").trim();
  if (!local) return "";
  if (local.startsWith("+")) return local.replace(/\s/g, "");
  const digits = local.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

export function formatMoneyLabel(amount: number, currency?: string | null): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const cur = (currency || "XOF").toUpperCase();
  if (cur === "XOF" || cur === "CFA" || cur === "FCFA") return `${formatted} FCFA`;
  return `${formatted} ${cur}`;
}

export function toWhatsAppUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
