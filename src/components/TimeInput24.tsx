"use client";

import { useMemo } from "react";

type TimeInput24Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  minuteStep?: number;
  disabled?: boolean;
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function clampInt(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!match) return { hour: 6, minute: 0 };
  const hour = clampInt(Number(match[1]), 0, 23);
  const minute = clampInt(Number(match[2]), 0, 59);
  return { hour, minute };
}

export function TimeInput24({ value, onChange, className, minuteStep = 1, disabled }: TimeInput24Props) {
  const { hour, minute } = useMemo(() => parseTime(value || "06:00"), [value]);
  const safeStep = clampInt(minuteStep, 1, 60);

  const minuteOptions = useMemo(() => {
    const items: number[] = [];
    for (let m = 0; m < 60; m += safeStep) items.push(m);
    // ensure current minute is selectable even if it doesn't align with step
    if (!items.includes(minute)) items.push(minute);
    return items.sort((a, b) => a - b);
  }, [minute, safeStep]);

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-2">
        <select
          disabled={disabled}
          value={pad2(hour)}
          onChange={(e) => onChange(`${e.target.value}:${pad2(minute)}`)}
          className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm"
        >
          {Array.from({ length: 24 }).map((_, idx) => (
            <option key={idx} value={pad2(idx)}>
              {pad2(idx)}
            </option>
          ))}
        </select>
        <select
          disabled={disabled}
          value={pad2(minute)}
          onChange={(e) => onChange(`${pad2(hour)}:${e.target.value}`)}
          className="w-full bg-[#0A0A0A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#FF2D2D]/50 transition-colors text-sm"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={pad2(m)}>
              {pad2(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

