"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Upload, FileText, CheckCircle2, Clock, Loader2, Download } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  due_date: string | null;
  max_score: number;
  courses: { title: string } | null;
};

type Submission = {
  id: string;
  file_url: string;
  file_name: string;
  note: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
};

export default function AssignmentPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: a } = await supabase
        .from("assignments")
        .select("*, courses(title)")
        .eq("id", id)
        .single();
      setAssignment(a);

      const { data: s } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", id)
        .eq("student_id", user.id)
        .single();
      setSubmission(s);
      setLoading(false);
    };
    init();
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file to submit."); return; }
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop();
    const path = `${userId}/${id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (upErr) { setError("Upload failed: " + upErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);

    const { data, error: dbErr } = await supabase.from("submissions").upsert({
      assignment_id: id,
      student_id: userId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      note: note,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "assignment_id,student_id" }).select().single();

    if (dbErr) { setError("Save failed: " + dbErr.message); setUploading(false); return; }
    setSubmission(data);

    setGrading(true);
    const gradeResponse = await fetch("/api/auto-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentTitle: assignment?.title,
        assignmentDescription: assignment?.description,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        note,
      }),
    });

    if (gradeResponse.ok) {
      const grade = await gradeResponse.json();
      const score = typeof grade.score === "number" ? grade.score : null;
      const feedback = typeof grade.feedback === "string" ? grade.feedback : null;

      if (score != null) {
        await supabase
          .from("submissions")
          .update({
            score,
            feedback,
            graded_at: new Date().toISOString(),
          })
          .eq("assignment_id", id)
          .eq("student_id", userId);

        setSubmission((prev) =>
          prev
            ? {
                ...prev,
                score,
                feedback,
              }
            : prev
        );
      }
    }

    setGrading(false);
    setUploading(false);
  };

  if (loading) return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF2D2D] animate-spin" />
    </main>
  );

  if (!assignment) return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
      <div className="text-center">
        <p className="text-white/50 text-xl">Assignment not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#FF2D2D] hover:underline">← Back to Dashboard</Link>
      </div>
    </main>
  );

  const due = assignment.due_date ? new Date(assignment.due_date) : null;
  const isOverdue = due && due < new Date() && !submission;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-32 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto max-w-3xl">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-widest text-xs mb-3">
            {(assignment.courses as { title: string } | null)?.title ?? "Assignment"}
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
            {assignment.title}
          </h1>
          {due && (
            <div className={`flex items-center gap-2 text-sm font-mono ${isOverdue ? "text-[#FF2D2D]" : "text-white/50"}`}>
              <Clock className="w-4 h-4" />
              Deadline: {due.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {isOverdue && " (OVERDUE)"}
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-12 max-w-3xl space-y-10">

        {/* Description */}
        {assignment.description && (
          <div className="p-6 bg-white/5 border border-white/10">
            <h2 className="font-bold uppercase tracking-widest text-xs text-white/50 mb-3">Instructions</h2>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}

        {/* Teacher attachment */}
        {assignment.attachment_url && (
          <div className="p-5 bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#FF2D2D]" />
              <div>
                <p className="font-bold text-white text-sm">{assignment.attachment_name}</p>
                <p className="text-white/40 text-xs">Teacher file attachment</p>
              </div>
            </div>
            <a href={assignment.attachment_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition-colors">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        )}

        {/* Submission status / form */}
        {submission ? (
          <div className="p-8 bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <p className="font-black text-green-400 text-xl uppercase tracking-tight">Submitted!</p>
                <p className="text-white/50 text-sm">{new Date(submission.submitted_at).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 mb-4">
              <FileText className="w-5 h-5 text-[#FF2D2D]" />
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="font-mono text-white hover:text-[#FF2D2D] transition-colors text-sm">
                {submission.file_name}
              </a>
            </div>
            {submission.score != null && (
              <div className="mt-4">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Score</p>
                <p className="text-4xl font-black text-white">{submission.score}<span className="text-white/30 text-xl">/{assignment.max_score}</span></p>
                {submission.feedback && <p className="text-white/60 mt-2 text-sm">{submission.feedback}</p>}
              </div>
            )}
            {submission.score == null && (
              <p className="text-white/40 text-sm">{grading ? "Penilaian otomatis sedang berjalan..." : "Menunggu penilaian otomatis..."}</p>
            )}
            {/* Allow resubmission */}
            <button onClick={() => setSubmission(null)} className="mt-4 text-xs text-white/30 hover:text-white transition-colors underline">
              Ganti file submission
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Submit Your Work</h2>

            {error && <div className="p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">{error}</div>}

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Upload File (PPT, Word, PDF, ZIP, etc.)</label>
              <label className="flex items-center gap-4 w-full border-2 border-dashed border-white/20 px-6 py-8 cursor-pointer hover:border-[#FF2D2D]/50 transition-colors">
                <Upload className="w-8 h-8 text-[#FF2D2D] shrink-0" />
                <div>
                  <p className="font-bold text-white">{file ? file.name : "Click to select file"}</p>
                  <p className="text-white/40 text-sm">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "All file types accepted"}</p>
                </div>
                <input type="file" className="hidden" accept="*/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Note to Teacher (optional)</label>
              <textarea rows={3} className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors resize-none text-sm"
                placeholder="Tambahkan catatan jika perlu..."
                value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <button type="submit" disabled={uploading || !file}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50">
              {uploading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : <><Upload className="w-5 h-5" /> Submit Assignment</>}
            </button>
          </form>
        )}

        <Link href="/dashboard" className="block text-center text-white/30 hover:text-white text-sm transition-colors">← Back to Dashboard</Link>
      </div>
    </main>
  );
}
