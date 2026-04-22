export type BadgeInput = {
  xp?: number | null;
  role?: string | null;
  badges?: string[] | null;
  stats?: AchievementStats | null;
};

export type BadgeChip = {
  key: string;
  label: string;
  tone: "gold" | "silver" | "bronze" | "accent" | "emerald" | "violet" | "slate" | "special";
};

export type BadgeFamily = {
  key: string;
  title: string;
  description: string;
  tone: BadgeChip["tone"];
  total: number;
  icon: string;
  sampleLabels: [string, string, string];
};

export type AchievementStats = {
  lessonsCompleted: number;
  coursesCompleted: number;
  quizAttempts: number;
  quizzesPassed: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  attendanceRecords: number;
};

const PRESET_BADGES: Record<string, BadgeChip> = {
  "cert:NV-NET-001": { key: "cert:NV-NET-001", label: "Network Pathfinder", tone: "accent" },
  "cert:NV-SEC-001": { key: "cert:NV-SEC-001", label: "Security Sentinel", tone: "violet" },
  "cert:NV-SYS-001": { key: "cert:NV-SYS-001", label: "Systems Steward", tone: "emerald" },
  "cert:NV-ADV-001": { key: "cert:NV-ADV-001", label: "Infra Architect", tone: "gold" },
  "special:pioneer": { key: "special:pioneer", label: "Pioneer", tone: "special" },
  "rank:top-1": { key: "rank:top-1", label: "Top 1", tone: "gold" },
  "rank:top-2": { key: "rank:top-2", label: "Top 2", tone: "silver" },
  "rank:top-3": { key: "rank:top-3", label: "Top 3", tone: "bronze" },
  "xp:1000": { key: "xp:1000", label: "XP Elite", tone: "accent" },
  "xp:500": { key: "xp:500", label: "XP Pro", tone: "emerald" },
};

type AutoBadgeRule = {
  prefix: string;
  labelPrefix: string;
  tone: BadgeChip["tone"];
  countKey: keyof AchievementStats | "xp";
  thresholds: number[];
};

const AUTO_BADGE_RULES: AutoBadgeRule[] = [
  {
    prefix: "lesson",
    labelPrefix: "Lesson Trail",
    tone: "accent",
    countKey: "lessonsCompleted",
    thresholds: Array.from({ length: 250 }, (_, index) => index + 1),
  },
  {
    prefix: "course",
    labelPrefix: "Course Path",
    tone: "emerald",
    countKey: "coursesCompleted",
    thresholds: Array.from({ length: 150 }, (_, index) => index + 1),
  },
  {
    prefix: "quiz",
    labelPrefix: "Quiz Sprint",
    tone: "violet",
    countKey: "quizAttempts",
    thresholds: Array.from({ length: 150 }, (_, index) => index + 1),
  },
  {
    prefix: "quiz-pass",
    labelPrefix: "Quiz Triumph",
    tone: "gold",
    countKey: "quizzesPassed",
    thresholds: Array.from({ length: 100 }, (_, index) => index + 1),
  },
  {
    prefix: "assignment",
    labelPrefix: "Task Builder",
    tone: "bronze",
    countKey: "assignmentsSubmitted",
    thresholds: Array.from({ length: 150 }, (_, index) => index + 1),
  },
  {
    prefix: "graded",
    labelPrefix: "Review Seal",
    tone: "slate",
    countKey: "assignmentsGraded",
    thresholds: Array.from({ length: 100 }, (_, index) => index + 1),
  },
  {
    prefix: "attendance",
    labelPrefix: "Attendance Crest",
    tone: "special",
    countKey: "attendanceRecords",
    thresholds: Array.from({ length: 100 }, (_, index) => index + 1),
  },
  {
    prefix: "xp",
    labelPrefix: "XP Ascension",
    tone: "special",
    countKey: "xp",
    thresholds: Array.from({ length: 50 }, (_, index) => (index + 1) * 50),
  },
];

export const BADGE_FAMILIES: BadgeFamily[] = [
  {
    key: "lesson",
    title: "Lesson Trail",
    description: "Lencana harian untuk setiap lesson yang dituntaskan.",
    tone: "accent",
    total: 250,
    icon: "lesson",
    sampleLabels: ["Lesson Trail 001", "Lesson Trail 125", "Lesson Trail 250"],
  },
  {
    key: "course",
    title: "Course Path",
    description: "Jejak pembelajaran yang tumbuh bersama kursus yang selesai.",
    tone: "emerald",
    total: 150,
    icon: "course",
    sampleLabels: ["Course Path 001", "Course Path 075", "Course Path 150"],
  },
  {
    key: "quiz",
    title: "Quiz Sprint",
    description: "Lencana untuk setiap percobaan kuis yang kamu jalani.",
    tone: "violet",
    total: 150,
    icon: "quiz",
    sampleLabels: ["Quiz Sprint 001", "Quiz Sprint 075", "Quiz Sprint 150"],
  },
  {
    key: "quiz-pass",
    title: "Quiz Triumph",
    description: "Lencana kemenangan saat kuis berhasil dilalui.",
    tone: "gold",
    total: 100,
    icon: "quiz-pass",
    sampleLabels: ["Quiz Triumph 001", "Quiz Triumph 050", "Quiz Triumph 100"],
  },
  {
    key: "assignment",
    title: "Task Builder",
    description: "Pencapaian untuk tugas yang berhasil dikirim.",
    tone: "bronze",
    total: 150,
    icon: "assignment",
    sampleLabels: ["Task Builder 001", "Task Builder 075", "Task Builder 150"],
  },
  {
    key: "graded",
    title: "Review Seal",
    description: "Segel untuk tugas yang sudah dinilai guru.",
    tone: "slate",
    total: 100,
    icon: "graded",
    sampleLabels: ["Review Seal 001", "Review Seal 050", "Review Seal 100"],
  },
  {
    key: "attendance",
    title: "Attendance Crest",
    description: "Kehadiran yang konsisten berubah menjadi lencana.",
    tone: "special",
    total: 100,
    icon: "attendance",
    sampleLabels: ["Attendance Crest 001", "Attendance Crest 050", "Attendance Crest 100"],
  },
  {
    key: "xp",
    title: "XP Ascension",
    description: "Milestone XP yang menandai lompatan performa.",
    tone: "special",
    total: 50,
    icon: "xp",
    sampleLabels: ["XP Ascension 050", "XP Ascension 500", "XP Ascension 2500"],
  },
];

export const FEATURED_BADGES = [
  PRESET_BADGES["special:pioneer"],
  PRESET_BADGES["cert:NV-NET-001"],
  PRESET_BADGES["cert:NV-SEC-001"],
  PRESET_BADGES["cert:NV-SYS-001"],
  PRESET_BADGES["cert:NV-ADV-001"],
  PRESET_BADGES["rank:top-1"],
  PRESET_BADGES["rank:top-2"],
  PRESET_BADGES["rank:top-3"],
];

function createAutoBadge(rule: AutoBadgeRule, threshold: number): BadgeChip {
  return {
    key: `${rule.prefix}:${threshold}`,
    label: `${rule.labelPrefix} ${threshold.toString().padStart(3, "0")}`,
    tone: rule.tone,
  };
}

export function deriveBadges(input: BadgeInput, maxResults = 12): BadgeChip[] {
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
  if (xp >= 50) add(PRESET_BADGES["special:pioneer"]);
  if (xp >= 1000) add(PRESET_BADGES["xp:1000"]);
  if (xp >= 500) add(PRESET_BADGES["xp:500"]);

  const stats = input.stats ?? null;
  if (stats) {
    AUTO_BADGE_RULES.forEach((rule) => {
      const countKey = rule.countKey;
      const current = countKey === "xp" ? xp : stats[countKey as keyof AchievementStats];
      rule.thresholds.forEach((threshold) => {
        if (current >= threshold) {
          add(createAutoBadge(rule, threshold));
        }
      });
    });
  }

  if (input.role === "teacher") {
    add({ key: "role:teacher", label: "Mentor", tone: "violet" });
  }
  if (input.role === "admin") {
    add({ key: "role:admin", label: "Admin", tone: "slate" });
  }

  return result.slice(0, Math.max(0, maxResults));
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
    case "special":
      return "bg-gradient-to-r from-cyan-400/15 via-white/10 to-[#FF2D2D]/15 text-cyan-100 border-cyan-300/30 shadow-[0_0_18px_rgba(34,211,238,0.15)]";
    default:
      return "bg-[#FF2D2D]/10 text-[#FF2D2D] border-[#FF2D2D]/30";
  }
}

export function getBadgeIconSrc(key: string, tone: BadgeChip["tone"]) {
  if (key.startsWith("cert:")) return "/badges/cert.svg";
  if (key.startsWith("rank:")) return "/badges/rank.svg";
  if (key === "special:pioneer") return "/badges/pioneer.svg";
  if (key === "role:teacher") return "/badges/mentor.svg";
  if (key === "role:admin") return "/badges/admin.svg";
  if (key.startsWith("lesson:")) return "/badges/lesson.svg";
  if (key.startsWith("course:")) return "/badges/course.svg";
  if (key.startsWith("quiz-pass:")) return "/badges/quiz-pass.svg";
  if (key.startsWith("quiz:")) return "/badges/quiz.svg";
  if (key.startsWith("assignment:")) return "/badges/assignment.svg";
  if (key.startsWith("graded:")) return "/badges/graded.svg";
  if (key.startsWith("attendance:")) return "/badges/attendance.svg";
  if (key.startsWith("xp:")) return "/badges/xp.svg";
  return tone === "special" ? "/badges/pioneer.svg" : "/badges/badge.svg";
}
