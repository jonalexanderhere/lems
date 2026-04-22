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

export type XpProgress = {
  currentXp: number;
  currentLabel: string;
  nextLabel: string | null;
  currentMinXp: number;
  nextMinXp: number | null;
  remainingXp: number | null;
  progress: number;
};

export const XP_TIERS: XpRank[] = [
  { label: "Sovereign", tone: "gold", minXp: 20000 },
  { label: "Mythic", tone: "violet", minXp: 12000 },
  { label: "Commander", tone: "emerald", minXp: 7000 },
  { label: "Architect", tone: "accent", minXp: 4000 },
  { label: "Guardian", tone: "bronze", minXp: 2000 },
  { label: "Strategist", tone: "silver", minXp: 1000 },
  { label: "Specialist", tone: "emerald", minXp: 500 },
  { label: "Scout", tone: "accent", minXp: 250 },
  { label: "Cadet", tone: "bronze", minXp: 100 },
  { label: "Initiate", tone: "silver", minXp: 0 },
];

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
  return XP_TIERS.find((tier) => xp >= tier.minXp) ?? XP_TIERS[XP_TIERS.length - 1];
}

export function normalizeXp(xp: number | null | undefined) {
  return typeof xp === "number" && Number.isFinite(xp) ? xp : 0;
}

export function getXpProgress(xp: number): XpProgress {
  const current = getXpRank(xp);
  const currentIndex = XP_TIERS.findIndex((tier) => tier.label === current.label);
  const nextTier = currentIndex > 0 ? XP_TIERS[currentIndex - 1] : null;
  const lowerBound = current.minXp;
  const upperBound = nextTier?.minXp ?? null;
  const progress = upperBound && upperBound > lowerBound
    ? Math.max(0, Math.min(100, Math.round(((xp - lowerBound) / (upperBound - lowerBound)) * 100)))
    : 100;

  return {
    currentXp: xp,
    currentLabel: current.label,
    nextLabel: nextTier?.label ?? null,
    currentMinXp: lowerBound,
    nextMinXp: upperBound,
    remainingXp: upperBound ? Math.max(0, upperBound - xp) : null,
    progress,
  };
}

export function getRankEmblemSrc(tone: LeaderboardRank["tone"] | XpRank["tone"]) {
  switch (tone) {
    case "gold":
      return "/ranks/gold.svg";
    case "silver":
      return "/ranks/silver.svg";
    case "bronze":
      return "/ranks/bronze.svg";
    case "emerald":
      return "/ranks/emerald.svg";
    case "violet":
      return "/ranks/violet.svg";
    default:
      return "/ranks/accent.svg";
  }
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
