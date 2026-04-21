import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, Layers3, ShieldCheck } from "lucide-react";

type CoursePageProps = {
  params: Promise<{ id: string }>;
};

type LessonRow = {
  id: string;
  title: string;
  sort_order: number;
};

type ModuleRow = {
  id: string;
  title: string;
  sort_order: number;
  lessons: LessonRow[];
};

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, category, level, duration_hours, thumbnail_url, class_id, classes(name)")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const classEntry = Array.isArray(course.classes) ? course.classes[0] ?? null : course.classes;
  const className = classEntry?.name ?? "Semua Kelas";

  const { data: dbModules } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("sort_order", { ascending: true });

  // sort lessons
  const modules = ((dbModules ?? []) as ModuleRow[]).map((m) => ({
    ...m,
    lessons: [...(m.lessons as LessonRow[])].sort((a, b) => a.sort_order - b.sort_order)
  }));

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto max-w-5xl">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">Course Detail</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none max-w-4xl" style={{ fontFamily: "var(--font-grotesk)" }}>
            {course.title}
          </h1>
          <p className="text-white/50 text-xl max-w-3xl mt-6">{course.description ?? "Course content will be shaped by the teacher."}</p>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="p-8 bg-white/5 border border-white/10">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-5 h-5 text-[#FF2D2D]" />
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                Course Overview
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-4 bg-black/20 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Category</p>
                <p className="font-bold text-white">{course.category ?? "General"}</p>
              </div>
              <div className="p-4 bg-black/20 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Level</p>
                <p className="font-bold text-white">{course.level ?? "Beginner"}</p>
              </div>
              <div className="p-4 bg-black/20 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Duration</p>
                <p className="font-bold text-white">{course.duration_hours ?? 0} hours</p>
              </div>
              <div className="p-4 bg-black/20 border border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Audience</p>
                <p className="font-bold text-white">{className}</p>
              </div>
            </div>

            <div className="space-y-6">
              {modules.length === 0 ? (
                <div className="p-4 text-center text-white/40 border border-white/5 bg-black/20">Belum ada materi untuk course ini.</div>
              ) : (
                modules.map((module, i) => (
                  <div key={module.id} className="bg-black/20 border border-white/5">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="font-bold text-white uppercase">BAB {i + 1}: {module.title}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {module.lessons.map((lesson: LessonRow, j: number) => (
                        <Link key={lesson.id} href={`/course/${course.id}/learn/${lesson.id}`} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors group">
                          <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/50 group-hover:text-[#FF2D2D] group-hover:border-[#FF2D2D]/50 transition-colors shrink-0">
                            {j + 1}
                          </div>
                          <p className="text-white/70 group-hover:text-white transition-colors">{lesson.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Clock3 className="w-5 h-5 text-[#FF2D2D]" />
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                  Why this matters
                </h2>
              </div>
              <p className="text-white/60 leading-relaxed">
                This course is designed to stay practical and foundational. Teachers can publish real materials here without the page exposing any filler content.
              </p>
            </div>

            <div className="p-8 bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Layers3 className="w-5 h-5 text-[#FF2D2D]" />
                <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                  Next Step
                </h2>
              </div>
              <p className="text-white/60 mb-6">Go back to your dashboard to continue learning, submit assignments, or take certification.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-3 px-6 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
