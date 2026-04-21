"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowLeft, GripVertical, CheckCircle2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

type Lesson = { id: string; title: string; video_url: string; content: string; sort_order: number };
type Module = { id: string; title: string; sort_order: number; lessons: Lesson[] };

export default function CourseBuilder() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const supabase = useMemo(() => createClient(), []);
  const [course, setCourse] = useState<{ title: string; id: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [modTitle, setModTitle] = useState("");
  
  const [lessonForm, setLessonForm] = useState<{ module_id: string; title: string; video_url: string; content: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const { data: c } = await supabase.from("courses").select("id, title").eq("id", id).single();
      if (!c) { router.push("/dashboard/teacher"); return; }
      setCourse(c);
      
      const { data: mods } = await supabase.from("modules").select("*, lessons(*)").eq("course_id", id).order("sort_order", { ascending: true });
      // Sort lessons inside modules
      if (mods) {
        mods.forEach((m: any) => m.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order));
      }
      setModules(mods ?? []);
      setLoading(false);
    };
    init();
  }, [id, router, supabase]);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const sort_order = modules.length;
    const { data, error } = await supabase.from("modules").insert({ course_id: id, title: modTitle, sort_order }).select("*, lessons(*)").single();
    if (data) setModules([...modules, { ...data, lessons: [] }]);
    setShowModuleForm(false);
    setModTitle("");
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Hapus BAB ini dan semua materinya?")) return;
    await supabase.from("modules").delete().eq("id", id);
    setModules(modules.filter(m => m.id !== id));
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm) return;
    const mod = modules.find(m => m.id === lessonForm.module_id);
    if (!mod) return;
    
    const sort_order = mod.lessons.length;
    const { data } = await supabase.from("lessons").insert({
      module_id: lessonForm.module_id,
      title: lessonForm.title,
      video_url: lessonForm.video_url,
      content: lessonForm.content,
      sort_order
    }).select("*").single();

    if (data) {
      setModules(modules.map(m => {
        if (m.id === mod.id) return { ...m, lessons: [...m.lessons, data] };
        return m;
      }));
    }
    setLessonForm(null);
  };

  const handleDeleteLesson = async (modId: string, lessId: string) => {
    if (!confirm("Hapus materi ini?")) return;
    await supabase.from("lessons").delete().eq("id", lessId);
    setModules(modules.map(m => {
      if (m.id === modId) return { ...m, lessons: m.lessons.filter(l => l.id !== lessId) };
      return m;
    }));
  };

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white"><p>Loading...</p></div>;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />
      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <Link href="/dashboard/teacher" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 text-sm uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Panel Guru
          </Link>
          <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">Course Builder</p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{course?.title}</h1>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest">Silabus & Materi</h2>
          <button onClick={() => setShowModuleForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
            <Plus className="w-4 h-4" /> Tambah BAB Baru
          </button>
        </div>

        {showModuleForm && (
          <form onSubmit={handleAddModule} className="mb-8 p-6 bg-white/5 border border-white/10">
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Judul BAB</label>
            <input required autoFocus className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors mb-4" placeholder="Contoh: Pengenalan Topologi Jaringan" value={modTitle} onChange={(e) => setModTitle(e.target.value)} />
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2 bg-[#FF2D2D] text-white font-bold text-sm uppercase tracking-wider">Simpan</button>
              <button type="button" onClick={() => setShowModuleForm(false)} className="px-6 py-2 bg-white/10 text-white font-bold text-sm uppercase tracking-wider">Batal</button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {modules.map((mod, i) => (
            <div key={mod.id} className="bg-[#141414] border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-white/20 cursor-grab" />
                  <h3 className="text-xl font-bold uppercase">BAB {i + 1}: {mod.title}</h3>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setLessonForm({ module_id: mod.id, title: "", video_url: "", content: "" })} className="text-accent hover:text-white text-sm font-bold uppercase flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Tambah Materi
                  </button>
                  <button onClick={() => handleDeleteModule(mod.id)} className="text-white/20 hover:text-[#FF2D2D]">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {lessonForm?.module_id === mod.id && (
                <form onSubmit={handleAddLesson} className="mb-6 p-4 bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold uppercase text-[#FF2D2D] mb-4">Materi Baru</h4>
                  <div className="space-y-4">
                    <div><label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Judul Materi</label><input required className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-2 text-white outline-none focus:border-[#FF2D2D]/50 transition-colors" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
                    <div><label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Video URL (YouTube/Lainnya) - Opsional</label><input type="url" className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-2 text-white outline-none focus:border-[#FF2D2D]/50 transition-colors" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} /></div>
                    <div><label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Konten / Teks (Opsional)</label><textarea rows={4} className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-2 text-white outline-none focus:border-[#FF2D2D]/50 transition-colors resize-none" value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} /></div>
                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="px-5 py-2 bg-[#FF2D2D] text-white font-bold text-xs uppercase tracking-wider">Simpan Materi</button>
                      <button type="button" onClick={() => setLessonForm(null)} className="px-5 py-2 bg-white/10 text-white font-bold text-xs uppercase tracking-wider">Batal</button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-2 pl-8 border-l-2 border-white/5 ml-2.5">
                {mod.lessons.length === 0 ? (
                  <p className="text-white/30 text-sm">Belum ada materi di BAB ini.</p>
                ) : (
                  mod.lessons.map((lesson, j) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-white/5 group hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 font-mono text-sm">{j + 1}.</span>
                        <span className="font-medium text-white/80 group-hover:text-white">{lesson.title}</span>
                      </div>
                      <button onClick={() => handleDeleteLesson(mod.id, lesson.id)} className="text-white/10 hover:text-[#FF2D2D] opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          
          {modules.length === 0 && !showModuleForm && (
            <div className="text-center py-20 text-white/30">
              <p>Belum ada materi di course ini. Silakan tambah BAB pertama.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
