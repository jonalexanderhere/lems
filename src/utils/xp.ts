export async function awardXp(supabase: { from: (table: string) => any }, profileId: string, amount: number) {
  const xpToAdd = Math.max(0, Math.round(amount));
  if (!xpToAdd) return { ok: false, awarded: 0, newXp: null as number | null };

  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", profileId).single();
  const currentXp = typeof profile?.xp === "number" ? profile.xp : 0;

  const { error } = await supabase
    .from("profiles")
    .update({ xp: currentXp + xpToAdd })
    .eq("id", profileId);

  if (error) {
    return { ok: false, awarded: 0, newXp: currentXp };
  }

  return { ok: true, awarded: xpToAdd, newXp: currentXp + xpToAdd };
}
