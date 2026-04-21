import { createClient } from "@/utils/supabase/server";
import { Navigation } from "@/components/Navigation";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, PlayCircle } from "lucide-react";

export default async function LearnLessonPage({ params }: { params: Promise<{ id: string; lesson_id: string }> }) {
  const { id: courseId, lesson_id: lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the lesson and its module
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, modules(title, course_id, courses(title))")
    .eq("id", lessonId)
    .single();

  if (!lesson || lesson.modules?.course_id !== courseId) notFound();

  // Fetch progress
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  const isCompleted = progress?.completed ?? false;

  // Handle Mark as Completed
  const markCompleted = async () => {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from("lesson_progress").upsert({
      student_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString()
    });
  };

  const courseTitle = lesson.modules?.courses?.title ?? "Course";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-28 pb-8 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 text-sm uppercase tracking-widest transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Course
          </Link>
          <p className="text-[#FF2D2D] font-mono text-sm uppercase tracking-widest mb-2">{courseTitle} &middot; BAB: {lesson.modules?.title}</p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
            {lesson.title}
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 py-12 max-w-4xl">
        {lesson.video_url && (
          <div className="mb-12 aspect-video bg-black border border-white/10 flex items-center justify-center relative overflow-hidden group">
            {lesson.video_url.includes("youtube.com") || lesson.video_url.includes("youtu.be") ? (
              <iframe
                src={`https://www.youtube.com/embed/${lesson.video_url.split("v=")[1]?.split("&")[0] || lesson.video_url.split("youtu.be/")[1]}`}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <a href={lesson.video_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-4 hover:scale-110 transition-transform text-[#FF2D2D]">
                <PlayCircle className="w-16 h-16" />
                <span className="text-white font-bold tracking-widest uppercase text-sm">Buka Video Eksternal</span>
              </a>
            )}
          </div>
        )}

        {lesson.content && (
          <div className="prose prose-invert prose-p:text-white/70 prose-headings:text-white prose-a:text-[#FF2D2D] max-w-none mb-16 whitespace-pre-wrap">
            {lesson.content}
          </div>
        )}

        <div className="flex items-center justify-between p-8 bg-white/5 border border-white/10">
          <div>
            <h3 className="font-bold text-lg uppercase tracking-wide mb-1">Progress Belajar</h3>
            <p className="text-white/40 text-sm">Tandai materi ini selesai untuk meningkatkan persentase progress kamu.</p>
          </div>
          
          {isCompleted ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 font-bold uppercase tracking-widest text-sm">
              <CheckCircle2 className="w-5 h-5" /> Selesai
            </div>
          ) : (
            <form action={markCompleted}>
              <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors">
                <Circle className="w-5 h-5" /> Tandai Selesai
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
