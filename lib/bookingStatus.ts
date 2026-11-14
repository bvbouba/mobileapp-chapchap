/**
 * Two-phase reservation (guichet) — customer booking phase.
 * Saleor Order.status stays UNFULFILLED until staff fulfill; this metadata
 * (and inferred paid/unfulfilled) drives customer-facing copy.
 */

export const TICKET_STATUS_KEY = "ticket_status";
export const GUICHET_DEADLINE_AT_KEY = "guichet_deadline_at";
export const CANCEL_REASON_KEY = "cancel_reason";
export const AUTO_EXPIRED_UNCONFIRMED_BY_GUICHET =
  "AUTO_EXPIRED_UNCONFIRMED_BY_GUICHET";

/** Default SLA for counter confirmation (minutes). Override via EXPO_PUBLIC_GUICHET_CONFIRM_TIMEOUT_MINUTES. */
export const DEFAULT_GUICHET_CONFIRM_TIMEOUT_MINUTES = 15;

export const TICKET_STATUS = {
  PAYMENT_IN_PROGRESS: "PAYMENT_IN_PROGRESS",
  AWAITING_SEAT_ALLOCATION: "AWAITING_SEAT_ALLOCATION",
  ISSUED: "ISSUED",
  REJECTED_BUS_FULL: "REJECTED_BUS_FULL",
  BOARDED: "BOARDED",
  CANCELLED_AND_REFUNDED: "CANCELLED_AND_REFUNDED",
  CANCELLED_AND_TRANSFERRED: "CANCELLED_AND_TRANSFERRED",
  CANCEL_REQUESTED: "CANCEL_REQUESTED",
} as const;

export type TicketStatusValue =
  (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export type BookingPhase =
  | "pending_payment"
  | "awaiting_guichet"
  | "issued"
  | "boarded"
  | "rejected"
  | "cancelled"
  | "refund_pending";

export type BookingBadge = {
  phase: BookingPhase;
  label: string;
  color: string;
  bg: string;
  border: string;
  /** Short helper under CTA / details */
  message?: string;
};

type MetaRow = { key?: string | null; value?: string | null };
type FulfillmentRow = { status?: string | null };

function metaValue(metadata: MetaRow[] | null | undefined, key: string): string {
  const want = key.toLowerCase();
  for (const m of metadata ?? []) {
    if ((m.key ?? "").toLowerCase() === want) return (m.value ?? "").trim();
  }
  return "";
}

export function readTicketStatus(
  metadata: MetaRow[] | null | undefined,
): string {
  return metaValue(metadata, TICKET_STATUS_KEY).toUpperCase();
}

export function getGuichetConfirmTimeoutMinutes(): number {
  const raw = process.env.EXPO_PUBLIC_GUICHET_CONFIRM_TIMEOUT_MINUTES?.trim();
  const n = raw ? Number(raw) : DEFAULT_GUICHET_CONFIRM_TIMEOUT_MINUTES;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GUICHET_CONFIRM_TIMEOUT_MINUTES;
}

export function readGuichetDeadlineAt(
  metadata: MetaRow[] | null | undefined,
): string {
  return metaValue(metadata, GUICHET_DEADLINE_AT_KEY);
}

export function readCancelReason(
  metadata: MetaRow[] | null | undefined,
): string {
  return metaValue(metadata, CANCEL_REASON_KEY);
}

export function isGuichetDeadlineExpired(
  metadata: MetaRow[] | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  const raw = readGuichetDeadlineAt(metadata);
  if (!raw) return false;
  const t = Date.parse(raw);
  return Number.isFinite(t) && t < nowMs;
}

export function isOrderPaid(args: {
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  paymentStatusDisplay?: string | null;
  /** Saleor authorizeStatus (FULL = MoMo captured as authorize-only). */
  authorizeStatus?: string | null;
  /** Saleor chargeStatus (FULL / OVERCHARGED). */
  chargeStatus?: string | null;
  metadata?: MetaRow[] | null;
}): boolean {
  if (args.isPaid === true) return true;

  const authorize = (args.authorizeStatus ?? "").toUpperCase();
  const charge = (args.chargeStatus ?? "").toUpperCase();
  if (authorize === "FULL" || charge === "FULL" || charge === "OVERCHARGED") {
    return true;
  }

  const payment = (args.paymentStatus ?? "").toUpperCase();
  if (
    payment === "FULLY_CHARGED" ||
    payment === "FULLY_AUTHORIZED" ||
    payment === "FULL"
  ) {
    return true;
  }

  // Saleor paymentStatusDisplay is English; never treat "Not charged" as paid.
  const display = (args.paymentStatusDisplay ?? "").toLowerCase();
  if (display.includes("not charged") || display.includes("not authorized")) {
    // fall through — may still be paid via metadata / authorize
  } else if (
    display.includes("fully charged") ||
    display.includes("fully authorized") ||
    display.includes("paid")
  ) {
    return true;
  }

  // Checkout only sets awaiting-guichet after MoMo success (even legacy authorize-only).
  const ticketStatus = readTicketStatus(args.metadata);
  return (
    ticketStatus === TICKET_STATUS.AWAITING_SEAT_ALLOCATION ||
    ticketStatus === TICKET_STATUS.ISSUED ||
    ticketStatus === TICKET_STATUS.BOARDED
  );
}

/**
 * Customer-facing payment label — never leak Saleor's English enums
 * ("Not charged", "Fully charged", …).
 */
export function formatPaymentStatusLabelFr(args: {
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  paymentStatusDisplay?: string | null;
  authorizeStatus?: string | null;
  chargeStatus?: string | null;
  metadata?: MetaRow[] | null;
}): string {
  if (isOrderPaid(args)) return "Payé";

  const code = (args.paymentStatus ?? "").toUpperCase();
  const display = (args.paymentStatusDisplay ?? "").trim().toLowerCase();

  if (
    code === "FULLY_REFUNDED" ||
    display.includes("fully refunded") ||
    display === "refunded"
  ) {
    return "Remboursé";
  }
  if (code === "PARTIALLY_REFUNDED" || display.includes("partially refunded")) {
    return "Partiellement remboursé";
  }
  if (code === "PARTIALLY_CHARGED" || display.includes("partially charged")) {
    return "Partiellement payé";
  }
  if (code === "REFUSED" || display.includes("refused")) return "Refusé";
  if (
    code === "CANCELLED" ||
    code === "CANCELED" ||
    display.includes("cancel")
  ) {
    return "Annulé";
  }
  if (code === "PENDING" || display.includes("pending")) return "En attente";

  // NOT_CHARGED / "Not charged" / unknown English Saleor strings
  return "En attente";
}

function isOrderFulfilled(status?: string | null): boolean {
  const s = (status ?? "").toUpperCase();
  return s === "FULFILLED" || s === "PARTIALLY_FULFILLED";
}

function isOrderCancelledStatus(status?: string | null): boolean {
  const s = (status ?? "").toUpperCase();
  return (
    s === "CANCELED" ||
    s === "CANCELLED" ||
    s === "RETURNED" ||
    s === "PARTIALLY_RETURNED" ||
    s === "EXPIRED"
  );
}

function hasCanceledFulfillmentsOnly(
  fulfillments?: FulfillmentRow[] | null,
): boolean {
  const list = fulfillments ?? [];
  if (list.length === 0) return false;
  let hasCanceled = false;
  let hasActive = false;
  for (const f of list) {
    const s = (f.status ?? "").trim().toUpperCase();
    if (!s) continue;
    if (s === "CANCELED" || s === "CANCELLED") hasCanceled = true;
    else hasActive = true;
  }
  return hasCanceled && !hasActive;
}

export function isTicketUnlocked(status?: string | null): boolean {
  return isOrderFulfilled(status);
}

export function awaitingGuichetMetadataInput(
  _timeoutMinutes?: number,
): Array<{ key: string; value: string }> {
  // Auto-refund SLA disabled — do not write guichet_deadline_at.
  return [
    { key: TICKET_STATUS_KEY, value: TICKET_STATUS.AWAITING_SEAT_ALLOCATION },
  ];
}

export function issuedTicketMetadataInput(): Array<{ key: string; value: string }> {
  return [{ key: TICKET_STATUS_KEY, value: TICKET_STATUS.ISSUED }];
}

export function rejectedBusFullMetadataInput(): Array<{ key: string; value: string }> {
  return [{ key: TICKET_STATUS_KEY, value: TICKET_STATUS.REJECTED_BUS_FULL }];
}

/**
 * Resolve customer booking phase from Saleor order + metadata.
 * Prefer explicit ticket_status; fall back to paid/fulfilled inference.
 */
export function resolveBookingPhase(args: {
  orderStatus?: string | null;
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  paymentStatusDisplay?: string | null;
  authorizeStatus?: string | null;
  chargeStatus?: string | null;
  metadata?: MetaRow[] | null;
  fulfillments?: FulfillmentRow[] | null;
}): BookingPhase {
  const ticketStatus = readTicketStatus(args.metadata);
  const boarded =
    ticketStatus === TICKET_STATUS.BOARDED ||
    metaValue(args.metadata, "boarding_status").toUpperCase() === "BOARDED" ||
    !!metaValue(args.metadata, "boarded_at");

  if (boarded) return "boarded";

  if (ticketStatus === TICKET_STATUS.REJECTED_BUS_FULL) return "rejected";
  if (ticketStatus === TICKET_STATUS.CANCEL_REQUESTED) return "refund_pending";
  if (
    ticketStatus === TICKET_STATUS.CANCELLED_AND_REFUNDED ||
    ticketStatus === TICKET_STATUS.CANCELLED_AND_TRANSFERRED
  ) {
    return "cancelled";
  }

  if (isOrderCancelledStatus(args.orderStatus)) return "cancelled";
  if (hasCanceledFulfillmentsOnly(args.fulfillments)) return "cancelled";

  if (ticketStatus === TICKET_STATUS.ISSUED || isOrderFulfilled(args.orderStatus)) {
    return "issued";
  }

  if (
    ticketStatus === TICKET_STATUS.AWAITING_SEAT_ALLOCATION &&
    !isOrderFulfilled(args.orderStatus)
  ) {
    return "awaiting_guichet";
  }

  const paid = isOrderPaid(args);
  if (
    paid &&
    (ticketStatus === TICKET_STATUS.AWAITING_SEAT_ALLOCATION ||
      ticketStatus === TICKET_STATUS.PAYMENT_IN_PROGRESS ||
      !ticketStatus ||
      !isOrderFulfilled(args.orderStatus))
  ) {
    if (paid && !isOrderFulfilled(args.orderStatus)) return "awaiting_guichet";
  }

  if (!paid) return "pending_payment";

  return "awaiting_guichet";
}

export function getBookingBadge(args: {
  orderStatus?: string | null;
  isPaid?: boolean | null;
  paymentStatus?: string | null;
  paymentStatusDisplay?: string | null;
  authorizeStatus?: string | null;
  chargeStatus?: string | null;
  metadata?: MetaRow[] | null;
  fulfillments?: FulfillmentRow[] | null;
  /** Formatted money for awaiting message, e.g. "5 000 FCFA" */
  paidAmountLabel?: string | null;
}): BookingBadge {
  const phase = resolveBookingPhase(args);
  const amount = args.paidAmountLabel?.trim();
  const cancelReason = readCancelReason(args.metadata);

  switch (phase) {
    case "pending_payment":
      return {
        phase,
        label: "En attente",
        color: "#D97706",
        bg: "#FFFBEB",
        border: "#FDE68A",
        message: "Paiement en cours…",
      };
    case "awaiting_guichet":
      return {
        phase,
        label: "Attente guichet",
        color: "#1D4ED8",
        bg: "#EFF6FF",
        border: "#BFDBFE",
        message: amount
          ? `Votre paiement de ${amount} est reçu. L'agent de guichet valide votre place — votre billet sera disponible ensuite.`
          : "Paiement reçu — validation par la gare en cours.",
      };
    case "issued":
      return {
        phase,
        label: "Billet confirmé",
        color: "#059669",
        bg: "#ECFDF5",
        border: "#A7F3D0",
        message: "Votre billet est validé. Présentez le QR code au contrôle.",
      };
    case "boarded":
      return {
        phase,
        label: "À bord",
        color: "#2563EB",
        bg: "#EFF6FF",
        border: "#BFDBFE",
        message: "Embarquement enregistré.",
      };
    case "rejected":
      return {
        phase,
        label: "Place indisponible",
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        message: amount
          ? `Désolé, ce départ est complet. Votre paiement de ${amount} a été remboursé.`
          : "Désolé, ce départ est complet. Votre paiement a été remboursé.",
      };
    case "refund_pending":
      return {
        phase,
        label: "Remboursement",
        color: "#B45309",
        bg: "#FFFBEB",
        border: "#FDE68A",
        message: "Remboursement en cours…",
      };
    case "cancelled":
    default: {
      const autoExpired = cancelReason === AUTO_EXPIRED_UNCONFIRMED_BY_GUICHET;
      return {
        phase: "cancelled",
        label: autoExpired ? "Annulé & remboursé" : "Annulé",
        color: "#DC2626",
        bg: "#FEF2F2",
        border: "#FECACA",
        message: autoExpired
          ? amount
            ? `La gare n'a pas validé à temps. Votre paiement de ${amount} a été automatiquement remboursé sur Mobile Money.`
            : "La gare n'a pas validé à temps. Votre paiement a été automatiquement remboursé sur Mobile Money."
          : "Cette réservation a été annulée.",
      };
    }
  }
}

/** Tailwind classes for website badges. */
export function bookingBadgeClassName(phase: BookingPhase): string {
  switch (phase) {
    case "pending_payment":
      return "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]";
    case "awaiting_guichet":
      return "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]";
    case "issued":
      return "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]";
    case "boarded":
      return "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]";
    case "refund_pending":
      return "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]";
    case "rejected":
    case "cancelled":
    default:
      return "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]";
  }
}
