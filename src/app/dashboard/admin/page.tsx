"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Users, TrendingUp, ShieldCheck, GraduationCap, Loader2, LogOut, ArrowRight, AlertTriangle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAttendanceWindow, getLocalDateString } from "@/utils/attendance";
import { AdminTrafficPanel, type TrafficActivityLog, type TrafficAttendanceLog } from "@/components/AdminTrafficPanel";

type Profile = { id: string; full_name: string; username: string; role: string; xp: number; classes: { name: string } | null };
type ClassData = { id: string; name: string; grade: string; section: string; count?: number };
type StudentAccount = {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  role: string;
  xp: number;
  avatar_url: string | null;
  badges: string[];
  class_name: string | null;
};

const GRADE_ORDER = ["X", "XI", "XII", "Alumni"];
const GRADE_NEXT: Record<string, string> = { X: "XI", XI: "XII", XII: "Alumni" };

type ActivityLog = { id: string; user_id: string; action: string; metadata: Record<string, unknown> | null; ip_address: string; created_at: string; profiles: { full_name: string; username: string } | null };
type ActivityLogRow = { id: string; user_id: string; action: string; metadata: Record<string, unknown> | null; ip_address: string; created_at: string; profiles: { full_name: string | null; username: string | null } | { full_name: string | null; username: string | null }[] | null };
type AttendanceTrafficRow = { id: string; student_id: string; status: string; method: string | null; confidence_score: number | null; created_at: string; class_id: string | null; profiles: { full_name: string | null; username: string | null } | { full_name: string | null; username: string | null }[] | null; classes: { name: string } | { name: string }[] | null };
type AttendanceSession = {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  teacher_id: string | null;
  classes: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

type AttendanceSessionRow = {
  id: string;
  class_id: string;
  date: string;
  start_time: string;
  end_time: string;
  teacher_id: string | null;
  classes: { name: string } | { name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [tab, setTab] = useState<"users" | "classes" | "attendance" | "promote" | "logs" | "students" | "traffic">("users");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [trafficActivityLogs, setTrafficActivityLogs] = useState<TrafficActivityLog[]>([]);
  const [trafficAttendanceLogs, setTrafficAttendanceLogs] = useState<TrafficAttendanceLog[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState("");
  const [newYear, setNewYear] = useState("");
  const [updatingRole, setUpdatingRole] = useState("");
  const [resettingEmail, setResettingEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [clockNow, setClockNow] = useState(() => Date.now());

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, profiles(full_name, username)")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data ?? []) as ActivityLog[]);
  }, [supabase]);

  const fetchTrafficData = useCallback(async () => {
    setTrafficLoading(true);
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: activityData }, { data: attendanceData }] = await Promise.all([
        supabase
          .from("activity_logs")
          .select("id, user_id, action, metadata, ip_address, created_at, profiles(full_name, username)")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("attendance_logs")
          .select("id, student_id, status, method, confidence_score, created_at, class_id, profiles(full_name, username), classes(name)")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const activity = (activityData ?? []).map((row: ActivityLogRow) => ({
        id: row.id,
        user_id: row.user_id,
        action: row.action,
        metadata: row.metadata,
        ip_address: row.ip_address,
        created_at: row.created_at,
        profiles: firstItem(row.profiles),
      }));

      const attendance = (attendanceData ?? []).map((row: AttendanceTrafficRow) => ({
        id: row.id,
        student_id: row.student_id,
        status: row.status,
        method: row.method,
        confidence_score: row.confidence_score,
        created_at: row.created_at,
        class_id: row.class_id,
        profiles: firstItem(row.profiles),
        classes: firstItem(row.classes),
      }));

      setTrafficActivityLogs(activity);
      setTrafficAttendanceLogs(attendance);
    } finally {
      setTrafficLoading(false);
    }
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, role, xp, classes(name)")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as unknown as Profile[]);
  }, [supabase]);

  const fetchClasses = useCallback(async () => {
    const response = await fetch("/api/classes");
    if (!response.ok) {
      setClasses([]);
      return;
    }
    const payload = (await response.json()) as { classes?: ClassData[] };
    const cls = payload.classes ?? [];
    // Count students per class
    const { data: counts } = await supabase.from("profiles").select("class_id").not("class_id", "is", null);
    const countMap: Record<string, number> = {};
    counts?.forEach((p: { class_id: string }) => { countMap[p.class_id] = (countMap[p.class_id] ?? 0) + 1; });
    setClasses(cls.map((c) => ({ ...c, count: countMap[c.id] ?? 0 })));
  }, [supabase]);

  const fetchStudents = useCallback(async () => {
    const response = await fetch("/api/management/users");
    if (!response.ok) {
      setStudents([]);
      return;
    }
    const payload = (await response.json()) as { users?: StudentAccount[] };
    setStudents(payload.users ?? []);
  }, []);

  const fetchAttendanceSessions = useCallback(async () => {
    const today = getLocalDateString();
    const { data } = await supabase
      .from("attendance_sessions")
      .select("id, class_id, date, start_time, end_time, teacher_id, classes(name), profiles(full_name)")
      .eq("date", today)
      .order("start_time", { ascending: true });
    const normalized = (data ?? []).map((session: AttendanceSessionRow) => ({
      ...session,
      classes: firstItem(session.classes) ? { name: firstItem(session.classes)!.name } : null,
      profiles: firstItem(session.profiles) ? { full_name: firstItem(session.profiles)!.full_name } : null,
    }));
    setAttendanceSessions(normalized);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
      if (p?.role !== "admin") { router.push("/dashboard"); return; }
      setProfile(p);
      fetchUsers();
      fetchClasses();
      fetchAttendanceSessions();
      fetchLogs();
      fetchTrafficData();
      fetchStudents();
    };
    init();
  }, [fetchAttendanceSessions, fetchClasses, fetchLogs, fetchStudents, fetchTrafficData, fetchUsers, router, supabase]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!profile) return;

    const activityChannel = supabase
      .channel("admin-traffic-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        const row = payload.new as ActivityLogRow;
        const next = {
          id: row.id,
          user_id: row.user_id,
          action: row.action,
          metadata: row.metadata,
          ip_address: row.ip_address,
          created_at: row.created_at,
          profiles: firstItem(row.profiles),
        };
        setTrafficActivityLogs((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 200));
        setLogs((prev) => [{
          ...next,
          profiles: next.profiles ? {
            full_name: next.profiles.full_name ?? "",
            username: next.profiles.username ?? "",
          } : null,
        }, ...prev].slice(0, 50));
      })
      .subscribe();

    const attendanceChannel = supabase
      .channel("admin-traffic-attendance")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "attendance_logs" }, (payload) => {
        const row = payload.new as AttendanceTrafficRow;
        const next = {
          id: row.id,
          student_id: row.student_id,
          status: row.status,
          method: row.method,
          confidence_score: row.confidence_score,
          created_at: row.created_at,
          class_id: row.class_id,
          profiles: firstItem(row.profiles),
          classes: firstItem(row.classes),
        };
        setTrafficAttendanceLogs((prev) => [next, ...prev.filter((item) => item.id !== next.id)].slice(0, 200));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(activityChannel);
      void supabase.removeChannel(attendanceChannel);
    };
  }, [profile, supabase]);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    setUpdatingRole("");
  };

  const handlePromote = async () => {
    if (!newYear.trim()) { setPromoteResult("❌ Please enter the new academic year label (e.g. 2026/2027)"); return; }
    if (!confirm(`This will promote all classes to the next grade and create new classes for year ${newYear}. Continue?`)) return;
    setPromoting(true);
    setPromoteResult("");

    // Get classes with students
    const { data: classList } = await supabase.from("classes").select("id, grade, section").neq("grade", "Alumni");
    if (!classList) { setPromoteResult("❌ No classes found"); setPromoting(false); return; }

    // Get new year's classes (create first)
    const { error: fnErr } = await supabase.rpc("promote_class_grades", { academic_year_label: newYear });
    if (fnErr) { setPromoteResult("❌ Error: " + fnErr.message); setPromoting(false); return; }

    // For each existing class, find matching next-grade class and move students
    const { data: newClasses } = await supabase.from("classes").select("id, name, grade, section").eq("academic_year_id", 
      (await supabase.from("academic_years").select("id").eq("is_current", true).single()).data?.id ?? ""
    );

    let movedCount = 0;
    for (const cls of classList) {
      const nextGrade = GRADE_NEXT[cls.grade];
      if (!nextGrade) continue;
      const nextClass = newClasses?.find((nc) => nc.grade === nextGrade && nc.section === cls.section);
      if (!nextClass) {
        const alumniClass = newClasses?.find((nc) => nc.grade === "Alumni");
        if (alumniClass) {
          const { data: moved } = await supabase.from("profiles").update({ class_id: alumniClass.id }).eq("class_id", cls.id).select("id");
          movedCount += moved?.length ?? 0;
        }
        continue;
      }
      const { data: moved } = await supabase.from("profiles").update({ class_id: nextClass.id }).eq("class_id", cls.id).select("id");
      movedCount += moved?.length ?? 0;
    }

    setPromoteResult(`✓ Done! ${movedCount} students promoted. New academic year: ${newYear}`);
    fetchClasses();
    setPromoting(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleResetPassword = async (email: string) => {
    setResettingEmail(email);
    setResetMessage("");
    const response = await fetch("/api/management/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok) {
      setResetMessage(payload.error ?? "Gagal mengirim reset password.");
      setResettingEmail("");
      return;
    }
    setResetMessage(`Link reset password terkirim ke ${email}.`);
    setResettingEmail("");
  };

  const roleBadge: Record<string, string> = {
    admin: "bg-[#FF2D2D]/20 text-[#FF2D2D]",
    teacher: "bg-blue-500/20 text-blue-400",
    student: "bg-white/10 text-white/60",
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto flex items-end justify-between">
          <div>
            <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">Panel Administrasi</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
              {profile?.full_name ?? "Administrator"}
            </h1>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>

        <div className="container mx-auto mt-8 flex gap-2 flex-wrap">
          {([
            { key: "users", label: "Pengguna", icon: Users },
            { key: "classes", label: "Kelas", icon: GraduationCap },
            { key: "attendance", label: "Absensi", icon: ShieldCheck },
            { key: "logs", label: "Log Aktivitas", icon: ShieldCheck },
            { key: "traffic", label: "Traffic", icon: Activity },
            { key: "students", label: "Reset Murid", icon: Users },
            { key: "promote", label: "Kenaikan Kelas", icon: GraduationCap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors ${tab === key ? "bg-[#FF2D2D] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10">

        {/* USERS */}
        {tab === "users" && (
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>All Users ({users.length})</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold">
                      {(u.full_name ?? u.username ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.full_name ?? "—"}</p>
                      <p className="text-white/40 text-xs font-mono">{u.username} · {(u.classes as { name: string } | null)?.name ?? "No Class"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 ${roleBadge[u.role] ?? "bg-white/10 text-white/60"}`}>{u.role}</span>
                    <select
                      value={u.role}
                      disabled={updatingRole === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-white/5 border border-white/10 text-white text-xs px-2 py-1.5 outline-none focus:border-[#FF2D2D]/50 cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    {updatingRole === u.id && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLASSES */}
        {tab === "classes" && (
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>Class Roster</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {GRADE_ORDER.map((grade) => (
                <div key={grade}>
                  <h3 className="font-mono text-[#FF2D2D] text-xs uppercase tracking-widest mb-3">Kelas {grade}</h3>
                  {classes.filter((c) => c.grade === grade).map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 mb-2">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-[#FF2D2D]" />
                        <span className="font-bold">{cls.name}</span>
                      </div>
                      <span className="text-white/50 text-sm font-mono">{cls.count ?? 0} siswa</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === "attendance" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Sesi Absensi Hari Ini</h2>
                <p className="text-white/40 text-sm mt-2">Pantau sesi aktif, jam mulai, dan jam selesai dari satu tempat.</p>
              </div>
              <div className="text-white/40 text-sm">{attendanceSessions.length} sesi ditemukan hari ini</div>
            </div>

            {attendanceSessions.length === 0 ? (
              <div className="p-12 bg-white/5 border border-white/10 text-center text-white/40">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Belum ada sesi absensi hari ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {attendanceSessions.map((session) => {
                  const window = getAttendanceWindow(session.date, session.start_time, session.end_time, new Date(clockNow));
                  return (
                    <div key={session.id} className="p-5 bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-widest mb-1">{session.classes?.name ?? "Tanpa Kelas"}</p>
                          <h3 className="font-black text-lg text-white">{session.profiles?.full_name ?? "Guru"}</h3>
                          <p className="text-white/40 text-sm mt-1">Tanggal {new Date(session.date + "T00:00:00+07:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}</p>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${window?.phase === "live" ? "border-green-400/30 bg-green-500/15 text-green-300" : window?.phase === "upcoming" ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-300" : "border-white/10 bg-white/5 text-white/40"}`}>
                          {window?.phase === "live" ? "Aktif" : window?.phase === "upcoming" ? "Menunggu" : "Selesai"}
                        </span>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-bold text-white">{window?.headline ?? "Jadwal tidak tersedia"}</p>
                        <p className="text-white/40 text-xs mt-1">{window?.detail ?? "Data sesi belum lengkap."}</p>
                      </div>
                      <div className="mt-4 h-2 bg-white/10 overflow-hidden">
                        <div
                          className={`h-full transition-all ${window?.phase === "live" ? "bg-green-400" : window?.phase === "upcoming" ? "bg-yellow-400" : "bg-white/20"}`}
                          style={{ width: `${window?.progress ?? 0}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/35">
                        <span>Mulai {window?.startLabel ?? "--:--"}</span>
                        <span>Selesai {window?.endLabel ?? "--:--"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TRAFFIC */}
        {tab === "traffic" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-[0.28em] mb-2">Traffic Center</p>
                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Grafik request dan logs realtime</h2>
                <p className="text-white/40 text-sm mt-2">Pantau request activity, absensi, dan event baru secara live dalam satu panel.</p>
              </div>
              <div className="text-white/40 text-sm">Live feed dari activity_logs + attendance_logs</div>
            </div>
            <AdminTrafficPanel
              activityLogs={trafficActivityLogs}
              attendanceLogs={trafficAttendanceLogs}
              loading={trafficLoading}
              onRefresh={fetchTrafficData}
            />
          </div>
        )}

        {/* LOGS */}
        {tab === "logs" && (
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>Log Aktivitas Mencurigakan</h2>
            <div className="bg-white/5 border border-white/10 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-white/40 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Aksi</th>
                    <th className="px-6 py-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono text-xs text-white/50">{new Date(log.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</td>
                      <td className="px-6 py-4 font-bold">{log.profiles?.full_name ?? log.profiles?.username ?? "System"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase ${
                          log.action.includes("FAILED") ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"
                        }`}>{log.action}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-white/40">{log.ip_address || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STUDENTS */}
        {tab === "students" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Reset Password Murid</h2>
                <p className="text-white/40 text-sm mt-2">Kirim link reset ke akun siswa yang sudah login atau lupa password.</p>
              </div>
              <div className="text-white/40 text-sm">{students.length} akun ditemukan</div>
            </div>

            {resetMessage && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 text-sm text-white/70">
                {resetMessage}
              </div>
            )}

            {students.length === 0 ? (
              <div className="p-12 bg-white/5 border border-white/10 text-center text-white/40">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Belum ada akun murid yang bisa di-reset.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-white">{student.full_name ?? student.username ?? "Tanpa Nama"}</p>
                      <p className="text-white/40 text-xs font-mono">{student.email ?? "-"} · {student.class_name ?? "Tanpa Kelas"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 bg-white/10 text-white/60">Student</span>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(student.email ?? "")}
                        disabled={!student.email || resettingEmail === student.email}
                        className="px-4 py-2 bg-[#FF2D2D] text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                      >
                        {resettingEmail === student.email ? "Sending..." : "Reset Password"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROMOTE */}
        {tab === "promote" && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>Kenaikan Kelas Tahunan</h2>
            <div className="p-6 bg-[#FF2D2D]/5 border border-[#FF2D2D]/20 mb-8 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-[#FF2D2D] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-1">Perhatian!</p>
                <p className="text-white/60 text-sm">Tindakan ini akan memindahkan SEMUA siswa ke kelas berikutnya (X→XI, XI→XII, XII→Alumni) dan membuat kelas baru untuk tahun ajaran yang dipilih.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Tahun Ajaran Baru</label>
                <input
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
                  placeholder="2026/2027"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                />
              </div>

              <div className="p-5 bg-white/5 border border-white/10">
                <p className="text-white/60 text-sm mb-4 font-bold uppercase tracking-widest text-xs">Simulasi Kenaikan:</p>
                <div className="space-y-2">
                  {classes.filter((c) => c.grade !== "Alumni").map((cls) => (
                    <div key={cls.id} className="flex items-center gap-3 text-sm text-white/60">
                      <span className="font-mono font-bold text-white w-28">{cls.name}</span>
                      <ArrowRight className="w-4 h-4 text-[#FF2D2D]" />
                      <span>{GRADE_NEXT[cls.grade]} {cls.grade !== "XII" ? cls.section : "(Alumni)"}</span>
                      <span className="ml-auto text-white/30 font-mono">{cls.count} siswa</span>
                    </div>
                  ))}
                </div>
              </div>

              {promoteResult && (
                <div className={`p-4 border text-sm ${promoteResult.startsWith("✓") ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-[#FF2D2D]/10 border-[#FF2D2D]/20 text-[#FF2D2D]"}`}>
                  {promoteResult}
                </div>
              )}

              <button
                onClick={handlePromote}
                disabled={promoting}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><TrendingUp className="w-5 h-5" /> Jalankan Kenaikan Kelas</>}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
