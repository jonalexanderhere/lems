export const APP_TIME_ZONE = "Asia/Jakarta";
export const JAKARTA_UTC_OFFSET = "+07:00";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function normalizeIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function normalizeClockTime(value: string | null | undefined) {
  if (!value) return null;
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  return `${pad2(hour)}:${pad2(minute)}`;
}

export function isValidLearningClockTime(value: string | null | undefined) {
  const normalized = normalizeClockTime(value);
  if (!normalized) return false;
  const [hour, minute] = normalized.split(":").map(Number);
  const totalMinutes = hour * 60 + minute;

  return totalMinutes === 0 || totalMinutes >= 6 * 60;
}

export function jakartaInputToUtcIso(dateValue: string, timeValue: string) {
  const date = normalizeIsoDate(dateValue);
  const time = normalizeClockTime(timeValue);
  if (!date || !time) return null;

  const parsed = new Date(`${date}T${time}:00${JAKARTA_UTC_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function jakartaDateTimeLocalToUtcIso(value: string | null | undefined) {
  if (!value) return null;
  const [date = "", time = ""] = value.split("T");
  return jakartaInputToUtcIso(date, time);
}

export function formatJakartaDateTime(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "";
  return new Date(value).toLocaleString("id-ID", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    ...options,
  });
}

export function formatJakartaTime(value: string | null | undefined, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("id-ID", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    ...options,
  });
}
