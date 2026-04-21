"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { Plus, BookOpen, ClipboardList, Users, Upload, LogOut, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

type Course = { id: string; title: string; category: string; level: string; is_published: boolean };
type Assignment = { id: string; title: string; due_date: string | null; courses: { title: string } | null; classes: { name: string } | null };

export default function TeacherDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [tab, setTab] = useState<"courses" | "assignments">("courses");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

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
        <div className="container mx-auto mt-8 flex gap-2">
          {(["courses", "assignments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest transition-colors ${tab === t ? "bg-[#FF2D2D] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}>
              {t === "courses" ? "Materi & Kursus" : "Tugas & Proyek"}
            </button>
          ))}
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
      </div>
    </main>
  );
}
