import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { createAdminClient } from "@/utils/supabase/admin";
import { notFound } from "next/navigation";
import { Hexagon, BadgeCheck, Trophy, ArrowLeft } from "lucide-react";
import { badgeToneClass, deriveBadges } from "@/utils/badges";
import { getXpProgress, getXpRank, xpRankClass } from "@/utils/rank";
import { getAchievementStats } from "@/utils/achievements";
import Link from "next/link";
import Image from "next/image";
import { RankEmblem } from "@/components/RankEmblem";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, xp, avatar_url, role, classes(name)")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const stats = await getAchievementStats(supabase, id);
  const badges = deriveBadges({ xp: profile.xp ?? 0, role: profile.role, stats }, 12);
  const xpRank = getXpRank(profile.xp ?? 0);
  const xpProgress = getXpProgress(profile.xp ?? 0);
  const displayName = profile.username ?? profile.full_name ?? "Anonymous";
  const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const classEntry = Array.isArray(profile.classes) ? profile.classes[0] ?? null : profile.classes;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-32 pb-16 px-6 md:px-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-accent/5 blur-[120px] rounded-full -translate-y-1/2" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link href="/leaderboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Papan Skor
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 bg-white/5 border border-white/10 p-8">
            <div className="relative w-32 h-32 shrink-0">
              <Hexagon className="w-full h-full absolute text-white/10" />
              <div className="absolute inset-2 rounded-full overflow-hidden border-2 border-white/20 bg-black/50 flex items-center justify-center">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={displayName} fill unoptimized sizes="112px" className="object-cover" />
                ) : (
                  <span className="font-black text-3xl text-white">{initials}</span>
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                <span className="px-3 py-1 bg-white/10 text-white/60 text-xs font-bold uppercase tracking-widest rounded-sm">
                  {profile.role === "admin" ? "Administrator" : profile.role === "teacher" ? "Guru" : "Siswa"}
                </span>
                {classEntry && (
                  <span className="px-3 py-1 bg-[#FF2D2D]/10 text-[#FF2D2D] text-xs font-bold uppercase tracking-widest rounded-sm">
                    {classEntry.name}
                  </span>
                )}
              </div>
              <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tighter text-white mb-1" style={{ fontFamily: "var(--font-grotesk)" }}>
                {displayName}
              </h1>
              <p className="text-white/40 font-mono text-sm">{profile.full_name ?? "Tidak ada nama lengkap"}</p>
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 mt-3 border text-[10px] font-bold uppercase tracking-[0.24em] ${xpRankClass(xpRank.tone)}`}>
                <RankEmblem tone={xpRank.tone} label={`Rank ${xpRank.label}`} size={24} />
                Rank: {xpRank.label}
              </span>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <div className="p-4 bg-white/5 border border-white/10 text-left">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Target rank berikutnya</p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {xpProgress.nextLabel && xpProgress.nextMinXp !== null
                      ? `${xpProgress.nextLabel} (${xpProgress.nextMinXp.toLocaleString("id-ID")} XP)`
                      : "Tier maksimum"}
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 text-left">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Sisa XP</p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {xpProgress.remainingXp !== null ? `${xpProgress.remainingXp.toLocaleString("id-ID")} XP lagi` : "Sudah mencapai puncak"}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right p-6 bg-black/40 border border-white/5 rounded-sm">
              <p className="font-black text-4xl md:text-5xl text-white flex items-center justify-center md:justify-end gap-3">
                <Trophy className="w-8 h-8 text-[#FF2D2D]" />
                {(profile.xp ?? 0).toLocaleString()}
              </p>
              <p className="text-[#FF2D2D] text-xs font-bold uppercase tracking-widest mt-1">Total XP</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>
            Pencapaian & Lencana
          </h2>
          
          {badges.length === 0 ? (
            <div className="p-12 text-center text-white/30 border border-white/5 bg-white/[0.02]">
              <BadgeCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Belum ada lencana</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div key={badge.key} className={`p-6 border text-center ${badgeToneClass(badge.tone)} bg-opacity-10 border-opacity-30 flex flex-col items-center justify-center h-full`}>
                  <BadgeCheck className="w-8 h-8 mb-3 opacity-80" />
                  <p className="font-bold text-sm uppercase tracking-wider">{badge.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
