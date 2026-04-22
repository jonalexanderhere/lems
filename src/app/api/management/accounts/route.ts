import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

function firstItem<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resolveRole(profileRole: string | null | undefined, authUser?: { app_metadata?: unknown; user_metadata?: unknown }) {
  const roleFromProfile = typeof profileRole === "string" ? profileRole : null;
  const appMetadataRole = authUser && typeof authUser.app_metadata === "object" && authUser.app_metadata !== null && "role" in authUser.app_metadata
    ? (authUser.app_metadata as { role?: unknown }).role
    : null;
  const userMetadataRole = authUser && typeof authUser.user_metadata === "object" && authUser.user_metadata !== null && "role" in authUser.user_metadata
    ? (authUser.user_metadata as { role?: unknown }).role
    : null;
  const roleFromAuth = typeof appMetadataRole === "string"
    ? appMetadataRole
    : typeof userMetadataRole === "string"
      ? userMetadataRole
      : null;

  return roleFromProfile ?? roleFromAuth ?? "student";
}

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
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin
      .from("profiles")
      .select("id, full_name, username, role, xp, avatar_url, badges, class_id, classes(name), created_at")
      .order("created_at", { ascending: false }),
  ]);

  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row]));
  const accounts = (authUsers?.users ?? []).map((authUser) => {
    const row = profileMap.get(authUser.id);
    const classEntry = firstItem(row?.classes);

    return {
      id: authUser.id,
      email: authUser.email ?? null,
      full_name: row?.full_name ?? authUser.user_metadata?.full_name ?? null,
      username: row?.username ?? authUser.user_metadata?.username ?? null,
      role: resolveRole(row?.role, authUser),
      xp: row?.xp ?? 0,
      avatar_url: row?.avatar_url ?? null,
      badges: Array.isArray(row?.badges) ? row?.badges : [],
      class_id: row?.class_id ?? null,
      class_name: classEntry?.name ?? null,
      created_at: row?.created_at ?? authUser.created_at,
    };
  });

  return NextResponse.json({ accounts });
}
