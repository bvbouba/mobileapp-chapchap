/**
 * Lower bound for bookable departures: max(start of selected calendar day, now + buffer).
 * Upper bound: end of selected calendar day (UTC midnight-based day window).
 */
export function getBookableDepartureDateTimeRange(
  dateKey: string,
  bufferMinutes: number
): { gte: string; lte: string } {
  const safeBuffer = Number.isFinite(bufferMinutes) && bufferMinutes >= 0 ? bufferMinutes : 60;
  const parts = dateKey.split("-").map((x) => parseInt(x, 10));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) {
    const now = new Date();
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);
    const gte = new Date(now.getTime() + safeBuffer * 60_000);
    return { gte: gte.toISOString(), lte: end.toISOString() };
  }

  const startOfDay = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  const cutoff = new Date(Date.now() + safeBuffer * 60_000);
  const gteDate = startOfDay.getTime() > cutoff.getTime() ? startOfDay : cutoff;

  return {
    gte: gteDate.toISOString(),
    lte: endOfDay.toISOString(),
  };
}
