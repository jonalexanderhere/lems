import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { getAchievementStats } from "@/utils/achievements";
import { deriveBadges } from "@/utils/badges";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, xp").eq("id", user.id).maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stats = await getAchievementStats(supabase, user.id);
  const badges = deriveBadges({ xp: profile.xp ?? 0, role: profile.role, stats }, 12);

  return NextResponse.json({ stats, badges });
}
