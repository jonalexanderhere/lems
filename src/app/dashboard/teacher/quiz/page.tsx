"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  BarChart3,
  ArrowLeft,
  FileQuestion,
  Clock,
  Users,
  GraduationCap,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Quiz = {
  id: string;
  title: string;
  type: string;
  is_published: boolean;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  classes: { name: string } | null;
  question_count?: number;
  attempt_count?: number;
};

type ClassItem = { id: string; name: string };

const TYPE_LABELS: Record<string, string> = {
  ulangan_harian: "Ulangan Harian",
  ulangan_semester: "Ulangan Semester",
};

const TYPE_COLORS: Record<string, string> = {
  ulangan_harian: "bg-blue-500/20 text-blue-400",
  ulangan_semester: "bg-purple-500/20 text-purple-400",
};

export default function QuizDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (p?.role === "student") { router.push("/dashboard"); return; }

      // Fetch quizzes with question count and attempt count
      const { data: qz } = await supabase
        .from("quizzes")
        .select("id, title, type, is_published, duration_minutes, start_at, end_at, created_at, classes(name)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (qz) {
        // Enrich with counts
        const enriched = await Promise.all(
          qz.map(async (q) => {
            const { count: qCount } = await supabase
              .from("quiz_questions")
              .select("*", { count: "exact", head: true })
              .eq("quiz_id", q.id);
            const { count: aCount } = await supabase
              .from("quiz_attempts")
              .select("*", { count: "exact", head: true })
              .eq("quiz_id", q.id);
            return {
              ...q,
              classes: Array.isArray(q.classes) ? q.classes[0] ?? null : q.classes,
              question_count: qCount ?? 0,
              attempt_count: aCount ?? 0,
            };
          })
        );
        setQuizzes(enriched as Quiz[]);
      }

      const { data: cl } = await supabase.from("classes").select("id, name").order("grade").order("section");
      setClasses(cl ?? []);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const togglePublish = async (quiz: Quiz) => {
    setToggling(quiz.id);
    await supabase.from("quizzes").update({ is_published: !quiz.is_published }).eq("id", quiz.id);
    setQuizzes((prev) => prev.map((q) => q.id === quiz.id ? { ...q, is_published: !quiz.is_published } : q));
    setToggling("");
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Hapus ujian ini? Semua soal dan hasil siswa akan ikut terhapus.")) return;
    await supabase.from("quizzes").delete().eq("id", id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm";
  const labelCls = "block text-xs uppercase tracking-widest text-white/50 mb-2";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard/teacher" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Panel Guru
            </Link>
            <ChevronRight className="w-4 h-4 text-white/20" />
            <span className="text-white/60 text-sm">Ujian & Ulangan</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">Manajemen Ujian</p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                Ujian & Ulangan
              </h1>
              <p className="text-white/40 mt-2 text-sm">Buat ulangan harian dan ulangan semester dengan soal pilihan ganda.</p>
            </div>
            <Link
              href="/dashboard/teacher/quiz/new"
              className="flex items-center gap-2 px-6 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              <Plus className="w-5 h-5" /> Buat Ujian
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-16 bg-white/5 border border-white/10 text-center">
            <FileQuestion className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold text-white mb-2">Belum ada ujian</h3>
            <p className="text-white/40 mb-6">Buat ulangan harian atau ulangan semester pertama Anda.</p>
            <Link
              href="/dashboard/teacher/quiz/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Ujian Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest ${TYPE_COLORS[quiz.type] ?? "bg-white/10 text-white/60"}`}>
                        {TYPE_LABELS[quiz.type] ?? quiz.type}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${quiz.is_published ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                        {quiz.is_published ? <><CheckCircle2 className="w-3 h-3" /> Aktif</> : <><XCircle className="w-3 h-3" /> Draft</>}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-2">{quiz.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-white/40 text-xs">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {quiz.classes?.name ?? "Semua Kelas"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.duration_minutes} menit
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileQuestion className="w-3.5 h-3.5" />
                        {quiz.question_count} soal
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {quiz.attempt_count} siswa mengerjakan
                      </span>
                    </div>
                    {quiz.start_at && (
                      <p className="text-white/30 text-xs mt-1.5">
                        {new Date(quiz.start_at).toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        {quiz.end_at && " – " + new Date(quiz.end_at).toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/teacher/quiz/${quiz.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Kelola Soal
                    </Link>
                    <Link
                      href={`/dashboard/teacher/quiz/${quiz.id}/results`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Hasil
                    </Link>
                    <button
                      onClick={() => togglePublish(quiz)}
                      disabled={toggling === quiz.id}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${quiz.is_published ? "bg-white/10 text-white hover:bg-white/20" : "bg-green-500/15 text-green-400 hover:bg-green-500/25"}`}
                    >
                      {toggling === quiz.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : quiz.is_published ? <><EyeOff className="w-3.5 h-3.5" /> Nonaktifkan</> : <><Eye className="w-3.5 h-3.5" /> Aktifkan</>}
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#FF2D2D]/10 text-[#FF2D2D] text-xs font-bold uppercase tracking-wide hover:bg-[#FF2D2D]/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
