const AR_TZ = "America/Argentina/Buenos_Aires";

type DateLike = Date | string | number;

function toDate(value: DateLike): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Format an event's calendar date (Evento.fecha — stored as DATE).
 * Uses UTC because Prisma hydrates DATE as UTC midnight; the value is a
 * calendar day, not an instant, so we read it back as the same day.
 */
export function formatEventDate(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
): string {
  return toDate(value).toLocaleDateString("es-AR", { ...options, timeZone: "UTC" });
}

/** Format a real instant (createdAt, fechaIngreso, fechaEnvio) in Argentina time. */
export function formatDateTimeAR(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
): string {
  return toDate(value).toLocaleString("es-AR", { ...options, timeZone: AR_TZ });
}

/** Format only the date part of a real instant in Argentina time. */
export function formatDateAR(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  return toDate(value).toLocaleDateString("es-AR", { ...options, timeZone: AR_TZ });
}

/** Format only the time part of a real instant in Argentina time. */
export function formatTimeAR(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  return toDate(value).toLocaleTimeString("es-AR", { ...options, timeZone: AR_TZ });
}

function todayPartsAR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Today in Argentina, anchored at UTC midnight. Use for filters against `@db.Date` columns. */
export function todayAR(): Date {
  return new Date(`${todayPartsAR()}T00:00:00.000Z`);
}

/** The instant midnight AR became today (UTC-3). Use for filters against `DateTime` columns like fechaIngreso. */
export function startOfTodayAR(): Date {
  return new Date(`${todayPartsAR()}T00:00:00.000-03:00`);
}
