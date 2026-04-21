"use client";

import Link from "next/link";
import { BookOpen, Clock, BarChart, Play } from "lucide-react";

type Course = {
  id: string;
  title: string;
  level: string | null;
  duration_hours: number | null;
  category: string | null;
  thumbnail_url: string | null;
};

const levelColor: Record<string, string> = {
  Beginner: "text-green-400 bg-green-400/10",
  Intermediate: "text-yellow-400 bg-yellow-400/10",
  Advanced: "text-red-400 bg-red-400/10",
};

export function LiveCourseList({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <section className="py-24 bg-background relative border-t border-white/5 z-10">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white uppercase tracking-tight mb-12">
            Featured Training
          </h2>
          <div className="p-16 text-center text-white/30 border border-dashed border-white/10 bg-white/[0.02]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Belum ada materi yang dipublikasikan.</p>
            <p className="text-sm mt-2">Guru akan mengisi kursus asli dari dashboard.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background relative border-t border-white/5 z-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white uppercase tracking-tight">
            Materi Unggulan
          </h2>
          <Link href="/courses" className="text-accent hover:text-white uppercase tracking-widest text-sm font-medium transition-colors pb-1 border-b border-accent/30 hover:border-white">
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/course/${course.id}`}
              className="group relative flex flex-col aspect-[3/4] rounded-sm overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-[#0A0A0A] to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,45,45,0.18),_transparent_55%)] opacity-80" />
              <div className="absolute inset-0 opacity-40 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.06)_75%,transparent_75%,transparent)] bg-[length:18px_18px]" />
              {course.thumbnail_url && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-40 mix-blend-screen"
                  style={{ backgroundImage: `url(${course.thumbnail_url})` }}
                />
              )}
              
              <div className="relative h-full flex flex-col justify-end p-6 z-10">
                <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {course.level && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-sm ${levelColor[course.level] ?? "text-white/60 bg-white/10"}`}>
                        <BarChart className="w-3.5 h-3.5" />{course.level}
                      </span>
                    )}
                    {course.duration_hours != null && course.duration_hours > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm">
                        <Clock className="w-3.5 h-3.5 text-accent" />{course.duration_hours}h
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white leading-tight mb-4 group-hover:text-accent transition-colors duration-300">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white">
                      <Play className="w-4 h-4 ml-0.5" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest text-white">Start Course</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
