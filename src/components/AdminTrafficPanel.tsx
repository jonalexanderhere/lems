"use client";

import { Activity, ArrowUpRight, Clock3, Database, ShieldCheck, Wifi } from "lucide-react";

type ActivityProfile = { full_name: string | null; username: string | null } | { full_name: string | null; username: string | null }[] | null;
type AttendanceProfile = { full_name: string | null; username: string | null } | { full_name: string | null; username: string | null }[] | null;
type AttendanceClass = { name: string } | { name: string }[] | null;

export type TrafficActivityLog = {
  id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  ip_address: string;
  created_at: string;
  profiles: ActivityProfile;
};

export type TrafficAttendanceLog = {
  id: string;
  student_id: string;
  status: string;
  method: string | null;
  confidence_score: number | null;
  created_at: string;
  class_id: string | null;
  profiles: AttendanceProfile;
  classes: AttendanceClass;
};

type TrafficEvent =
  | {
      id: string;
      created_at: string;
      kind: "activity";
      title: string;
      detail: string;
      user: string;
      tone: "emerald" | "violet" | "gold" | "red";
    }
  | {
      id: string;
      created_at: string;
      kind: "attendance";
      title: string;
      detail: string;
      user: string;
      tone: "emerald" | "violet" | "gold" | "red";
    };

type TrafficPoint = {
  key: string;
  label: string;
  activity: number;
  attendance: number;
  total: number;
};

type AdminTrafficPanelProps = {
  activityLogs: TrafficActivityLog[];
  attendanceLogs: TrafficAttendanceLog[];
  loading?: boolean;
  onRefresh?: () => void;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeHourKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  return `${year}-${month}-${day}-${hour}`;
}

function hourLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":00", "");
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });
}

function formatAction(action: string) {
  return action
    .split("_")
    .map((part) => part.toLowerCase())
    .join(" ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeActivityProfile(profile: ActivityProfile) {
  const resolved = firstItem(profile);
  return resolved?.full_name ?? resolved?.username ?? "System";
}

function normalizeAttendanceProfile(profile: AttendanceProfile) {
  const resolved = firstItem(profile);
  return resolved?.full_name ?? resolved?.username ?? "Siswa";
}

function normalizeAttendanceClass(value: AttendanceClass) {
  return firstItem(value)?.name ?? "-";
}

export function AdminTrafficPanel({ activityLogs, attendanceLogs, loading = false, onRefresh }: AdminTrafficPanelProps) {
  const now = new Date();
  const points = Array.from({ length: 24 }, (_, index) => {
    const date = new Date(now.getTime() - (23 - index) * 60 * 60 * 1000);
    return {
      key: normalizeHourKey(date),
      label: hourLabel(date),
      activity: 0,
      attendance: 0,
      total: 0,
    } satisfies TrafficPoint;
  });

  const bucketMap = new Map(points.map((bucket) => [bucket.key, bucket]));

  activityLogs.forEach((log) => {
    const bucket = bucketMap.get(normalizeHourKey(new Date(log.created_at)));
    if (bucket) bucket.activity += 1;
  });

  attendanceLogs.forEach((log) => {
    const bucket = bucketMap.get(normalizeHourKey(new Date(log.created_at)));
    if (bucket) bucket.attendance += 1;
  });

  points.forEach((bucket) => {
    bucket.total = bucket.activity + bucket.attendance;
  });

  const activityEvents: TrafficEvent[] = activityLogs.map((log) => {
    const tone: TrafficEvent["tone"] = log.action.includes("FAILED") ? "red" : "emerald";
    return {
      id: `activity:${log.id}`,
      created_at: log.created_at,
      kind: "activity",
      title: formatAction(log.action),
      detail: log.ip_address ? `IP ${log.ip_address}` : "Request log",
      user: normalizeActivityProfile(log.profiles),
      tone,
    };
  });

  const attendanceEvents: TrafficEvent[] = attendanceLogs.map((log) => {
    const tone: TrafficEvent["tone"] =
      log.status === "present" ? "emerald" : log.status === "late" ? "gold" : "violet";
    return {
      id: `attendance:${log.id}`,
      created_at: log.created_at,
      kind: "attendance",
      title: `Absensi ${log.status}`,
      detail: `${log.method ?? "manual"} · ${normalizeAttendanceClass(log.classes)}`,
      user: normalizeAttendanceProfile(log.profiles),
      tone,
    };
  });

  const combinedEvents = [...activityEvents, ...attendanceEvents]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 12);

  const totalTraffic = activityLogs.length + attendanceLogs.length;
  const totalActivity = activityLogs.length;
  const totalAttendance = attendanceLogs.length;
  const peakPoint = points.reduce<TrafficPoint | null>((acc, item) => {
    if (!acc || item.total > acc.total) return item;
    return acc;
  }, null);
  const averagePerHour = totalTraffic / 24;
  const maxValue = Math.max(1, ...points.map((point) => point.total));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Traffic 24 Jam", value: totalTraffic, icon: Activity, tone: "emerald" },
          { label: "Request Activity", value: totalActivity, icon: Wifi, tone: "gold" },
          { label: "Attendance Flow", value: totalAttendance, icon: ShieldCheck, tone: "violet" },
          { label: "Rata-rata / Jam", value: averagePerHour.toFixed(1), icon: Clock3, tone: "slate" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="p-5 bg-white/5 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_40%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                  card.tone === "emerald"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : card.tone === "gold"
                      ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                      : card.tone === "violet"
                        ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                        : "border-white/10 bg-white/5 text-white/60"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <div className="p-5 bg-white/5 border border-white/10 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
            <div>
              <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-[0.28em] mb-2">Grafik Trafik</p>
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Aktivitas request 24 jam terakhir
              </h3>
            </div>
            <div className="text-white/40 text-sm">
              Puncak: {peakPoint ? `${peakPoint.label}:00` : "--:--"} · {peakPoint?.total ?? 0} event
            </div>
          </div>

          {loading ? (
            <div className="h-[260px] flex items-center justify-center text-white/35 text-sm border border-dashed border-white/10">
              Memuat data trafik...
            </div>
          ) : (
            <div className="relative h-[260px]">
              <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="border-t border-white/5" />
                ))}
              </div>
              <div className="relative h-full flex items-end gap-1">
                {points.map((point, index) => {
                  const barHeight = `${Math.max(4, (point.total / maxValue) * 100)}%`;
                  const activityShare = point.total > 0 ? point.activity / point.total : 0;
                  const attendanceShare = point.total > 0 ? point.attendance / point.total : 0;
                  return (
                    <div key={point.key} className="flex-1 h-full flex flex-col justify-end">
                      <div className="flex-1 flex items-end justify-center">
                        <div className="relative w-full max-w-[18px] flex items-end justify-center">
                          <div
                            className="w-full bg-white/5 border border-white/10 overflow-hidden rounded-t-[10px] flex flex-col justify-end"
                            style={{ height: barHeight }}
                          >
                            <div
                              className="w-full bg-gradient-to-t from-emerald-400 to-emerald-300"
                              style={{ flex: activityShare, minHeight: point.activity > 0 ? "3px" : 0 }}
                            />
                            <div
                              className="w-full bg-gradient-to-t from-[#FF2D2D] to-orange-300"
                              style={{ flex: attendanceShare, minHeight: point.attendance > 0 ? "3px" : 0 }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-[10px] uppercase tracking-[0.18em] ${index % 6 === 0 ? "text-white/45" : "text-white/15"}`}>
                          {index % 6 === 0 ? point.label : " "}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-white/40">
            <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Request activity</span>
            <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF2D2D]" /> Attendance logs</span>
          </div>
        </div>

        <div className="p-5 bg-white/5 border border-white/10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-[0.28em] mb-2">Realtime Feed</p>
              <h3 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Event terbaru
              </h3>
            </div>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-[0.24em] hover:bg-white hover:text-black transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>

          <div className="space-y-3">
            {combinedEvents.length === 0 ? (
              <div className="p-8 text-center text-white/35 border border-dashed border-white/10">
                Belum ada traffic realtime.
              </div>
            ) : (
              combinedEvents.map((event) => (
                <div key={event.id} className="p-4 bg-black/20 border border-white/10 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                    event.tone === "emerald"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                      : event.tone === "gold"
                        ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-300"
                        : event.tone === "violet"
                          ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                          : "border-red-400/30 bg-red-500/10 text-red-300"
                  }`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white text-sm truncate">{event.title}</p>
                      <span className="text-white/30 text-[10px] uppercase tracking-[0.24em] shrink-0">{timeLabel(event.created_at)}</span>
                    </div>
                    <p className="text-white/40 text-xs mt-1 truncate">{event.user} · {event.detail}</p>
                    <p className="text-white/25 text-[10px] uppercase tracking-[0.22em] mt-2">
                      {event.kind === "activity" ? "Request" : "Attendance"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 p-4 border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-2 mb-2 text-white/40 text-[10px] uppercase tracking-[0.24em]">
              <Wifi className="w-3.5 h-3.5 text-cyan-300" />
              Live summary
            </div>
            <p className="text-sm text-white/70">
              Panel ini membaca request activity, absensi, dan event baru dari database secara realtime untuk membantu admin melihat lonjakan trafik atau aktivitas yang tidak biasa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
