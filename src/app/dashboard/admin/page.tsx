"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Users, TrendingUp, ShieldCheck, GraduationCap, Loader2, LogOut, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type Profile = { id: string; full_name: string; username: string; role: string; xp: number; classes: { name: string } | null };
type ClassData = { id: string; name: string; grade: string; section: string; count?: number };

const GRADE_ORDER = ["X", "XI", "XII", "Alumni"];
const GRADE_NEXT: Record<string, string> = { X: "XI", XI: "XII", XII: "Alumni" };

type ActivityLog = { id: string; user_id: string; action: string; metadata: Record<string, unknown> | null; ip_address: string; created_at: string; profiles: { full_name: string; username: string } | null };

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [tab, setTab] = useState<"users" | "classes" | "promote" | "logs" | "traffic">("users");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [promoting, setPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState("");
  const [newYear, setNewYear] = useState("");
  const [updatingRole, setUpdatingRole] = useState("");

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from("activity_logs")
      .select("*, profiles(full_name, username)")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data ?? []) as ActivityLog[]);
  }, [supabase]);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, username, role, xp, classes(name)")
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as unknown as Profile[]);
  }, [supabase]);

  const fetchClasses = useCallback(async () => {
    const { data: cls } = await supabase.from("classes").select("id, name, grade, section").order("grade").order("section");
    if (!cls) { setClasses([]); return; }
    // Count students per class
    const { data: counts } = await supabase.from("profiles").select("class_id").not("class_id", "is", null);
    const countMap: Record<string, number> = {};
    counts?.forEach((p: { class_id: string }) => { countMap[p.class_id] = (countMap[p.class_id] ?? 0) + 1; });
    setClasses(cls.map((c) => ({ ...c, count: countMap[c.id] ?? 0 })));
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
      fetchLogs();
    };
    init();
  }, [fetchClasses, fetchLogs, fetchUsers, router, supabase]);

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
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
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
            { key: "logs", label: "Log Aktivitas", icon: ShieldCheck },
            { key: "traffic", label: "Trafik", icon: TrendingUp },
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
                      <td className="px-6 py-4 font-mono text-xs text-white/50">{new Date(log.created_at).toLocaleString("id-ID")}</td>
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

        {/* TRAFFIC */}
        {tab === "traffic" && (
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>Analitik Trafik Website</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-8 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Total Hits (24j)</p>
                <p className="text-4xl font-black text-white">1,284</p>
                <p className="text-green-400 text-xs mt-2">+12% dari kemarin</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Unique Visitors</p>
                <p className="text-4xl font-black text-white">432</p>
                <p className="text-green-400 text-xs mt-2">+5% dari kemarin</p>
              </div>
              <div className="p-8 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Laju Bounce</p>
                <p className="text-4xl font-black text-white">24%</p>
                <p className="text-accent text-xs mt-2">-2% (Lebih baik)</p>
              </div>
            </div>
            <div className="p-12 bg-white/5 border border-white/10 text-center border-dashed">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent opacity-30" />
              <p className="text-white/40">Grafik trafik real-time sedang diproses...</p>
            </div>
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
