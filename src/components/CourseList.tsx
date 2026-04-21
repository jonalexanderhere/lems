"use client";

import { useRef } from "react";
import Link from "next/link";
import { Play, Clock, BarChart } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const courses = [
  {
    id: 1,
    title: "Fundamental Networking (OSI & TCP/IP)",
    level: "Beginner",
    duration: "12 Hours",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Cisco Routing & Switching",
    level: "Intermediate",
    duration: "18 Hours",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Linux Server Administration",
    level: "Intermediate",
    duration: "24 Hours",
    image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Advanced Cybersecurity Operations",
    level: "Advanced",
    duration: "32 Hours",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
  }
];

export function CourseList() {
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
        }
      }
    );
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="py-24 bg-background relative border-t border-white/5 z-10">
      <div className="container mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white uppercase tracking-tight mb-12">
          Featured Training
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link 
              key={course.id} 
              href={`/course/${course.id}`}
              className="course-card group relative flex flex-col aspect-[3/4] rounded-sm overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
            >
              {/* Background Image with Overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${course.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-500" />
              
              {/* Red Glow on Hover */}
              <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 mix-blend-overlay transition-opacity duration-500" />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-end p-6 z-10">
                <div className="translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <div className="flex gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm">
                      <BarChart className="w-3.5 h-3.5 text-accent" />
                      {course.level}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm">
                      <Clock className="w-3.5 h-3.5 text-accent" />
                      {course.duration}
                    </span>
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
      </div>
    </section>
  );
}
