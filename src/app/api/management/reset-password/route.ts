import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
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

  const { email } = (await req.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const origin = new URL(req.url).origin;

  // For teachers/admins: generate a recovery link directly (no email sending).
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const tokenHash = (data as unknown as { hashed_token?: string | null })?.hashed_token ?? null;
  const actionLink = (data as unknown as { action_link?: string | null })?.action_link ?? null;

  // Prefer our in-app callback link (stable), fallback to provider action_link if needed.
  const directLink = tokenHash
    ? `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/reset-password`
    : actionLink;

  if (!directLink) {
    return NextResponse.json({ error: "Failed to generate recovery link" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, link: directLink });
}
