"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, ChevronRight, Eye, EyeOff, Loader2, Plus, Trash2, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type QuizInfo = {
  id: string;
  title: string;
  type: string;
  is_published: boolean;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  classes: { name: string } | null;
};

type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  points: number;
  order_num: number;
};

const TYPE_LABELS: Record<string, string> = {
  ulangan_harian: "Ulangan Harian",
  ulangan_semester: "Ulangan Semester",
};

export default function QuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);

  const [newQ, setNewQ] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "a" as "a" | "b" | "c" | "d",
    points: 1,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: qz } = await supabase
        .from("quizzes")
        .select("id, title, type, is_published, duration_minutes, start_at, end_at, classes(name)")
        .eq("id", quizId)
        .single();

      if (!qz) { router.push("/dashboard/teacher/quiz"); return; }
      setQuiz({ ...qz, classes: Array.isArray(qz.classes) ? qz.classes[0] ?? null : qz.classes } as QuizInfo);

      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_num");
      setQuestions(qs ?? []);

      const { count } = await supabase
        .from("quiz_attempts")
        .select("*", { count: "exact", head: true })
        .eq("quiz_id", quizId);
      setAttemptCount(count ?? 0);

      setLoading(false);
    };
    init();
  }, [quizId, router, supabase]);

  const togglePublish = async () => {
    if (!quiz) return;
    setToggling(true);
    await supabase.from("quizzes").update({ is_published: !quiz.is_published }).eq("id", quiz.id);
    setQuiz((prev) => prev ? { ...prev, is_published: !prev.is_published } : prev);
    setToggling(false);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Hapus soal ini?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data, error: err } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        ...newQ,
        order_num: questions.length,
      })
      .select()
      .single();
    if (err) { setError(err.message); setSaving(false); return; }
    setQuestions((prev) => [...prev, data as Question]);
    setNewQ({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a", points: 1 });
    setShowAddForm(false);
    setSaving(false);
  };

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm";
  const labelCls = "block text-xs uppercase tracking-widest text-white/50 mb-2";
  const optionLabels = ["A", "B", "C", "D"];
  const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
  const optionValues = ["a", "b", "c", "d"] as const;

  if (loading) return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4 text-sm text-white/40">
            <Link href="/dashboard/teacher" className="hover:text-white transition-colors">Panel Guru</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/dashboard/teacher/quiz" className="hover:text-white transition-colors">Ujian</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/60 truncate max-w-[200px]">{quiz?.title}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                  {TYPE_LABELS[quiz?.type ?? ""] ?? quiz?.type}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${quiz?.is_published ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"}`}>
                  {quiz?.is_published ? <><CheckCircle2 className="w-3 h-3" /> Aktif</> : <><XCircle className="w-3 h-3" /> Draft</>}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                {quiz?.title}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {quiz?.classes?.name ?? "Semua Kelas"} · {quiz?.duration_minutes} menit · {questions.length} soal · {attemptCount} siswa mengerjakan
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/teacher/quiz/${quizId}/results`}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
              >
                <BarChart3 className="w-4 h-4" /> Lihat Hasil
              </Link>
              <button
                onClick={togglePublish}
                disabled={toggling}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${quiz?.is_published ? "bg-white/10 text-white hover:bg-white/20" : "bg-green-500/15 text-green-400 hover:bg-green-500/25"}`}
              >
                {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : quiz?.is_published ? <><EyeOff className="w-4 h-4" /> Nonaktifkan</> : <><Eye className="w-4 h-4" /> Aktifkan</>}
              </button>
              <Link href="/dashboard/teacher/quiz" className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/40 text-sm hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10 max-w-3xl">
        {error && <div className="mb-6 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">{error}</div>}

        {/* Questions list */}
        <div className="space-y-4 mb-6">
          {questions.length === 0 && !showAddForm && (
            <div className="p-12 bg-white/5 border border-white/10 text-center text-white/30">
              <p className="text-sm">Belum ada soal. Tambahkan soal pertama.</p>
            </div>
          )}
          {questions.map((q, idx) => (
            <div key={q.id} className="p-5 bg-white/5 border border-white/10">
              <div className="flex items-start justify-between gap-4 mb-3">
                <span className="font-black text-[#FF2D2D] text-xs uppercase tracking-widest shrink-0">Soal {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30 font-mono">{q.points} poin</span>
                  <button onClick={() => deleteQuestion(q.id)} className="p-1 text-white/20 hover:text-[#FF2D2D] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-white font-medium mb-3">{q.question_text}</p>
              <div className="grid grid-cols-2 gap-2">
                {optionValues.map((v, oi) => (
                  <div key={v} className={`px-3 py-2 text-sm rounded-sm border flex items-center gap-2 ${q.correct_option === v ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-white/60"}`}>
                    <span className={`font-black text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${q.correct_option === v ? "bg-green-500 text-black" : "bg-white/10 text-white/40"}`}>
                      {optionLabels[oi]}
                    </span>
                    {q[optionKeys[oi]]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add question form */}
        {showAddForm && (
          <form onSubmit={addQuestion} className="p-6 bg-white/5 border border-[#FF2D2D]/20 space-y-4 mb-6">
            <h3 className="font-black text-[#FF2D2D] text-sm uppercase tracking-widest">Tambah Soal Baru</h3>
            <div>
              <label className={labelCls}>Pertanyaan *</label>
              <textarea required rows={3} className={inputCls + " resize-none"} placeholder="Tuliskan soal di sini..." value={newQ.question_text} onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {optionKeys.map((key, oi) => (
                <div key={key}>
                  <label className={labelCls}>Pilihan {optionLabels[oi]}</label>
                  <input required className={inputCls} placeholder={`Pilihan ${optionLabels[oi]}`} value={newQ[key]} onChange={(e) => setNewQ({ ...newQ, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Jawaban Benar *</label>
                <div className="flex gap-2">
                  {optionValues.map((v, oi) => (
                    <button key={v} type="button" onClick={() => setNewQ({ ...newQ, correct_option: v })}
                      className={`flex-1 py-2 font-black text-sm uppercase transition-all ${newQ.correct_option === v ? "bg-green-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                      {optionLabels[oi]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Poin</label>
                <input type="number" min={1} max={100} className={inputCls} value={newQ.points} onChange={(e) => setNewQ({ ...newQ, points: +e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[#FF2D2D] text-white font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Soal"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/20 transition-colors">
                Batal
              </button>
            </div>
          </form>
        )}

        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="w-full py-4 border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Tambah Soal
          </button>
        )}
      </div>
    </main>
  );
}
