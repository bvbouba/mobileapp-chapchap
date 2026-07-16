import { colors } from "../components/Themed";

export type OrderStatusDisplay = {
  label: string;
  backgroundColor: string;
  borderColor: string;
  color: string;
};

/** French labels for Saleor OrderStatus (customer-facing, ticket context). */
export function getOrderStatusDisplay(status?: string | null): OrderStatusDisplay {
  const normalized = status?.toUpperCase();

  switch (normalized) {
    case "UNCONFIRMED":
      return {
        label: "Non confirmé",
        backgroundColor: "#FFF7ED",
        borderColor: "#FED7AA",
        color: "#C2410C",
      };
    case "UNFULFILLED":
      return {
        label: "En cours d'émission",
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
        color: "#1D4ED8",
      };
    case "PARTIALLY_FULFILLED":
      return {
        label: "Partiellement validé",
        backgroundColor: "#EEF2FF",
        borderColor: "#C7D2FE",
        color: "#4338CA",
      };
    case "FULFILLED":
      return {
        label: "Validé",
        backgroundColor: "#ECFDF3",
        borderColor: "#BBF7D0",
        color: "#15803D",
      };
    case "CANCELED":
      return {
        label: "Annulé",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        color: "#B91C1C",
      };
    case "EXPIRED":
      return {
        label: "Expiré",
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#4B5563",
      };
    case "RETURNED":
      return {
        label: "Retourné",
        backgroundColor: "#F5F3FF",
        borderColor: "#DDD6FE",
        color: "#6D28D9",
      };
    case "PARTIALLY_RETURNED":
      return {
        label: "Partiellement retourné",
        backgroundColor: "#F5F3FF",
        borderColor: "#DDD6FE",
        color: "#6D28D9",
      };
    case "DRAFT":
      return {
        label: "Brouillon",
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#6B7280",
      };
    default:
      return {
        label: status ? String(status) : "Inconnu",
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        color: "#4B5563",
      };
  }
}
