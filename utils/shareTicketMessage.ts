import { Alert, Linking, Share } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { getConfig } from "../config";

dayjs.locale("fr");

const DEFAULT_STOREFRONT_URL = "https://www.chapchapticket.com";

export type TicketShareInput = {
  orderId: string;
  orderNumber?: string | null;
  confirmationCode: string;
  departureCity?: string | null;
  arrivalCity?: string | null;
  departureDate?: Date | null;
  departureTimeStr?: string | null;
  company?: string | null;
  passengers?: string[];
};

function getStorefrontBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STOREFRONT_URL?.trim();
  return (fromEnv || DEFAULT_STOREFRONT_URL).replace(/\/$/, "");
}

function getChannelSlug(): string {
  const channel = getConfig().channel;
  if (typeof channel === "string" && channel.trim()) return channel.trim();
  return "ci";
}

function formatLongFrenchDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const raw = dayjs(date).locale("fr").format("dddd D MMMM YYYY");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function buildTicketShareMessage(input: TicketShareInput): string {
  const route =
    input.departureCity && input.arrivalCity
      ? `${input.departureCity} ➔ ${input.arrivalCity}`
      : null;
  const dateLine = (() => {
    const d = formatLongFrenchDate(input.departureDate);
    if (d && input.departureTimeStr) return `${d} à ${input.departureTimeStr}`;
    if (d) return d;
    if (input.departureTimeStr) return input.departureTimeStr;
    return null;
  })();
  const passengers =
    input.passengers && input.passengers.length > 0
      ? input.passengers.join(", ")
      : null;
  const orderUrl = `${getStorefrontBaseUrl()}/${encodeURIComponent(getChannelSlug())}/orders/${encodeURIComponent(input.orderId)}`;

  return [
    "🚌 Voici ton billet de car ChapChap Tickets !",
    "",
    route ? `• Trajet : ${route}` : null,
    dateLine ? `• Date : ${dateLine}` : null,
    input.company ? `• Compagnie : ${input.company}` : null,
    passengers ? `• Passager : ${passengers}` : null,
    `• N° Réservation : #${input.orderNumber || input.confirmationCode}`,
    `• Code : ${input.confirmationCode}`,
    "",
    "📱 Voir le billet / QR :",
    orderUrl,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Opens WhatsApp with a prefilled ticket message (free — uses the user's WhatsApp). */
export async function shareTicketOnWhatsApp(message: string): Promise<void> {
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  try {
    const can = await Linking.canOpenURL(waUrl);
    if (can) {
      await Linking.openURL(waUrl);
      return;
    }
  } catch {
    // fall through to system share sheet
  }

  try {
    await Share.share({ message, title: "Billet ChapChap Tickets" });
  } catch {
    Alert.alert(
      "Partage impossible",
      "Impossible d'ouvrir WhatsApp. Vérifiez qu'il est installé, ou utilisez Partager.",
    );
  }
}

/** System share sheet (WhatsApp, Messages, Mail, …) — also free. */
export async function shareTicketNative(message: string): Promise<void> {
  try {
    await Share.share({ message, title: "Billet ChapChap Tickets" });
  } catch {
    // User cancelled or share unavailable
  }
}
