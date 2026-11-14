import { ImageSourcePropType } from "react-native";

export const paystackGatewayId = "chapchap.paystack";
export type PaystackGatewayId = typeof paystackGatewayId;

export type CiMomoProvider = "orange" | "mtn" | "wave";

export const CI_MOMO_PROVIDERS: {
  code: CiMomoProvider;
  label: string;
  shortLabel: string;
  logo: ImageSourcePropType;
  tip: string;
}[] = [
  {
    code: "wave",
    label: "Wave",
    shortLabel: "Wave",
    logo: require("../../../../assets/images/logo/wave.png"),
    tip: "Vous serez redirigé vers l'application Wave pour valider le paiement.",
  },
  {
    code: "orange",
    label: "Orange Money",
    shortLabel: "Orange",
    logo: require("../../../../assets/images/logo/orange.png"),
    tip: "Autorisez la demande de débit sur votre téléphone (notification ou #144#).",
  },
  {
    code: "mtn",
    label: "MTN Mobile Money",
    shortLabel: "MTN",
    logo: require("../../../../assets/images/logo/mtn.png"),
    tip: "Autorisez la demande de débit sur votre téléphone (notification ou USSD).",
  },
];

/**
 * Côte d'Ivoire national prefixes → SIM network (Wave is app-based, never auto-picked).
 * 07/08/09 → Orange · 05/04 → MTN · 01/02/03 → Moov (not charged via Paystack CI yet)
 */
export function detectCiMomoProviderFromPhone(
  phoneE164: string,
): "orange" | "mtn" | null {
  const digits = (phoneE164 || "").replace(/\D/g, "");
  let national = digits;
  if (national.startsWith("225")) national = national.slice(3);
  if (national.startsWith("0") && national.length >= 10) {
    // already national with leading 0
  } else if (national.length === 9) {
    national = `0${national}`;
  }
  if (national.length < 2) return null;
  const prefix = national.slice(0, 2);
  if (prefix === "07" || prefix === "08" || prefix === "09") return "orange";
  if (prefix === "05" || prefix === "04") return "mtn";
  return null;
}

export function maskCiPhone(phoneE164: string): string {
  const raw = (phoneE164 || "").replace(/\s+/g, "");
  const digits = raw.replace(/\D/g, "");
  let national = digits.startsWith("225") ? digits.slice(3) : digits;
  if (national.length === 9) national = `0${national}`;
  if (national.length < 8) return raw || "—";
  const head = national.slice(0, 4);
  const tail = national.slice(-2);
  return `+225 ${head.slice(0, 2)} ${head.slice(2)} XX XX ${tail}`;
}

export type PaystackMomoInitializeData = {
  mode?: "mobile_money";
  provider?: CiMomoProvider;
  reference?: string;
  status?: string;
  displayText?: string;
  openUrl?: string | null;
  exception?: boolean;
};
