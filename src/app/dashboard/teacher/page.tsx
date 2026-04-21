"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { Plus, BookOpen, ClipboardList, Users, Upload, LogOut, Trash2, Eye, BarChart3, FileSpreadsheet, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Course = { id: string; title: string; category: string; level: string; is_published: boolean };
type Assignment = { id: string; title: string; due_date: string | null; courses: { title: string } | null; classes: { name: string } | null };
type StudentAccount = {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  class_name: string | null;
};
type ReportSubmission = {
  id: string;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  assignments: { title: string; class_id: string | null; classes: { name: string } | null } | null;
  profiles: { full_name: string | null; username: string | null } | null;
};

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([]);
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [tab, setTab] = useState<"courses" | "assignments" | "students" | "reports">("courses");
  const [reportClassId, setReportClassId] = useState("");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [resettingEmail, setResettingEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Course form
  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "Networking", level: "Beginner", duration_hours: 0, class_id: "" });
  // Assignment form
  const [assignForm, setAssignForm] = useState({ title: "", description: "", course_id: "", class_id: "", due_date: "" });
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
      if (p?.role === "student") { router.push("/dashboard"); return; }
      setProfile(p);
      const { data: c } = await supabase.from("courses").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
      setCourses(c ?? []);
      const { data: a } = await supabase.from("assignments").select("*, courses(title), classes(name)").eq("teacher_id", user.id).order("created_at", { ascending: false });
      setAssignments(a ?? []);
      const { data: cl } = await supabase.from("classes").select("id, name").order("grade").order("section");
      setClasses(cl ?? []);
      const response = await fetch("/api/management/users");
      if (response.ok) {
        const payload = (await response.json()) as { users?: StudentAccount[] };
        setStudents(payload.users ?? []);
      }
      const { data: s } = await supabase
        .from("submissions")
        .select("id, score, feedback, submitted_at, graded_at, assignments(title, class_id, classes(name)), profiles(full_name, username)")
        .order("submitted_at", { ascending: false });
      const normalized = (s ?? []).map((row: {
        id: string;
        score: number | null;
        feedback: string | null;
        submitted_at: string;
        graded_at: string | null;
        assignments?: Array<{ title: string; class_id: string | null; classes: Array<{ name: string }> | null }> | { title: string; class_id: string | null; classes: { name: string } | null } | null;
        profiles?: Array<{ full_name: string | null; username: string | null }> | { full_name: string | null; username: string | null } | null;
      }) => ({
        id: row.id,
        score: row.score,
        feedback: row.feedback,
        submitted_at: row.submitted_at,
        graded_at: row.graded_at,
        assignments: (() => {
          const assignment = firstItem(row.assignments as {
            title: string;
            class_id: string | null;
            classes: { name: string } | { name: string }[] | null;
          }[] | {
            title: string;
            class_id: string | null;
            classes: { name: string } | { name: string }[] | null;
          } | null);
          if (!assignment) return null;
          const classEntry = firstItem(assignment.classes as { name: string } | { name: string }[] | null);
          return {
            title: assignment.title,
            class_id: assignment.class_id,
            classes: classEntry ? { name: classEntry.name } : null,
          };
        })(),
        profiles: firstItem(row.profiles),
      }));
      setSubmissions(normalized as ReportSubmission[]);
    };
    init();
  }, [router, supabase]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error: err } = await supabase.from("courses").insert({
      ...courseForm,
      teacher_id: user!.id,
      class_id: courseForm.class_id || null,
      is_published: true,
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    setCourses((prev) => [data, ...prev]);
    setShowCourseForm(false);
    setCourseForm({ title: "", description: "", category: "Networking", level: "Beginner", duration_hours: 0, class_id: "" });
    setSaving(false);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    let attachmentUrl = null;
    let attachmentName = null;

    if (assignFile) {
      const ext = assignFile.name.split(".").pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("assignments").upload(path, assignFile);
      if (upErr) { setError("File upload failed: " + upErr.message); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(path);
      attachmentUrl = urlData.publicUrl;
      attachmentName = assignFile.name;
    }

    const { data, error: err } = await supabase.from("assignments").insert({
      title: assignForm.title,
      description: assignForm.description,
      course_id: assignForm.course_id || null,
      class_id: assignForm.class_id || null,
      due_date: assignForm.due_date || null,
      teacher_id: user!.id,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    }).select("*, courses(title), classes(name)").single();

    if (err) { setError(err.message); setSaving(false); return; }
    setAssignments((prev) => [data, ...prev]);
    setShowAssignmentForm(false);
    setAssignForm({ title: "", description: "", course_id: "", class_id: "", due_date: "" });
    setAssignFile(null);
    setSaving(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await supabase.from("courses").delete().eq("id", id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await supabase.from("assignments").delete().eq("id", id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleResetPassword = async (email: string) => {
    setResettingEmail(email);
    setResetMessage("");
    const response = await fetch("/api/management/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const payload = (await response.json()) as { error?: string; ok?: boolean };
    if (!response.ok) {
      setResetMessage(payload.error ?? "Gagal mengirim reset password.");
      setResettingEmail("");
      return;
    }
    setResetMessage(`Link reset password terkirim ke ${email}.`);
    setResettingEmail("");
  };

  const reportRows = useMemo(() => {
    return submissions.filter((submission) => {
      if (!reportClassId) return true;
      return submission.assignments?.class_id === reportClassId;
    });
  }, [reportClassId, submissions]);

  const reportStats = useMemo(() => {
    const graded = reportRows.filter((row) => typeof row.score === "number");
    const scores = graded.map((row) => Number(row.score ?? 0));
    const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    const passed = scores.filter((score) => score >= 80).length;
    const pending = reportRows.filter((row) => row.score == null).length;

    return {
      total: reportRows.length,
      graded: graded.length,
      averageScore,
      passRate: graded.length ? Math.round((passed / graded.length) * 100) : 0,
      pending,
    };
  }, [reportRows]);

  const exportRows = reportRows.map((row) => ({
    Nama: row.profiles?.full_name ?? row.profiles?.username ?? "Unknown",
    Username: row.profiles?.username ?? "-",
    Kelas: row.assignments?.classes?.name ?? "Unknown",
    Tugas: row.assignments?.title ?? "-",
    Nilai: row.score ?? "",
    Status: row.score == null ? "Belum dinilai" : row.score >= 80 ? "Lulus" : "Belum lulus",
    Dikirim: row.submitted_at ? new Date(row.submitted_at).toLocaleString("id-ID") : "-",
    Dinilai: row.graded_at ? new Date(row.graded_at).toLocaleString("id-ID") : "-",
    Feedback: row.feedback ?? "",
  }));

  const selectedClassLabel = reportClassId ? classes.find((c) => c.id === reportClassId)?.name ?? "Semua Kelas" : "Semua Kelas";

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `laporan-nilai-${selectedClassLabel.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`Laporan Nilai - ${selectedClassLabel}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Total data: ${reportStats.total} | Rata-rata: ${reportStats.averageScore} | Lulus: ${reportStats.passRate}%`, 14, 24);
    autoTable(doc, {
      startY: 30,
      head: [["Nama", "Username", "Kelas", "Tugas", "Nilai", "Status", "Dikirim", "Dinilai"]],
      body: exportRows.map((row) => [
        row.Nama,
        row.Username,
        row.Kelas,
        row.Tugas,
        row.Nilai === "" ? "-" : String(row.Nilai),
        row.Status,
        row.Dikirim,
        row.Dinilai,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 45, 45] },
    });
    doc.save(`laporan-nilai-${selectedClassLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const inputCls = "w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm";
  const labelCls = "block text-xs uppercase tracking-widest text-white/50 mb-2";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto flex items-end justify-between">
          <div>
            <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">Panel Guru</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
              {profile?.full_name ?? "Ahmad Subhan S.kom"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-white/40 hover:text-white text-sm transition-colors">Panel Admin</Link>
            <button onClick={signOut} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="container mx-auto mt-8 flex gap-2 flex-wrap">
          {(["courses", "assignments", "students", "reports"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors ${tab === t ? "bg-[#FF2D2D] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {t === "courses" ? "Materi & Kursus" : t === "assignments" ? "Tugas & Proyek" : t === "students" ? "Reset Murid" : "Analisis & Laporan"}
            </button>
          ))}
          <Link href="/dashboard/teacher/quiz" className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/20 hover:bg-purple-500/25 transition-colors flex items-center gap-1.5">
            📝 Ujian & Ulangan
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-10">

        {error && (
          <div className="mb-6 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">{error}</div>
        )}

        {/* COURSES TAB */}
        {tab === "courses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>My Courses</h2>
              <button onClick={() => setShowCourseForm(!showCourseForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                <Plus className="w-4 h-4" /> New Course
              </button>
            </div>

            {showCourseForm && (
              <form onSubmit={handleCreateCourse} className="mb-8 p-6 bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><label className={labelCls}>Course Title *</label><input required className={inputCls} placeholder="Fundamental Networking" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Description</label><textarea rows={3} className={inputCls + " resize-none"} placeholder="What will students learn?" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
                <div><label className={labelCls}>Category</label>
                  <select className={inputCls} value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}>
                    {["Networking", "Cybersecurity", "System Admin", "Telekomunikasi", "Web Development", "IoT"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Level</label>
                  <select className={inputCls} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                    {["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Duration (hours)</label><input type="number" min={0} className={inputCls} value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: +e.target.value })} /></div>
                <div><label className={labelCls}>Assign to Class (optional)</label>
                  <select className={inputCls} value={courseForm.class_id} onChange={(e) => setCourseForm({ ...courseForm, class_id: e.target.value })}>
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={saving} className="px-6 py-3 bg-[#FF2D2D] text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50">{saving ? "Saving..." : "Create Course"}</button>
                  <button type="button" onClick={() => setShowCourseForm(false)} className="px-6 py-3 bg-white/10 text-white font-bold text-sm uppercase tracking-wider">Cancel</button>
                </div>
              </form>
            )}

            {courses.length === 0 ? (
              <div className="p-12 bg-white/5 border border-white/10 text-center text-white/40">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No courses yet. Create your first course above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((c) => (
                  <div key={c.id} className="p-6 bg-white/5 border border-white/10 flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#FF2D2D] mb-2">{c.category}</span>
                    <h3 className="font-bold text-white text-lg mb-1 flex-1">{c.title}</h3>
                    <p className="text-white/40 text-sm mb-4">{c.level}</p>
                    <div className="flex gap-2">
                      <Link href={`/course/${c.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                      <button onClick={() => handleDeleteCourse(c.id)} className="flex items-center gap-1.5 px-3 py-2 bg-[#FF2D2D]/10 text-[#FF2D2D] text-xs font-bold uppercase tracking-wide hover:bg-[#FF2D2D]/20 transition-colors ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "students" && (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Reset Password Murid</h2>
                <p className="text-white/40 text-sm mt-2">Kirim link reset password ke murid yang kamu handle.</p>
              </div>
              <div className="text-white/40 text-sm">{students.length} akun</div>
            </div>

            {resetMessage && (
              <div className="p-4 bg-white/5 border border-white/10 text-sm text-white/70">{resetMessage}</div>
            )}

            {students.length === 0 ? (
              <div className="p-12 bg-white/5 border border-white/10 text-center text-white/40">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Belum ada akun murid yang tersedia.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-white">{student.full_name ?? student.username ?? "Tanpa Nama"}</p>
                      <p className="text-white/40 text-xs font-mono">{student.email ?? "-"} · {student.class_name ?? "Tanpa Kelas"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetPassword(student.email ?? "")}
                      disabled={!student.email || resettingEmail === student.email}
                      className="px-4 py-2 bg-[#FF2D2D] text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                    >
                      {resettingEmail === student.email ? "Sending..." : "Reset Password"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {tab === "assignments" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Assignments</h2>
              <button onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                <Plus className="w-4 h-4" /> New Assignment
              </button>
            </div>

            {showAssignmentForm && (
              <form onSubmit={handleCreateAssignment} className="mb-8 p-6 bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2"><label className={labelCls}>Assignment Title *</label><input required className={inputCls} placeholder="Lab Cisco: Configure Static Route" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={labelCls}>Description / Instructions</label><textarea rows={4} className={inputCls + " resize-none"} placeholder="Detailed task instructions..." value={assignForm.description} onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} /></div>
                <div><label className={labelCls}>Related Course (optional)</label>
                  <select className={inputCls} value={assignForm.course_id} onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })}>
                    <option value="">No Course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Target Class *</label>
                  <select required className={inputCls} value={assignForm.class_id} onChange={(e) => setAssignForm({ ...assignForm, class_id: e.target.value })}>
                    <option value="">Select class...</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Due Date</label><input type="datetime-local" className={inputCls} value={assignForm.due_date} onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })} /></div>
                <div>
                  <label className={labelCls}>Attachment (PPT / PDF / Word / any file)</label>
                  <label className="flex items-center gap-3 w-full border border-dashed border-white/20 px-4 py-4 cursor-pointer hover:border-[#FF2D2D]/50 transition-colors">
                    <Upload className="w-5 h-5 text-[#FF2D2D] shrink-0" />
                    <span className="text-white/50 text-sm truncate">
                      {assignFile ? assignFile.name : "Click to attach file..."}
                    </span>
                    <input type="file" className="hidden" accept="*/*" onChange={(e) => setAssignFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={saving} className="px-6 py-3 bg-[#FF2D2D] text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50">{saving ? "Uploading & Saving..." : "Create Assignment"}</button>
                  <button type="button" onClick={() => setShowAssignmentForm(false)} className="px-6 py-3 bg-white/10 text-white font-bold text-sm uppercase tracking-wider">Cancel</button>
                </div>
              </form>
            )}

            {assignments.length === 0 ? (
              <div className="p-12 bg-white/5 border border-white/10 text-center text-white/40">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No assignments yet. Create your first assignment above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                    <div>
                      <p className="font-bold text-white">{a.title}</p>
                      <p className="text-white/40 text-sm">{(a.classes as { name: string } | null)?.name ?? "All Classes"} · {a.due_date ? new Date(a.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "No deadline"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/assignments/${a.id}/submissions`} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/20 transition-colors">
                        <Users className="w-3.5 h-3.5" /> Submissions
                      </Link>
                      <button onClick={() => handleDeleteAssignment(a.id)} className="flex items-center gap-1.5 px-3 py-2 bg-[#FF2D2D]/10 text-[#FF2D2D] text-xs font-bold uppercase tracking-wide hover:bg-[#FF2D2D]/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>Analisis Nilai & Rekap</h2>
                <p className="text-white/40 text-sm mt-2">Filter per kelas TJKT, lalu ekspor ke Excel atau PDF untuk laporan guru.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-3 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-sm font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-colors">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
                <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white border border-white/10 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>

            <div className="max-w-sm">
              <label className={labelCls}>Filter Kelas / TJKT</label>
              <select value={reportClassId} onChange={(e) => setReportClassId(e.target.value)} className={inputCls}>
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Total Data</p>
                <p className="text-3xl font-black text-white">{reportStats.total}</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Rata-rata</p>
                <p className="text-3xl font-black text-white">{reportStats.averageScore}</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Lulus</p>
                <p className="text-3xl font-black text-white">{reportStats.passRate}%</p>
              </div>
              <div className="p-6 bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Belum Dinilai</p>
                <p className="text-3xl font-black text-white">{reportStats.pending}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <p className="text-sm uppercase tracking-widest text-white/40">Rekap Detail</p>
                  <p className="text-white font-bold">{selectedClassLabel}</p>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <BarChart3 className="w-4 h-4" />
                  {reportStats.graded} data sudah dinilai
                </div>
              </div>
              {reportRows.length === 0 ? (
                <div className="p-12 text-center text-white/40">
                  <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>Belum ada data nilai untuk filter yang dipilih.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-white/40 uppercase text-xs font-bold">
                      <tr>
                        <th className="px-5 py-4">Siswa</th>
                        <th className="px-5 py-4">Kelas</th>
                        <th className="px-5 py-4">Tugas</th>
                        <th className="px-5 py-4">Nilai</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Dikirim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reportRows.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-4">
                            <p className="font-bold text-white">{row.profiles?.full_name ?? row.profiles?.username ?? "Unknown"}</p>
                            <p className="text-white/40 text-xs">{row.profiles?.username ?? "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-white/70">{row.assignments?.classes?.name ?? "-"}</td>
                          <td className="px-5 py-4 text-white/70">{row.assignments?.title ?? "-"}</td>
                          <td className="px-5 py-4 font-bold text-white">{row.score ?? "-"}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${row.score == null ? "bg-white/10 text-white/50" : row.score >= 80 ? "bg-green-500/20 text-green-300" : "bg-[#FF2D2D]/20 text-[#FF2D2D]"}`}>
                              {row.score == null ? "Belum dinilai" : row.score >= 80 ? "Lulus" : "Belum lulus"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-white/40 text-xs">{new Date(row.submitted_at).toLocaleString("id-ID")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
