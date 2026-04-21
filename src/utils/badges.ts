export type BadgeInput = {
  xp?: number | null;
  role?: string | null;
  badges?: string[] | null;
};

export type BadgeChip = {
  key: string;
  label: string;
  tone: "gold" | "silver" | "bronze" | "accent" | "emerald" | "violet" | "slate";
};

const PRESET_BADGES: Record<string, BadgeChip> = {
  "cert:NV-NET-001": { key: "cert:NV-NET-001", label: "Network Certified", tone: "accent" },
  "cert:NV-SEC-001": { key: "cert:NV-SEC-001", label: "Security Certified", tone: "violet" },
  "cert:NV-SYS-001": { key: "cert:NV-SYS-001", label: "SysAdmin Certified", tone: "emerald" },
  "cert:NV-ADV-001": { key: "cert:NV-ADV-001", label: "Infra Architect", tone: "gold" },
  "rank:top-1": { key: "rank:top-1", label: "Top 1", tone: "gold" },
  "rank:top-2": { key: "rank:top-2", label: "Top 2", tone: "silver" },
  "rank:top-3": { key: "rank:top-3", label: "Top 3", tone: "bronze" },
  "xp:1000": { key: "xp:1000", label: "Elite", tone: "accent" },
  "xp:500": { key: "xp:500", label: "Pro", tone: "emerald" },
};

export function deriveBadges(input: BadgeInput): BadgeChip[] {
  const result: BadgeChip[] = [];
  const seen = new Set<string>();

  const add = (badge: BadgeChip | undefined) => {
    if (!badge || seen.has(badge.key)) return;
    seen.add(badge.key);
    result.push(badge);
  };

  const normalized = Array.isArray(input.badges) ? input.badges : [];
  normalized.forEach((badge) => add(PRESET_BADGES[badge]));

  const xp = input.xp ?? 0;
  if (xp >= 1000) add(PRESET_BADGES["xp:1000"]);
  if (xp >= 500) add(PRESET_BADGES["xp:500"]);

  if (input.role === "teacher") {
    add({ key: "role:teacher", label: "Mentor", tone: "violet" });
  }
  if (input.role === "admin") {
    add({ key: "role:admin", label: "Admin", tone: "slate" });
  }

  return result.slice(0, 4);
}

export function badgeToneClass(tone: BadgeChip["tone"]) {
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
    case "slate":
      return "bg-white/10 text-white/70 border-white/10";
    default:
      return "bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/30";
  }
}
