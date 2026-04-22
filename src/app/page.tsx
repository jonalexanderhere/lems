import { createClient } from "@/utils/supabase/server";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { AboutNetvora } from "@/components/AboutNetvora";
import { Footer } from "@/components/Footer";
import { Awards } from "@/components/Awards";
import { Analytics } from "@/components/Analytics";
import { AITutorTeaser } from "@/components/AITutorTeaser";
import { LiveLeaderboard } from "@/components/LiveLeaderboard";
import { TrustBadges } from "@/components/TrustBadges";
import { normalizeXp } from "@/utils/rank";

export default async function Home() {
  const supabase = await createClient();

  // Fetch real leaderboard (top 5 by XP)
  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, username, full_name, xp, role")
    .order("xp", { ascending: false })
    .limit(5);

  const rankedLeaders = (leaders ?? [])
    .filter((leader) => leader.role !== "teacher" && leader.role !== "admin")
    .map((leader) => ({ ...leader, xp: normalizeXp(leader.xp) }))
    .sort((a, b) => b.xp - a.xp);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Statement />
      <TrustBadges />
      <AboutNetvora />
      <AITutorTeaser />
      <LiveLeaderboard leaders={rankedLeaders} />
      <Analytics />
      <Awards />
      <Footer />
    </main>
  );
}
