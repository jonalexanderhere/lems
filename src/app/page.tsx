import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { CourseCategories } from "@/components/CourseCategories";
import { CourseList } from "@/components/CourseList";
import { AITutorTeaser } from "@/components/AITutorTeaser";
import { Leaderboard } from "@/components/Leaderboard";
import { Certification } from "@/components/Certification";
import { Analytics } from "@/components/Analytics";
import { Awards } from "@/components/Awards";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Statement />
      <CourseCategories />
      <CourseList />
      <AITutorTeaser />
      <Leaderboard />
      <Certification />
      <Analytics />
      <Awards />
      <Footer />
    </main>
  );
}
