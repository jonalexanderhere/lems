import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 200 }),
    admin
      .from("profiles")
      .select("id, full_name, username, role, xp, avatar_url, badges, class_id, classes(name)")
      .eq("role", "student")
      .order("created_at", { ascending: false }),
  ]);

  const users = (profiles ?? []).map((row) => {
    const authUser = authUsers?.users?.find((entry) => entry.id === row.id);
    const classEntry = Array.isArray(row.classes) ? row.classes[0] ?? null : row.classes;
    return {
      id: row.id,
      email: authUser?.email ?? null,
      full_name: row.full_name,
      username: row.username,
      role: row.role,
      xp: row.xp ?? 0,
      avatar_url: row.avatar_url ?? null,
      badges: Array.isArray(row.badges) ? row.badges : [],
      class_id: row.class_id,
      class_name: classEntry?.name ?? null,
    };
  });

  return NextResponse.json({ users });
}
