export type AttendanceWindowPhase = "upcoming" | "live" | "expired";

export type AttendanceWindow = {
  phase: AttendanceWindowPhase;
  isActive: boolean;
  start: Date;
  end: Date;
  progress: number;
  headline: string;
  detail: string;
  startLabel: string;
  endLabel: string;
};

function padTimePart(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(Math.max(0, numeric)).padStart(2, "0") : "00";
}

export function normalizeTimeValue(value: string | null | undefined, fallback = "00:00") {
  if (!value) return fallback;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Math.min(23, Math.max(0, Number.parseInt(rawHour, 10) || 0));
  const minute = Math.min(59, Math.max(0, Number.parseInt(rawMinute, 10) || 0));
  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function splitTimeValue(value: string | null | undefined) {
  const normalized = normalizeTimeValue(value);
  const [hour = "00", minute = "00"] = normalized.split(":");
  return { hour, minute };
}

export function setTimePart(value: string, part: "hour" | "minute", next: string) {
  const { hour, minute } = splitTimeValue(value);
  return part === "hour" ? `${next}:${minute}` : `${hour}:${next}`;
}

export function isValidTimeRange(startTime: string, endTime: string) {
  return timeToMinutes(endTime) > timeToMinutes(startTime);
}

export function buildDateTime(date: string, time: string) {
  if (!date || !time) return null;
  const normalizedTime = normalizeTimeValue(time);
  const [hour, minute] = normalizedTime.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const value = new Date(`${date}T00:00:00`);
  value.setHours(hour, minute, 0, 0);
  return value;
}

export function timeToMinutes(value: string) {
  const normalized = normalizeTimeValue(value);
  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}

export function formatDuration(milliseconds: number) {
  const safeMs = Math.max(0, Math.floor(milliseconds));
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days} hari ${hours} jam ${minutes} menit ${seconds} detik`;
  if (hours > 0) return `${hours} jam ${minutes} menit ${seconds} detik`;
  if (minutes > 0) return `${minutes} menit ${seconds} detik`;
  return `${seconds} detik`;
}

export function getAttendanceWindow(date: string, startTime: string, endTime: string, now = new Date()): AttendanceWindow | null {
  const start = buildDateTime(date, startTime);
  const end = buildDateTime(date, endTime);

  if (!start || !end) return null;

  const total = end.getTime() - start.getTime();
  if (total <= 0) {
    return {
      phase: "expired",
      isActive: false,
      start,
      end,
      progress: 0,
      headline: "Jadwal tidak valid",
      detail: "Jam selesai harus lebih besar dari jam mulai.",
      startLabel: start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      endLabel: end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const startLabel = start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  if (nowMs < startMs) {
    return {
      phase: "upcoming",
      isActive: false,
      start,
      end,
      progress: 0,
      headline: `Mulai dalam ${formatDuration(startMs - nowMs)}`,
      detail: `Sesi dibuka pukul ${startLabel} dan ditutup pukul ${endLabel}.`,
      startLabel,
      endLabel,
    };
  }

  if (nowMs <= endMs) {
    const elapsed = nowMs - startMs;
    const remaining = endMs - nowMs;
    return {
      phase: "live",
      isActive: true,
      start,
      end,
      progress: Math.min(100, Math.max(0, (elapsed / total) * 100)),
      headline: `Berlangsung, sisa ${formatDuration(remaining)}`,
      detail: `Absensi aktif dari ${startLabel} sampai ${endLabel}.`,
      startLabel,
      endLabel,
    };
  }

  return {
    phase: "expired",
    isActive: false,
    start,
    end,
    progress: 100,
    headline: `Berakhir ${formatDuration(nowMs - endMs)} yang lalu`,
    detail: `Jadwal terakhir aktif dari ${startLabel} sampai ${endLabel}.`,
    startLabel,
    endLabel,
  };
}
