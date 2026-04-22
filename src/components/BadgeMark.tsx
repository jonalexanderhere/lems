"use client";

import Image from "next/image";
import { getBadgeIconSrc, type BadgeChip } from "@/utils/badges";

type BadgeMarkProps = {
  badge: Pick<BadgeChip, "key" | "label" | "tone">;
  size?: number;
  className?: string;
};

export function BadgeMark({ badge, size = 18, className = "" }: BadgeMarkProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/25 shadow-[0_0_18px_rgba(255,255,255,0.08)] ${className}`}
      style={{ width: size, height: size }}
      aria-label={badge.label}
      title={badge.label}
    >
      <Image
        src={getBadgeIconSrc(badge.key, badge.tone)}
        alt={badge.label}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
      <span className="absolute inset-0 rounded-full ring-1 ring-white/10" />
    </span>
  );
}
