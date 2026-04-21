import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Clock, BarChart, BookOpen } from "lucide-react";

export const metadata = {
  title: "Courses | Netvora Academy",
  description: "Browse all networking, cybersecurity, and sysadmin courses.",
};

const levelColor: Record<string, string> = {
  Beginner: "text-green-400 bg-green-400/10",
  Intermediate: "text-yellow-400 bg-yellow-400/10",
  Advanced: "text-red-400 bg-red-400/10",
};

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, level, duration_hours, category, thumbnail_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-40 pb-16 px-6 md:px-12 border-b border-white/10">
        <div className="container mx-auto">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.3em] text-sm mb-4">All Training</p>
          <h1 className="font-black uppercase tracking-tighter text-5xl md:text-6xl lg:text-7xl leading-none" style={{ fontFamily: "var(--font-grotesk)" }}>
            Courses
          </h1>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto">
          {!courses || courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
              <BookOpen className="w-16 h-16 mb-6 opacity-30" />
              <p className="text-xl font-bold mb-2">No Courses Yet</p>
              <p className="text-sm">Teachers will publish courses soon. Check back later!</p>
              <Link href="/login" className="mt-6 px-6 py-3 bg-[#FF2D2D] text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Login to Dashboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.id}`}
                  className="group relative flex flex-col aspect-[3/4] rounded-sm overflow-hidden bg-white/5 border border-white/10 hover:border-[#FF2D2D]/50 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-[#0A0A0A] to-black" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,45,45,0.18),_transparent_55%)] opacity-80" />
                  {course.thumbnail_url && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-40 mix-blend-screen"
                      style={{ backgroundImage: `url(${course.thumbnail_url})` }}
                    />
                  )}
                  <div className="relative h-full flex flex-col justify-end p-6 z-10">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm w-fit mb-3 ${levelColor[course.level ?? ""] ?? "text-white/60 bg-white/10"}`}>
                      {course.level ?? "Beginner"}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-[#FF2D2D] transition-colors">{course.title}</h3>
                    <div className="flex gap-3 text-white/50 text-xs flex-wrap">
                      {course.duration_hours != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_hours}h</span>}
                      {course.category && <span className="flex items-center gap-1"><BarChart className="w-3 h-3" />{course.category}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
