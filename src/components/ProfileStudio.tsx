"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { badgeToneClass, deriveBadges, type BadgeChip } from "@/utils/badges";
import { Camera, Loader2, BadgeCheck } from "lucide-react";
import Image from "next/image";

type ProfileStudioProps = {
  userId: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  badges: string[] | null;
  role?: string | null;
};

export function ProfileStudio({ userId, fullName, username, avatarUrl, xp, badges, role }: ProfileStudioProps) {
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl);

  const visibleBadges = deriveBadges({ xp, role, badges }, 12);

  const initials = (fullName ?? username ?? "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setCurrentAvatar(publicUrl);
    setUploading(false);
  };

  return (
    <section className="p-6 md:p-7 bg-white/5 border border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,45,45,0.12),_transparent_40%)] pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row gap-6 lg:items-center">
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5 overflow-hidden">
              {currentAvatar ? (
                <Image src={currentAvatar} alt={fullName ?? username ?? "Profile"} fill unoptimized sizes="96px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/80">
                  {initials}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FF2D2D] text-white border border-black flex items-center justify-center cursor-pointer hover:bg-white hover:text-black transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }} />
            </label>
          </div>

          <div>
            <p className="text-[#FF2D2D] font-mono uppercase tracking-widest text-xs mb-1">Profile Station</p>
            <h2 className="text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
              {fullName ?? "Learner"}
            </h2>
            <p className="text-white/40 text-sm font-mono">{username ?? "no_username"} · XP {xp.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {visibleBadges.length === 0 ? (
              <div className="px-4 py-2 border border-white/10 bg-white/5 text-white/40 text-xs uppercase tracking-widest">
                Badges akan muncul setelah progres dan sertifikasi aktif.
              </div>
            ) : (
              visibleBadges.map((badge: BadgeChip) => (
                <span key={badge.key} className={`inline-flex items-center gap-2 px-3 py-2 border text-xs uppercase tracking-widest ${badgeToneClass(badge.tone)}`}>
                  <BadgeCheck className="w-3.5 h-3.5" />
                  {badge.label}
                </span>
              ))
            )}
          </div>
          {error && <p className="mt-3 text-xs text-[#FF2D2D]">{error}</p>}
        </div>
      </div>
    </section>
  );
}
