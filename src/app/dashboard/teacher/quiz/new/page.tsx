"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidLearningClockTime, jakartaInputToUtcIso } from "@/utils/datetime";
import { TimeInput24 } from "@/components/TimeInput24";

type Question = {
  id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "a" | "b" | "c" | "d";
  points: number;
};

const emptyQuestion = (): Question => ({
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "a",
  points: 1,
});

export default function NewQuizPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"info" | "questions">("info");
  const [quizId, setQuizId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "ulangan_harian",
    class_id: "",
    duration_minutes: 60,
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
  });

  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: cl } = await supabase.from("classes").select("id, name").order("grade").order("section");
      setClasses(cl ?? []);
    };
    init();
  }, [router, supabase]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const start_at = form.start_date && form.start_time ? jakartaInputToUtcIso(form.start_date, form.start_time) : null;
    const end_at = form.end_date && form.end_time ? jakartaInputToUtcIso(form.end_date, form.end_time) : null;

    if ((form.start_date || form.start_time) && !start_at) {
      setError("Tanggal atau jam mulai tidak valid. Gunakan format tanggal ISO dan jam 24 jam.");
      setSaving(false);
      return;
    }

    if ((form.end_date || form.end_time) && !end_at) {
      setError("Tanggal atau jam selesai tidak valid. Gunakan format tanggal ISO dan jam 24 jam.");
      setSaving(false);
      return;
    }

    if ((form.start_time && !isValidLearningClockTime(form.start_time)) || (form.end_time && !isValidLearningClockTime(form.end_time))) {
      setError("Jam belajar hanya mendukung 06:00 sampai 23:59, atau 00:00 untuk midnight.");
      setSaving(false);
      return;
    }

    if (start_at && end_at && new Date(end_at).getTime() <= new Date(start_at).getTime()) {
      setError("Waktu selesai harus setelah waktu mulai.");
      setSaving(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("quizzes")
      .insert({
        title: form.title,
        description: form.description || null,
        type: form.type,
        class_id: form.class_id || null,
        duration_minutes: form.duration_minutes,
        start_at,
        end_at,
        teacher_id: user!.id,
        is_published: false,
      })
      .select()
      .single();

    if (err) { setError(err.message); setSaving(false); return; }
    setQuizId(data.id);
    setStep("questions");
    setSaving(false);
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const updateQuestion = (idx: number, field: keyof Question, value: string | number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const rows = questions.map((q, i) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      points: q.points,
      order_num: i,
    }));

    const { error: err } = await supabase.from("quiz_questions").insert(rows);
    if (err) { setError(err.message); setSaving(false); return; }

    router.push(`/dashboard/teacher/quiz/${quizId}`);
  };

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm";
  const labelCls = "block text-xs uppercase tracking-widest text-white/50 mb-2";
  const optionLabels = ["A", "B", "C", "D"];
  const optionKeys: Array<keyof Question> = ["option_a", "option_b", "option_c", "option_d"];
  const optionValues = ["a", "b", "c", "d"] as const;

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
            <span className="text-white/60">Buat Baru</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
            {step === "info" ? "Informasi Ujian" : "Buat Soal"}
          </h1>
          <div className="flex items-center gap-4 mt-4">
            {(["info", "questions"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step === s || (step === "questions" && i === 0) ? "bg-accent text-white" : "bg-white/10 text-white/40"}`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${step === s ? "text-white font-bold" : "text-white/40"}`}>
                  {s === "info" ? "Info Ujian" : "Buat Soal"}
                </span>
                {i < 1 && <ChevronRight className="w-4 h-4 text-white/20 ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10 max-w-3xl">
        {error && (
          <div className="mb-6 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">{error}</div>
        )}

        {/* STEP 1: Info */}
        {step === "info" && (
          <form onSubmit={handleSaveInfo} className="space-y-6">
            <div>
              <label className={labelCls}>Jenis Ujian *</label>
              <div className="grid grid-cols-2 gap-3">
                {(["ulangan_harian", "ulangan_semester"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`p-4 border text-left transition-all ${form.type === t ? "border-[#FF2D2D] bg-[#FF2D2D]/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                  >
                    <p className="font-bold text-white text-sm mb-0.5">
                      {t === "ulangan_harian" ? "📝 Ulangan Harian" : "📚 Ulangan Semester"}
                    </p>
                    <p className="text-white/40 text-xs">
                      {t === "ulangan_harian" ? "Evaluasi rutin per materi/bab" : "Ujian akhir semester komprehensif"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Judul Ujian *</label>
              <input required className={inputCls} placeholder="Ulangan Harian - Routing Protocol" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div>
              <label className={labelCls}>Deskripsi / Petunjuk (opsional)</label>
              <textarea rows={3} className={inputCls + " resize-none"} placeholder="Petunjuk pengerjaan soal..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Target Kelas *</label>
                <select required className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">Pilih kelas...</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Durasi (menit) *</label>
                <input type="number" min={5} max={300} required className={inputCls} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <label className={labelCls}>Waktu Mulai</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  <TimeInput24
                    value={form.start_time}
                    onChange={(next) => setForm({ ...form, start_time: next })}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Waktu Selesai</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  <TimeInput24
                    value={form.end_time}
                    onChange={(next) => setForm({ ...form, end_time: next })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Lanjut Buat Soal →</>}
              </button>
              <Link href="/dashboard/teacher/quiz" className="px-6 py-4 bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Questions */}
        {step === "questions" && (
          <form onSubmit={handleSaveQuestions} className="space-y-6">
            <div className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-widest text-accent">Bulk Import Soal (Opsional)</h3>
              <p className="text-xs text-white/40">Gunakan format: <code className="text-white">Pertanyaan | Pilihan A | Pilihan B | Pilihan C | Pilihan D | Jawaban(a/b/c/d)</code></p>
              <textarea 
                className={inputCls + " font-mono text-[10px] resize-none"} 
                rows={4} 
                placeholder="Contoh: Apa itu IP? | Internet Protocol | Internal Proc | Int Prop | Is Port | a"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    const lines = (e.currentTarget.value).split('\n').filter(l => l.includes('|'));
                    const newQs = lines.map(line => {
                      const parts = line.split('|').map(p => p.trim());
                      const correctOption: Question["correct_option"] = (() => {
                        const option = parts[5]?.toLowerCase();
                        return option === "a" || option === "b" || option === "c" || option === "d" ? option : "a";
                      })();
                      return {
                        question_text: parts[0] || "",
                        option_a: parts[1] || "",
                        option_b: parts[2] || "",
                        option_c: parts[3] || "",
                        option_d: parts[4] || "",
                        correct_option: correctOption,
                        points: 10
                      };
                    });
                    if (newQs.length > 0) {
                      setQuestions(newQs);
                      e.currentTarget.value = "";
                    }
                  }
                }}
              />
              <p className="text-[10px] text-white/20 italic">Tekan Ctrl+Enter untuk memproses teks di atas ke daftar soal di bawah.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10">
              <div className="text-white/60 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-black">i</span>
                Isi semua soal lalu klik Simpan. Semua soal pilihan ganda (A-D).
              </div>
              <button
                type="button"
                onClick={async () => {
                  setSaving(true);
                  // Mock AI generation based on title
                  setTimeout(() => {
                    const aiQuestions: Question[] = [
                      {
                        question_text: `Apa yang dimaksud dengan ${form.title.split("-")[0].trim() || "materi ini"}?`,
                        option_a: "Opsi jawaban yang benar",
                        option_b: "Opsi pengecoh satu",
                        option_c: "Opsi pengecoh dua",
                        option_d: "Opsi pengecoh tiga",
                        correct_option: "a",
                        points: 10,
                      },
                      {
                        question_text: "Manakah dari berikut ini yang merupakan implementasi terbaik?",
                        option_a: "Metode A",
                        option_b: "Metode B",
                        option_c: "Metode C",
                        option_d: "Metode D",
                        correct_option: "b",
                        points: 10,
                      },
                      {
                        question_text: "Apa keuntungan utama menggunakan teknologi ini?",
                        option_a: "Efisiensi tinggi",
                        option_b: "Biaya mahal",
                        option_c: "Lambat",
                        option_d: "Sulit dipelajari",
                        correct_option: "a",
                        points: 10,
                      }
                    ];
                    setQuestions([...aiQuestions]);
                    setSaving(false);
                  }, 1500);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent border border-accent/30 text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-colors"
              >
                <Plus className="w-4 h-4" /> AI Generate (Beta)
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="p-6 bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#FF2D2D] text-sm uppercase tracking-widest">Soal {idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-white/40 uppercase tracking-widest">Poin</label>
                      <input type="number" min={1} max={100} value={q.points} onChange={(e) => updateQuestion(idx, "points", +e.target.value)} className="w-14 bg-[#0A0A0A] border border-white/10 px-2 py-1 text-white text-xs text-center outline-none focus:border-accent/50" />
                    </div>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(idx)} className="p-1.5 text-white/30 hover:text-[#FF2D2D] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Pertanyaan *</label>
                  <textarea required rows={3} className={inputCls + " resize-none"} placeholder="Tuliskan soal di sini..." value={q.question_text} onChange={(e) => updateQuestion(idx, "question_text", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {optionKeys.map((key, oi) => (
                    <div key={key}>
                      <label className={labelCls}>Pilihan {optionLabels[oi]}</label>
                      <input required className={inputCls} placeholder={`Pilihan ${optionLabels[oi]}`} value={q[key] as string} onChange={(e) => updateQuestion(idx, key, e.target.value)} />
                    </div>
                  ))}
                </div>

                <div>
                  <label className={labelCls}>Jawaban Benar *</label>
                  <div className="flex gap-2">
                    {optionValues.map((v, oi) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updateQuestion(idx, "correct_option", v)}
                        className={`flex-1 py-2 font-black text-sm uppercase transition-all ${q.correct_option === v ? "bg-green-500 text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                      >
                        {optionLabels[oi]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addQuestion} className="w-full py-4 border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest">
              <Plus className="w-4 h-4" /> Tambah Soal
            </button>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Simpan {questions.length} Soal ✓</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
