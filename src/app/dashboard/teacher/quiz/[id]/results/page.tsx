"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, ChevronRight, FileSpreadsheet, FileText, Loader2, Trophy } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatJakartaDateTime } from "@/utils/datetime";

type AttemptRow = {
  id: string;
  score: number | null;
  total_questions: number | null;
  correct_answers: number | null;
  submitted_at: string | null;
  started_at: string;
  profiles: { full_name: string | null; username: string | null } | null;
};

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.id as string;
  const supabase = useMemo(() => createClient(), []);
  const [quizTitle, setQuizTitle] = useState("");
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: qz } = await supabase.from("quizzes").select("title").eq("id", quizId).single();
      setQuizTitle(qz?.title ?? "Ujian");

      const { data: att } = await supabase
        .from("quiz_attempts")
        .select("id, score, total_questions, correct_answers, submitted_at, started_at, profiles(full_name, username)")
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      setAttempts((att ?? []) as unknown as AttemptRow[]);
      setLoading(false);
    };
    init();
  }, [quizId, router, supabase]);

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.score !== null);
    const percentages = completed.map((a) => {
      const correct = a.correct_answers ?? 0;
      const total = a.total_questions ?? 0;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    });
    const avg = percentages.length ? Math.round(percentages.reduce((s, v) => s + v, 0) / percentages.length) : 0;
    const passed = percentages.filter((s) => s >= 70).length;
    return { total: attempts.length, completed: completed.length, avg, passed, passRate: completed.length ? Math.round((passed / completed.length) * 100) : 0 };
  }, [attempts]);

  const exportRows = attempts.map((att) => {
    const name = att.profiles?.full_name ?? att.profiles?.username ?? "Tidak Dikenal";
    const correct = att.correct_answers ?? 0;
    const total = att.total_questions ?? 0;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      Nama: name,
      Skor: att.score ?? "",
      Maksimum: total || "",
      Persentase: `${percent}%`,
      Benar: att.correct_answers ?? "",
      Total_Soal: att.total_questions ?? "",
      Status: att.score == null ? "Belum selesai" : percent >= 70 ? "Lulus" : "Belum lulus",
      Dikerjakan: att.submitted_at
        ? formatJakartaDateTime(att.submitted_at, { day: "numeric", month: "long", year: "numeric" })
        : formatJakartaDateTime(att.started_at, { day: "numeric", month: "long", year: "numeric" }),
    };
  });

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
    XLSX.writeFile(workbook, `rekap-nilai-${quizTitle.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`Rekap Nilai - ${quizTitle}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Total peserta: ${stats.total} | Rata-rata: ${stats.avg}% | Lulus: ${stats.passRate}%`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Nama", "Skor", "Maks", "%", "Benar", "Total", "Status", "Dikerjakan"]],
      body: exportRows.map((row) => [
        row.Nama,
        row.Skor === "" ? "-" : String(row.Skor),
        row.Maksimum === "" ? "-" : String(row.Maksimum),
        row.Persentase,
        row.Benar === "" ? "-" : String(row.Benar),
        row.Total_Soal === "" ? "-" : String(row.Total_Soal),
        row.Status,
        row.Dikerjakan,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 45, 45] },
    });
    doc.save(`rekap-nilai-${quizTitle.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4 text-sm text-white/40">
            <Link href="/dashboard/teacher/quiz" className="hover:text-white transition-colors">Ujian</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/dashboard/teacher/quiz/${quizId}`} className="hover:text-white transition-colors truncate max-w-[160px]">{quizTitle}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white/60">Hasil</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-1">Rekap Nilai</p>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                {quizTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 transition-colors text-sm">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-[#FF2D2D]/20 text-[#FF2D2D] hover:bg-[#FF2D2D] hover:text-white border border-[#FF2D2D]/30 transition-colors text-sm">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <Link href={`/dashboard/teacher/quiz/${quizId}`} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Peserta", value: stats.total },
                { label: "Selesai", value: stats.completed },
                { label: "Rata-rata %", value: stats.avg },
                { label: "Tingkat Lulus", value: `${stats.passRate}%` },
              ].map((s) => (
                <div key={s.label} className="p-5 bg-white/5 border border-white/10 text-center">
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            {attempts.length === 0 ? (
              <div className="p-16 bg-white/5 border border-white/10 text-center text-white/30">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Belum ada siswa yang mengerjakan ujian ini.</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/40 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-5 py-4">#</th>
                      <th className="px-5 py-4">Siswa</th>
                      <th className="px-5 py-4">Skor</th>
                      <th className="px-5 py-4">Maks</th>
                      <th className="px-5 py-4">%</th>
                      <th className="px-5 py-4">Benar</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Dikerjakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attempts.map((att, idx) => {
                      const name = (att.profiles as { full_name: string | null; username: string | null } | null)?.full_name
                        ?? (att.profiles as { full_name: string | null; username: string | null } | null)?.username
                        ?? "Tidak Dikenal";
                      const correct = att.correct_answers ?? 0;
                      const total = att.total_questions ?? 0;
                      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
                      const passed = percent >= 70;
                      return (
                        <tr key={att.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-4 text-white/30 font-mono text-xs">{idx + 1}</td>
                          <td className="px-5 py-4 font-bold text-white">{name}</td>
                          <td className="px-5 py-4">
                            <span className={`text-lg font-black ${att.score === null ? "text-white/30" : passed ? "text-green-400" : "text-[#FF2D2D]"}`}>
                              {att.score ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-white/60">{total || "—"}</td>
                          <td className="px-5 py-4 text-white/60">{att.score === null ? "—" : `${percent}%`}</td>
                          <td className="px-5 py-4 text-white/60">
                            {att.correct_answers ?? "—"}/{att.total_questions ?? "—"}
                          </td>
                          <td className="px-5 py-4">
                            {att.score === null ? (
                              <span className="px-2 py-1 bg-white/10 text-white/40 text-xs font-bold uppercase rounded-full">Belum selesai</span>
                            ) : passed ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded-full">Lulus</span>
                            ) : (
                              <span className="px-2 py-1 bg-[#FF2D2D]/20 text-[#FF2D2D] text-xs font-bold uppercase rounded-full">Belum Lulus</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-white/40 text-xs font-mono">
                            {att.submitted_at
                              ? formatJakartaDateTime(att.submitted_at, { day: "numeric", month: "short" })
                              : formatJakartaDateTime(att.started_at, { day: "numeric", month: "short" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
