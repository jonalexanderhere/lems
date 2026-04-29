import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, Clock, FileQuestion, GraduationCap, PlayCircle, ShieldAlert } from "lucide-react";
import { formatJakartaDateTime } from "@/utils/datetime";

type QuizPageProps = {
  params: Promise<{ id: string }>;
};

type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  is_published: boolean;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  class_id: string | null;
  classes: { name: string } | { name: string }[] | null;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatRange(startAt: string | null, endAt: string | null) {
  if (!startAt) return "Belum dijadwalkan";
  const start = formatJakartaDateTime(startAt, {
    day: "numeric",
    month: "long",
  });
  if (!endAt) return start;
  const end = formatJakartaDateTime(endAt, {
    day: "numeric",
    month: "long",
  });
  return `${start} - ${end}`;
}

export default async function StudentQuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const [{ data: profile }, { data: quiz }] = await Promise.all([
    supabase.from("profiles").select("role, class_id").eq("id", user.id).single(),
    supabase
      .from("quizzes")
      .select("id, title, description, type, is_published, duration_minutes, start_at, end_at, class_id, classes(name)")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!quiz) notFound();

  const normalizedQuiz = {
    ...quiz,
    classes: firstItem((quiz as QuizRow).classes),
  } as QuizRow & { classes: { name: string } | null };

  const canAccess =
    profile?.role === "teacher" ||
    profile?.role === "admin" ||
    normalizedQuiz.class_id === null ||
    normalizedQuiz.class_id === profile?.class_id;

  if (!canAccess) notFound();

  const now = new Date();
  const isEnded = normalizedQuiz.end_at ? new Date(normalizedQuiz.end_at) < now : false;
  const isStarted = normalizedQuiz.start_at ? new Date(normalizedQuiz.start_at) <= now : true;
  const { count: questionCount } = await supabase
    .from("quiz_questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", id);

  const hasQuestions = (questionCount ?? 0) > 0;
  const canAttempt = normalizedQuiz.is_published && isStarted && !isEnded && hasQuestions;

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, score, total_questions, correct_answers, submitted_at, started_at")
    .eq("quiz_id", id)
    .eq("student_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-10 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto max-w-4xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>

          <div className="flex flex-col gap-4 bg-white/5 border border-white/10 p-6 md:p-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-purple-500/15 text-purple-300 border border-purple-500/20">
                Ujian
              </span>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/50 border border-white/10">
                {normalizedQuiz.type}
              </span>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${canAttempt ? "bg-green-500/15 text-green-300 border-green-500/20" : "bg-white/5 text-white/40 border-white/10"}`}>
                {canAttempt ? "Siap dikerjakan" : "Belum aktif"}
              </span>
            </div>

            <div>
              <p className="text-[#FF2D2D] font-mono text-xs uppercase tracking-widest mb-2">Halaman Ujian Siswa</p>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                {normalizedQuiz.title}
              </h1>
              <p className="text-white/40 mt-3 max-w-2xl">
                {normalizedQuiz.description ?? "Ujian ini akan menampilkan detail, jadwal, dan status pengerjaan untuk siswa yang sesuai kelas."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-4 bg-black/30 border border-white/5">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest mb-2">
                  <GraduationCap className="w-4 h-4" /> Kelas
                </div>
                <p className="font-bold text-white">{normalizedQuiz.classes?.name ?? "Semua Kelas"}</p>
              </div>
              <div className="p-4 bg-black/30 border border-white/5">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest mb-2">
                  <Clock className="w-4 h-4" /> Jadwal
                </div>
                <p className="font-bold text-white">{formatRange(normalizedQuiz.start_at, normalizedQuiz.end_at)}</p>
              </div>
              <div className="p-4 bg-black/30 border border-white/5">
                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest mb-2">
                  <FileQuestion className="w-4 h-4" /> Soal
                </div>
                <p className="font-bold text-white">{questionCount ?? 0} soal</p>
              </div>
            </div>

            <div className="p-4 border border-white/10 bg-white/5">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF2D2D]" />
                {canAttempt
                  ? "Klik mulai untuk mengerjakan kuis ini."
                  : "Ujian belum bisa dikerjakan karena belum aktif, belum dijadwalkan, atau sudah selesai."}
              </p>
              <p className="text-white/40 text-sm mt-2">
                {attempt
                  ? `Kamu sudah punya riwayat pengerjaan. Nilai terakhir: ${attempt.score ?? "-"}${attempt.total_questions ? ` / ${attempt.total_questions}` : ""}${attempt.correct_answers != null ? ` (${attempt.correct_answers} benar)` : ""}`
                  : "Belum ada riwayat pengerjaan untuk akun ini."}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {canAttempt && (
                <Link
                  href={`/quiz/${quiz.id}/take`}
                  className="px-5 py-3 bg-green-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors inline-flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  {attempt && !attempt.submitted_at ? "Lanjut Mengerjakan" : "Mulai Mengerjakan"}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="px-5 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Kembali ke Dashboard
              </Link>
              <span className="text-white/35 text-xs uppercase tracking-widest">
                {canAttempt ? "Halaman sudah aktif" : "Halaman masih dalam penyesuaian"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
