import { createClient } from "@/utils/supabase/server";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { CourseCategories } from "@/components/CourseCategories";
import { Footer } from "@/components/Footer";
import { Awards } from "@/components/Awards";
import { Analytics } from "@/components/Analytics";
import { Certification } from "@/components/Certification";
import { AITutorTeaser } from "@/components/AITutorTeaser";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { LiveCourseList } from "@/components/LiveCourseList";

export default async function Home() {
  const supabase = await createClient();

  // Fetch real courses (latest 4 published)
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, level, duration_hours, category, thumbnail_url")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch real leaderboard (top 5 by XP)
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, full_name, xp")
    .eq("role", "student")
    .order("xp", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Statement />
      <CourseCategories />
      <LiveCourseList courses={courses ?? []} />
      <AITutorTeaser />
      <LiveLeaderboard leaders={leaders ?? []} />
      <Certification />
      <Analytics />
      <Awards />
      <Footer />
    </main>
  );
}
