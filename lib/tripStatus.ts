/** Operational trip lifecycle on ProductVariant metadata (customer-facing). */

export type TripStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "CLOSED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "CANCELLED";

export const TRIP_STATUS_KEY = "trip_status";
export const BOARDING_STARTED_KEY = "boarding_started";
export const TRIP_IS_DELAYED_KEY = "is_delayed";
export const TRIP_NEW_ESTIMATED_DEPARTURE_KEY = "new_estimated_departure";

/** Fallback when estimated-duration attribute is missing. */
export const ARCHIVE_FALLBACK_DURATION_MINUTES = 12 * 60;

export type TripStatusBadge = {
  label: string;
  color: string;
  bg: string;
  border: string;
  /** Present when the trip is delayed (estimated HH:mm if known). */
  estimatedDeparture?: string;
  isDelayed: boolean;
  status: TripStatus;
};

/** French labels for Mes voyages cards. */
export const TRIP_STATUS_CONFIG: Record<
  TripStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  SCHEDULED: {
    label: "Programmé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  BOARDING: {
    label: "Embarquement",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  CLOSED: {
    label: "Fermé",
    color: "#EA580C",
    bg: "#FFF7ED",
    border: "#FED7AA",
  },
  IN_TRANSIT: {
    label: "En route",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  ARRIVED: {
    label: "Arrivé",
    color: "#6B7280",
    bg: "#F3F4F6",
    border: "#D1D5DB",
  },
  CANCELLED: {
    label: "Annulé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

const DELAYED_BADGE = {
  label: "En retard",
  color: "#B45309",
  bg: "#FFFBEB",
  border: "#FDE68A",
} as const;

export function isTripStatus(value: string | null | undefined): value is TripStatus {
  return (
    value === "SCHEDULED" ||
    value === "BOARDING" ||
    value === "CLOSED" ||
    value === "IN_TRANSIT" ||
    value === "ARRIVED" ||
    value === "CANCELLED"
  );
}

/** Parse "HH:mm" / "H:mm" into hours/minutes, or null if invalid. */
function parseHm(value: string): { hours: number; minutes: number } | null {
  const m = value.trim().match(/^(\d{1,2})\s*[:hH]\s*(\d{2})$/);
  if (!m) return null;
  const hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Effective departure: delayed HH:mm on the scheduled calendar day when flagged.
 */
export function resolveEffectiveDeparture(
  scheduled: Date,
  isDelayed: boolean,
  estimatedHm: string,
): Date {
  if (!isDelayed || !estimatedHm.trim()) return scheduled;
  const parsed = parseHm(estimatedHm);
  if (!parsed) return scheduled;
  const d = new Date(scheduled.getTime());
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

const CANCELLED_ORDER_STATUSES = new Set([
  "CANCELED",
  "CANCELLED",
  "RETURNED",
  "PARTIALLY_RETURNED",
]);

/**
 * Historique when trip arrived/cancelled, order cancelled/refunded,
 * or now is past effective departure + estimated duration.
 */
export function isTripInHistorique(args: {
  tripStatus: TripStatus;
  scheduledDeparture: Date | null;
  durationMinutes: number;
  isDelayed: boolean;
  estimatedDepartureHm: string;
  orderStatus?: string | null;
  now?: Date;
}): boolean {
  const now = args.now ?? new Date();
  if (args.tripStatus === "ARRIVED" || args.tripStatus === "CANCELLED") return true;
  const orderStatus = (args.orderStatus ?? "").trim().toUpperCase();
  if (CANCELLED_ORDER_STATUSES.has(orderStatus)) return true;
  if (!args.scheduledDeparture) return false;
  const effective = resolveEffectiveDeparture(
    args.scheduledDeparture,
    args.isDelayed,
    args.estimatedDepartureHm,
  );
  const duration =
    args.durationMinutes > 0 ? args.durationMinutes : ARCHIVE_FALLBACK_DURATION_MINUTES;
  const archiveAt = effective.getTime() + duration * 60_000;
  return now.getTime() > archiveAt;
}

export function readTripStatus(
  metadata: Array<{ key: string; value: string }> | null | undefined,
): TripStatus {
  let status = "";
  let boardingStarted = false;
  for (const m of metadata ?? []) {
    const k = (m.key ?? "").toLowerCase().trim();
    if (k === TRIP_STATUS_KEY) status = (m.value ?? "").trim().toUpperCase();
    if (k === BOARDING_STARTED_KEY) {
      const v = (m.value ?? "").trim().toLowerCase();
      boardingStarted = v === "true" || v === "1" || v === "yes";
    }
  }
  if (isTripStatus(status)) return status;
  return boardingStarted ? "BOARDING" : "SCHEDULED";
}

export function readTripDelayMeta(
  metadata: Array<{ key: string; value: string }> | null | undefined,
): { isDelayed: boolean; estimatedDeparture: string } {
  let isDelayed = false;
  let estimatedDeparture = "";
  for (const m of metadata ?? []) {
    const k = (m.key ?? "").toLowerCase().trim();
    if (k === TRIP_IS_DELAYED_KEY) {
      const v = (m.value ?? "").trim().toLowerCase();
      isDelayed = v === "true" || v === "1" || v === "yes";
    }
    if (k === TRIP_NEW_ESTIMATED_DEPARTURE_KEY) {
      estimatedDeparture = (m.value ?? "").trim();
    }
  }
  return { isDelayed, estimatedDeparture };
}

/**
 * Badge for customer UI: delayed trips show "En retard" instead of "Programmé"
 * while still SCHEDULED / early boarding. Later statuses keep their own label.
 */
export function getTripStatusBadge(
  metadata: Array<{ key: string; value: string }> | null | undefined,
): TripStatusBadge {
  const status = readTripStatus(metadata);
  const delay = readTripDelayMeta(metadata);
  const base = TRIP_STATUS_CONFIG[status];

  // Replace Programmé with En retard when the departure is flagged delayed.
  if (delay.isDelayed && status === "SCHEDULED") {
    return {
      ...DELAYED_BADGE,
      estimatedDeparture: delay.estimatedDeparture || undefined,
      isDelayed: true,
      status,
    };
  }

  return {
    ...base,
    estimatedDeparture: delay.isDelayed ? delay.estimatedDeparture || undefined : undefined,
    isDelayed: delay.isDelayed,
    status,
  };
}
