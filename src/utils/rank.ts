export type LeaderboardRank = {
  position: number;
  label: string;
  tone: "gold" | "silver" | "bronze" | "accent" | "emerald";
};

export type XpRank = {
  label: string;
  tone: "gold" | "silver" | "bronze" | "accent" | "emerald" | "violet";
  minXp: number;
};

export function getLeaderboardRank(position: number): LeaderboardRank {
  if (position === 1) {
    return { position, label: "Crowned", tone: "gold" };
  }
  if (position === 2) {
    return { position, label: "Apex", tone: "silver" };
  }
  if (position === 3) {
    return { position, label: "Vanguard", tone: "bronze" };
  }
  if (position === 4) {
    return { position, label: "Sentinel", tone: "accent" };
  }
  return { position, label: "Trailblazer", tone: "emerald" };
}

export function getXpRank(xp: number): XpRank {
  if (xp >= 20000) return { label: "Sovereign", tone: "gold", minXp: 20000 };
  if (xp >= 12000) return { label: "Mythic", tone: "violet", minXp: 12000 };
  if (xp >= 7000) return { label: "Commander", tone: "emerald", minXp: 7000 };
  if (xp >= 4000) return { label: "Architect", tone: "accent", minXp: 4000 };
  if (xp >= 2000) return { label: "Guardian", tone: "bronze", minXp: 2000 };
  if (xp >= 1000) return { label: "Strategist", tone: "silver", minXp: 1000 };
  if (xp >= 500) return { label: "Specialist", tone: "emerald", minXp: 500 };
  if (xp >= 250) return { label: "Scout", tone: "accent", minXp: 250 };
  if (xp >= 100) return { label: "Cadet", tone: "bronze", minXp: 100 };
  return { label: "Initiate", tone: "silver", minXp: 0 };
}

export function leaderboardRankClass(tone: LeaderboardRank["tone"]) {
  switch (tone) {
    case "gold":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-400/30";
    case "silver":
      return "bg-slate-300/10 text-slate-200 border-slate-300/20";
    case "bronze":
      return "bg-orange-500/10 text-orange-200 border-orange-400/20";
    case "emerald":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    default:
      return "bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/30";
  }
}

export function xpRankClass(tone: XpRank["tone"]) {
  switch (tone) {
    case "gold":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-400/30";
    case "silver":
      return "bg-slate-300/10 text-slate-200 border-slate-300/20";
    case "bronze":
      return "bg-orange-500/10 text-orange-200 border-orange-400/20";
    case "emerald":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "violet":
      return "bg-violet-500/10 text-violet-300 border-violet-400/20";
    default:
      return "bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/30";
  }
}
