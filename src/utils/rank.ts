export type LeaderboardRank = {
  position: number;
  label: string;
  tone: "gold" | "silver" | "bronze" | "accent" | "emerald";
};

export function getLeaderboardRank(position: number): LeaderboardRank {
  if (position === 1) {
    return { position, label: "Champion", tone: "gold" };
  }
  if (position === 2) {
    return { position, label: "Runner-up", tone: "silver" };
  }
  if (position === 3) {
    return { position, label: "Podium", tone: "bronze" };
  }
  if (position === 4) {
    return { position, label: "Contender", tone: "accent" };
  }
  return { position, label: "Engineer", tone: "emerald" };
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
