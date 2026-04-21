import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { BookOpen, Trophy, ClipboardList, Zap, LogOut, Terminal as TerminalIcon, Camera } from "lucide-react";
import { TerminalLab } from "@/components/TerminalLab";

export const metadata = { title: "Dashboard | Netvora Academy" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile with class info
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, classes(name, grade, section)")
    .eq("id", user.id)
    .single();

  // Redirect based on role
  if (profile?.role === "admin") redirect("/dashboard/admin");
  if (profile?.role === "teacher") redirect("/dashboard/teacher");

  // Fetch assignments for student's class
  const { data: assignments } = await supabase
    .from("assignments")
    .select("*, courses(title)")
    .eq("class_id", profile?.class_id ?? "")
    .order("due_date", { ascending: true })
    .limit(5);

  // Fetch courses available for student's class
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .or(`class_id.eq.${profile?.class_id},class_id.is.null`)
    .eq("is_published", true)
    .limit(6);

  // Fetch submissions by this student
  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id")
    .eq("student_id", user.id);

  const submittedIds = new Set(submissions?.map((s) => s.assignment_id) ?? []);
  const pendingAssignments = assignments?.filter((a) => !submittedIds.has(a.id)) ?? [];

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      {/* Header */}
      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto flex items-end justify-between">
          <div>
            <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">Dashboard Siswa</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
              Halo, {profile?.full_name?.split(" ")[0] ?? "Engineer"}.
            </h1>
            {profile?.classes && (
              <p className="text-white/50 mt-2 text-lg font-mono">
                {(profile.classes as unknown as { name: string }).name} · {new Date().getFullYear()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/attendance" className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
              <Camera className="w-4 h-4" /> Absensi Wajah
            </Link>
            <form action={signOut}>
              <button type="submit" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-12 space-y-12">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap, label: "Poin XP", value: (profile?.xp ?? 0).toLocaleString() },
            { icon: BookOpen, label: "Kursus Tersedia", value: courses?.length ?? 0 },
            { icon: ClipboardList, label: "Tugas Pending", value: pendingAssignments.length },
            { icon: Trophy, label: "Peringkat", value: "#—" },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-white/5 border border-white/10">
              <stat.icon className="w-6 h-6 text-[#FF2D2D] mb-3" />
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-white/50 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Terminal Lab */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <TerminalIcon className="w-6 h-6 text-accent" />
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
              Laboratorium Terminal TJKT
            </h2>
          </div>
          <TerminalLab />
        </div>

        {/* Pending Assignments */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Tugas Mendatang
          </h2>
          {pendingAssignments.length === 0 ? (
            <div className="p-8 bg-white/5 border border-white/10 text-center text-white/40">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Tidak ada tugas tertunda. Kamu hebat!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAssignments.map((a) => {
                const due = a.due_date ? new Date(a.due_date) : null;
                const isOverdue = due && due < new Date();
                return (
                  <Link key={a.id} href={`/assignments/${a.id}`}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/40 transition-colors group">
                    <div>
                      <p className="font-bold text-white group-hover:text-[#FF2D2D] transition-colors">{a.title}</p>
                      <p className="text-white/40 text-sm">{(a.courses as { title: string })?.title}</p>
                    </div>
                    {due && (
                      <span className={`text-xs font-mono px-3 py-1 ${isOverdue ? "bg-[#FF2D2D]/20 text-[#FF2D2D]" : "bg-white/10 text-white/60"}`}>
                        {isOverdue ? "TERLAMBAT" : due.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Kursus Tersedia
          </h2>
          {!courses || courses.length === 0 ? (
            <div className="p-8 bg-white/5 border border-white/10 text-center text-white/40">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Belum ada kursus yang diterbitkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`}
                  className="p-6 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/40 transition-colors group">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF2D2D]">{course.category ?? "Umum"}</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-1 group-hover:text-[#FF2D2D] transition-colors">{course.title}</h3>
                  <p className="text-white/40 text-sm">{course.level} · {course.duration_hours} jam</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
