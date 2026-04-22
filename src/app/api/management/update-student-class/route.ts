import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

type UpdateStudentClassBody = {
  student_id?: string;
  class_id?: string;
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["teacher", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as UpdateStudentClassBody;
  if (!body.student_id || !body.class_id) {
    return NextResponse.json({ error: "student_id and class_id are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("profiles")
    .update({ class_id: body.class_id })
    .eq("id", body.student_id)
    .select("id, full_name, username, class_id, classes(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const classEntry = Array.isArray(updated.classes) ? updated.classes[0] ?? null : updated.classes;

  return NextResponse.json({
    ok: true,
    student: {
      id: updated.id,
      full_name: updated.full_name,
      username: updated.username,
      class_id: updated.class_id,
      class_name: classEntry?.name ?? null,
    },
  });
}
