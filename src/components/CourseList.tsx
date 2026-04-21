"use client";

import { useRef } from "react";
import Link from "next/link";
import { Play, Clock, BarChart, BookOpen } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Course = {
  id: string;
  title: string;
  level: string | null;
  duration_hours: number | null;
  thumbnail_url: string | null;
};

const EMPTY_MESSAGE = "Belum ada materi yang dipublikasikan.";

export function CourseList({ courses = [] }: { courses?: Course[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>(".course-card");

    gsap.fromTo(
      cards,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-background relative border-t border-white/5 z-10">
      <div className="container mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white uppercase tracking-tight mb-12">
          Featured Training
        </h2>

        {courses.length === 0 ? (
          <div className="p-16 text-center text-white/30 border border-dashed border-white/10 bg-white/[0.02]">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{EMPTY_MESSAGE}</p>
            <p className="text-sm mt-2">Guru akan mengisi kursus asli dari dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="course-card group relative flex flex-col aspect-[3/4] rounded-sm overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
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
                  <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                    <div className="flex gap-3 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm">
                        <BarChart className="w-3.5 h-3.5 text-accent" />
                        {course.level ?? "Beginner"}
                      </span>
                      {course.duration_hours != null && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          {course.duration_hours} Hours
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-white leading-tight mb-4 group-hover:text-accent transition-colors duration-300">
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
        )}
      </div>
    </section>
  );
}
