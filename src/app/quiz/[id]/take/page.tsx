"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, CheckCircle2, Clock, Loader2, PlayCircle, Save } from "lucide-react";

type QuizInfo = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  is_published: boolean;
  class_id: string | null;
};

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "a" | "b" | "c" | "d";
  points: number;
  order_num: number;
};

type AttemptRow = {
  id: string;
  answers: Record<string, "a" | "b" | "c" | "d"> | null;
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  started_at: string | null;
  submitted_at: string | null;
};

type ProfileRow = { id: string; role: string; class_id: string | null };

function formatClock(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function QuizTakePage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [answers, setAnswers] = useState<Record<string, "a" | "b" | "c" | "d">>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: profileRow }, { data: quizRow }, { data: questionRows }, { data: attemptRow }] = await Promise.all([
        supabase.from("profiles").select("id, role, class_id").eq("id", user.id).single(),
        supabase
          .from("quizzes")
          .select("id, title, description, duration_minutes, start_at, end_at, is_published, class_id")
          .eq("id", quizId)
          .maybeSingle(),
        supabase
          .from("quiz_questions")
          .select("id, question_text, option_a, option_b, option_c, option_d, correct_option, points, order_num")
          .eq("quiz_id", quizId)
          .order("order_num", { ascending: true }),
        supabase
          .from("quiz_attempts")
          .select("id, answers, score, total_questions, correct_answers, started_at, submitted_at")
          .eq("quiz_id", quizId)
          .eq("student_id", user.id)
          .maybeSingle(),
      ]);

      if (!quizRow || !profileRow || profileRow.role === "teacher" || profileRow.role === "admin") {
        router.push("/dashboard");
        return;
      }

      const normalizedProfile = profileRow as ProfileRow;
      const normalizedQuiz = quizRow as QuizInfo;

      if (normalizedQuiz.class_id && normalizedQuiz.class_id !== normalizedProfile.class_id) {
        router.push("/dashboard");
        return;
      }

      setProfile(normalizedProfile);
      setQuiz(normalizedQuiz);
      setQuestions((questionRows ?? []) as Question[]);
      setAttempt((attemptRow ?? null) as AttemptRow | null);
      setAnswers(((attemptRow?.answers ?? {}) as Record<string, "a" | "b" | "c" | "d">));
      setStarted(Boolean(attemptRow));
      setFinished(Boolean(attemptRow?.submitted_at));
      setLoading(false);
    };

    init();
  }, [quizId, router, supabase]);

  const startQuiz = async () => {
    if (!quiz || !profile) return;
    setStarting(true);
    setError("");

    const { data, error: startError } = await supabase
      .from("quiz_attempts")
      .upsert(
        {
          quiz_id: quiz.id,
          student_id: profile.id,
          answers: answers ?? {},
          started_at: new Date().toISOString(),
        },
        { onConflict: "quiz_id,student_id" }
      )
      .select("id, answers, score, total_questions, correct_answers, started_at, submitted_at")
      .single();

    if (startError) {
      setError(startError.message);
      setStarting(false);
      return;
    }

    setAttempt(data as AttemptRow);
    setAnswers(((data as AttemptRow).answers ?? {}) as Record<string, "a" | "b" | "c" | "d">);
    setStarted(true);
    setStarting(false);
  };

  const handleChoice = (questionId: string, value: "a" | "b" | "c" | "d") => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitQuiz = async () => {
    if (!quiz || !profile) return;
    setSubmitting(true);
    setError("");

    const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    const correctPoints = questions.reduce((sum, q) => {
      const selected = answers[q.id];
      return selected === q.correct_option ? sum + (Number(q.points) || 0) : sum;
    }, 0);
    const correctCount = questions.filter((q) => answers[q.id] === q.correct_option).length;
    const score = totalPoints > 0
      ? Math.round((correctPoints / totalPoints) * 100)
      : Math.round((correctCount / Math.max(questions.length, 1)) * 100);

    const { data, error: submitError } = await supabase
      .from("quiz_attempts")
      .upsert(
        {
          quiz_id: quiz.id,
          student_id: profile.id,
          answers,
          score,
          total_questions: questions.length,
          correct_answers: correctCount,
          started_at: attempt?.started_at ?? new Date().toISOString(),
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "quiz_id,student_id" }
      )
      .select("id, answers, score, total_questions, correct_answers, started_at, submitted_at")
      .single();

    if (submitError) {
      setError(submitError.message);
      setSubmitting(false);
      return;
    }

    setAttempt(data as AttemptRow);
    setFinished(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/50">Kuis tidak ditemukan.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-[#FF2D2D] hover:underline">Kembali ke Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto max-w-5xl">
          <Link href={`/quiz/${quiz.id}`} className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Detail Ujian
          </Link>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[#FF2D2D] font-mono text-xs uppercase tracking-widest mb-2">Halaman Pengerjaan</p>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                {quiz.title}
              </h1>
              <p className="text-white/40 text-sm mt-2 max-w-2xl">
                Mulai pengerjaan saat kamu siap. Jawaban akan disimpan ke Supabase setelah dikirim.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/50">
              <span className="px-3 py-1 border border-white/10 bg-white/5">{questions.length} soal</span>
              <span className="px-3 py-1 border border-white/10 bg-white/5">{quiz.duration_minutes} menit</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10 max-w-5xl space-y-8">
        {error && <div className="p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">{error}</div>}

        {!started && !finished && (
          <div className="p-8 bg-white/5 border border-white/10 space-y-5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#FF2D2D] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-white text-lg">Siap memulai?</h2>
                <p className="text-white/40 text-sm mt-1">
                  Waktu mulai: {formatClock(quiz.start_at)} · Waktu selesai: {formatClock(quiz.end_at)}
                </p>
              </div>
            </div>
            <button
              onClick={startQuiz}
              disabled={starting}
              className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
            >
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              Mulai Mengerjakan
            </button>
          </div>
        )}

        {(started || finished) && (
          <div className="space-y-5">
            {questions.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 text-white/40">
                Belum ada soal yang ditambahkan guru.
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="p-6 bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[#FF2D2D] font-mono text-xs uppercase tracking-widest mb-2">Soal {index + 1}</p>
                      <h3 className="text-lg font-bold text-white">{question.question_text}</h3>
                    </div>
                    <span className="text-white/40 text-xs font-mono">{question.points} poin</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      ["a", question.option_a],
                      ["b", question.option_b],
                      ["c", question.option_c],
                      ["d", question.option_d],
                    ] as const).map(([key, label]) => {
                      const active = answers[question.id] === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleChoice(question.id, key)}
                          disabled={finished}
                          className={`p-4 text-left border transition-colors disabled:opacity-80 ${active ? "border-green-500 bg-green-500/10 text-green-300" : "border-white/10 bg-black/20 text-white/70 hover:border-white/20"}`}
                        >
                          <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase mb-3">
                            {key}
                          </span>
                          <p className="text-sm leading-relaxed">{label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            {!finished && started && (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-white/40 text-sm">Pastikan jawaban sudah benar sebelum mengirim.</p>
                <button
                  onClick={submitQuiz}
                  disabled={submitting || questions.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Kumpulkan Jawaban
                </button>
              </div>
            )}

            {finished && attempt && (
              <div className="p-6 bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-bold text-green-400 uppercase tracking-widest text-sm">Jawaban Terkumpul</p>
                    <p className="text-white/40 text-sm">Dikirim pada {formatClock(attempt.submitted_at)}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm">
                  Nilai akhir: <span className="font-bold text-white">{attempt.score ?? "-"}</span>
                  {attempt.correct_answers != null && attempt.total_questions != null
                    ? ` · Benar ${attempt.correct_answers}/${attempt.total_questions}`
                    : ""}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
