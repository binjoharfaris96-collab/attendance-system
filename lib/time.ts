const DEFAULT_TIME_ZONE = "Asia/Riyadh";

function createFormatter(
  options: Intl.DateTimeFormatOptions,
  locale = "en-GB",
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: getAppTimeZone(),
    ...options,
  });
}

export function getAppTimeZone() {
  return process.env.APP_TIMEZONE?.trim() || DEFAULT_TIME_ZONE;
}

export function formatDateTime(value: string) {
  return createFormatter({
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateLabel(value: string) {
  return createFormatter({
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatDayName(value: string) {
  return createFormatter({
    weekday: "short",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function toAttendanceDate(value: string) {
  return createFormatter({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }, "en-CA").format(new Date(value));
}

export function isoNow() {
  return new Date().toISOString();
}

/** Minutes since local midnight in the app timezone (used for late cutoff vs check-in time). */
export function minutesSinceMidnightFromIso(iso: string): number {
  const localTimeString = new Intl.DateTimeFormat("en-GB", {
    timeZone: getAppTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  const [hour, minute] = localTimeString.split(":").map(Number);
  return hour * 60 + minute;
}

export function shiftDate(dateValue: string, amount: number) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
