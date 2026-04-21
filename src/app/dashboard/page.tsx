"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { BookOpen, ClipboardList, Zap, Camera, Users, ChevronRight } from "lucide-react";

type ClassInfo = { name: string; grade: string; section: string };
type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  role: string;
  xp: number | null;
  avatar_url: string | null;
  badges: string[] | null;
  class_id: string | null;
  classes: ClassInfo | null;
};
type ClassRow = { id: string; name: string; grade: string; section: string };
type AssignmentRow = { id: string; title: string; courses: { title: string } | null };
type QuizRow = { id: string; title: string; end_at: string | null };
type CourseRow = { id: string; title: string; category?: string | null; level?: string | null; duration_hours?: number | null };
type SubmissionRow = { assignment_id: string };
type AttemptRow = { quiz_id: string };

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [submissions, setSubmissions] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, username, role, xp, avatar_url, badges, class_id, classes(name, grade, section)")
        .eq("id", user.id)
        .single();

      if (p?.role === "admin") { router.push("/dashboard/admin"); return; }
      if (p?.role === "teacher") { router.push("/dashboard/teacher"); return; }
      
      const normalizedProfile: Profile | null = p
        ? {
            ...p,
            classes: Array.isArray(p.classes) ? p.classes[0] ?? null : p.classes ?? null,
          }
        : null;

      setProfile(normalizedProfile);

      const classFilter = p?.class_id ? `class_id.eq.${p.class_id},class_id.is.null` : `class_id.is.null`;

      const [{ data: cl }, { data: asgn }, { data: qz }, { data: crs }, { data: sub }, { data: att }] = await Promise.all([
        supabase.from("classes").select("*").order("name"),
        supabase.from("assignments").select("*, courses(title)").eq("class_id", p?.class_id ?? "00000000-0000-0000-0000-000000000000").order("due_date", { ascending: true }).limit(5),
        supabase.from("quizzes").select("id, title, end_at").or(classFilter).eq("is_published", true),
        supabase.from("courses").select("*").or(classFilter).eq("is_published", true).limit(6),
        supabase.from("submissions").select("assignment_id").eq("student_id", user.id),
        supabase.from("quiz_attempts").select("quiz_id").eq("student_id", user.id),
      ]);

      setClasses(cl ?? []);
      setAssignments(asgn ?? []);
      setQuizzes(qz ?? []);
      setCourses(crs ?? []);
      setSubmissions(new Set((sub ?? []).map((s: SubmissionRow) => s.assignment_id)));
      setAttempts(new Set((att ?? []).map((a: AttemptRow) => a.quiz_id)));
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleJoinClass = async (classId: string) => {
    if (!profile?.id) return;
    setJoining(true);
    const { error } = await supabase.from("profiles").update({ class_id: classId }).eq("id", profile.id);
    if (!error) window.location.reload();
    else { alert("Gagal bergabung: " + error.message); setJoining(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Zap className="w-12 h-12 text-[#FF2D2D] animate-pulse" />
    </div>
  );

  const pendingAssignments = assignments.filter(a => !submissions.has(a.id));
  const pendingQuizzes = quizzes.filter(q => !attempts.has(q.id) && (!q.end_at || new Date(q.end_at) > new Date()));

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
            <div className="flex items-center gap-3 mt-4">
              <span className={`px-3 py-1 border text-xs font-black uppercase tracking-widest ${profile?.classes ? "bg-[#FF2D2D]/10 border-[#FF2D2D]/20 text-[#FF2D2D]" : "bg-white/5 border-white/10 text-white/30"}`}>
                {profile?.classes?.name ?? "Tanpa Kelas"}
              </span>
              <span className="text-white/30 text-xs font-mono uppercase tracking-widest">
                XP: {profile?.xp ?? 0}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/attendance" className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
              <Camera className="w-4 h-4" /> Absensi Wajah
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10 space-y-12">
        
        {/* JOIN CLASS PROMPT */}
        {!profile?.class_id && (
          <div className="p-8 bg-accent/5 border border-accent/20 rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Pilih Kelasmu</h2>
            </div>
            <p className="text-white/60 text-sm mb-6 max-w-xl">Kamu belum terdaftar di kelas manapun. Silakan pilih kelasmu di bawah ini untuk melihat tugas, ujian, dan materi yang relevan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {classes.map((cl) => (
                <button
                  key={cl.id}
                  disabled={joining}
                  onClick={() => handleJoinClass(cl.id)}
                  className="p-4 bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/10 text-left transition-all group"
                >
                  <p className="text-white font-bold group-hover:text-accent transition-colors">{cl.name}</p>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">{cl.grade} - {cl.section}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Assignments */}
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-grotesk)" }}>
              <Zap className="w-6 h-6 text-[#FF2D2D]" /> Tugas Pending
            </h2>
            {pendingAssignments.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 text-center text-white/40">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Semua tugas sudah dikerjakan. Mantap!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map((a) => (
                  <Link key={a.id} href={`/assignments/${a.id}`} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/40 transition-colors group">
                    <div>
                      <p className="font-bold text-white group-hover:text-[#FF2D2D] transition-colors">{a.title}</p>
                      <p className="text-white/40 text-sm">{a.courses?.title ?? "Materi Umum"}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-[#FF2D2D] transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quizzes */}
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-grotesk)" }}>
              📝 Ujian & Ulangan
            </h2>
            {pendingQuizzes.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 text-center text-white/40">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Belum ada ujian yang tersedia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQuizzes.map((q) => (
                  <Link key={q.id} href={`/quiz/${q.id}`} className="flex items-center justify-between p-5 bg-purple-500/10 border border-purple-500/20 group hover:bg-purple-500/20 transition-all">
                    <div>
                      <p className="font-bold text-white">{q.title}</p>
                      <p className="text-white/40 text-sm">Ketuk untuk mulai ujian</p>
                    </div>
                    <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Courses */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Kursus Tersedia
          </h2>
          {courses.length === 0 ? (
            <div className="p-8 bg-white/5 border border-white/10 text-center text-white/40">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Belum ada kursus yang diterbitkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`} className="p-6 bg-white/5 border border-white/10 hover:border-[#FF2D2D]/40 transition-colors group">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#FF2D2D]">{course.category ?? "Umum"}</span>
                  <h3 className="text-lg font-bold text-white mt-2 mb-1 group-hover:text-[#FF2D2D] transition-colors">{course.title}</h3>
                  <p className="text-white/40 text-sm">{course.level} - {course.duration_hours} jam</p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
