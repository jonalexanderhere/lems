"use client";

import Image from "next/image";
import { getRankEmblemSrc } from "@/utils/rank";

type RankEmblemProps = {
  tone: "gold" | "silver" | "bronze" | "emerald" | "violet" | "accent";
  label: string;
  size?: number;
  className?: string;
};

export function RankEmblem({ tone, label, size = 44, className = "" }: RankEmblemProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/30 shadow-[0_0_24px_rgba(255,255,255,0.08)] ${className}`}
      style={{ width: size, height: size }}
      aria-label={label}
      title={label}
    >
      <Image
        src={getRankEmblemSrc(tone)}
        alt={label}
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={tone === "gold"}
      />
      <span className="absolute inset-0 rounded-full ring-1 ring-white/10" />
    </span>
  );
}
