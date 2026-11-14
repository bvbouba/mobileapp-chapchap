import { Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";
import "dayjs/locale/fr";

dayjs.locale("fr");

export type TicketPdfInput = {
  orderId: string;
  orderNumber?: string | null;
  confirmationCode: string;
  departureCity?: string | null;
  arrivalCity?: string | null;
  departureStation?: string | null;
  arrivalStation?: string | null;
  departureDate?: Date | null;
  departureTimeStr?: string | null;
  arrivalTimeStr?: string | null;
  company?: string | null;
  passengers?: string[];
  tripIdLabel?: string | null;
  totalLabel?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLongFrenchDate(date: Date | null | undefined): string {
  if (!date) return "—";
  const raw = dayjs(date).locale("fr").format("dddd D MMMM YYYY");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function qrImageUrl(orderId: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(orderId)}`;
}

export function buildTicketPdfHtml(input: TicketPdfInput): string {
  const passengers =
    input.passengers && input.passengers.length > 0
      ? input.passengers
      : ["Passager"];
  const passengerRows = passengers
    .map((name, i) => {
      const label = passengers.length > 1 ? `Passager ${i + 1}` : "Passager";
      return `<tr><td>${escapeHtml(label)}</td><td><strong>${escapeHtml(name)}</strong></td></tr>`;
    })
    .join("");

  const route = `${input.departureCity || "Départ"} ➔ ${input.arrivalCity || "Arrivée"}`;
  const dateLine = `${formatLongFrenchDate(input.departureDate)}${
    input.departureTimeStr ? ` · ${input.departureTimeStr}` : ""
  }`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, Helvetica, Arial, sans-serif;
      color: #111;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .ticket {
      border: 2px solid #E2E3E7;
      border-radius: 16px;
      overflow: hidden;
      max-width: 520px;
      margin: 0 auto;
    }
    .brand {
      background: #A6C65A;
      color: #111;
      padding: 16px 20px;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .body { padding: 20px; }
    .company {
      font-size: 13px;
      font-weight: 700;
      color: #606060;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 6px;
    }
    .meta { color: #606060; font-size: 13px; margin: 4px 0; }
    .qr-wrap {
      text-align: center;
      padding: 18px 0 8px;
      border-top: 1px dashed #D7D8DB;
      border-bottom: 1px dashed #D7D8DB;
      margin: 16px 0;
    }
    .qr-wrap img {
      width: 180px;
      height: 180px;
      border: 1px solid #E8E9EC;
      border-radius: 12px;
      padding: 8px;
      background: #fff;
    }
    .code {
      margin-top: 10px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 13px;
    }
    td {
      padding: 6px 0;
      vertical-align: top;
      color: #303030;
    }
    td:first-child { color: #606060; width: 38%; }
    .footer {
      margin-top: 16px;
      font-size: 11px;
      color: #808080;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="brand">ChapChap Tickets — E-billet</div>
    <div class="body">
      <div class="company">${escapeHtml(input.company || "Transport")}</div>
      <h1 class="title">${escapeHtml(route)}</h1>
      <p class="meta">${escapeHtml(dateLine)}</p>
      ${
        input.departureStation
          ? `<p class="meta">Départ : ${escapeHtml(input.departureStation)}</p>`
          : ""
      }
      ${
        input.arrivalStation
          ? `<p class="meta">Arrivée : ${escapeHtml(input.arrivalStation)}</p>`
          : ""
      }
      <p class="meta">N° Réservation : #${escapeHtml(
        String(input.orderNumber || input.confirmationCode),
      )}</p>
      ${
        input.tripIdLabel
          ? `<p class="meta">Trajet : ${escapeHtml(input.tripIdLabel)}</p>`
          : ""
      }
      ${
        input.totalLabel
          ? `<p class="meta">Total : ${escapeHtml(input.totalLabel)}</p>`
          : ""
      }

      <div class="qr-wrap">
        <img src="${qrImageUrl(input.orderId)}" alt="QR code billet" />
        <div class="code">Code : ${escapeHtml(input.confirmationCode)}</div>
        <div class="meta">Présentez ce QR code au contrôle</div>
      </div>

      <table>
        ${passengerRows}
        ${
          input.arrivalTimeStr
            ? `<tr><td>Heure d'arrivée</td><td><strong>${escapeHtml(
                input.arrivalTimeStr,
              )}</strong></td></tr>`
            : ""
        }
      </table>

      <p class="footer">Document généré par ChapChap Tickets · Conservez ce PDF pour le contrôle</p>
    </div>
  </div>
</body>
</html>`;
}

/** Generate a PDF ticket and open the native share sheet (WhatsApp can attach the file). */
export async function shareTicketPdf(input: TicketPdfInput): Promise<void> {
  try {
    const html = buildTicketPdfHtml(input);
    const { uri } = await Print.printToFileAsync({ html });

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert(
        "Partage indisponible",
        "Le partage de fichiers n'est pas disponible sur cet appareil.",
      );
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Partager le billet PDF",
      UTI: "com.adobe.pdf",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de générer le PDF.";
    Alert.alert("Erreur", message);
  }
}
