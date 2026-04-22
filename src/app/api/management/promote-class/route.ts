import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { resolvePromotableTarget, type ClassRow } from "@/utils/class-promotion";

type PromoteClassBody = {
  source_class_id?: string;
  target_class_id?: string;
};

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

  const body = (await req.json()) as PromoteClassBody;
  if (!body.source_class_id) {
    return NextResponse.json({ error: "source_class_id is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: classList, error: classError } = await admin
    .from("classes")
    .select("id, name, grade, section")
    .order("grade", { ascending: true })
    .order("section", { ascending: true });

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 400 });
  }

  const classes = (classList ?? []) as ClassRow[];
  const sourceClass = classes.find((item) => item.id === body.source_class_id) ?? null;
  if (!sourceClass) {
    return NextResponse.json({ error: "Kelas sumber tidak ditemukan." }, { status: 404 });
  }

  const resolvedTargetId = body.target_class_id?.trim()
    ? body.target_class_id.trim()
    : resolvePromotableTarget(sourceClass.id, classes).targetClassId;
  const targetClass = classes.find((item) => item.id === resolvedTargetId) ?? null;

  if (!targetClass || targetClass.id === sourceClass.id) {
    return NextResponse.json({ error: "Kelas tujuan belum tersedia." }, { status: 400 });
  }

  const { data: movedStudents, error: updateError } = await admin
    .from("profiles")
    .update({ class_id: targetClass.id })
    .eq("class_id", sourceClass.id)
    .eq("role", "student")
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    moved_count: movedStudents?.length ?? 0,
    source_class: sourceClass,
    target_class: targetClass,
  });
}
