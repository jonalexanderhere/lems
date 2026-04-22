import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { awardXp } from "@/utils/xp";

type CompleteLessonBody = {
  lesson_id?: string;
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CompleteLessonBody;
  if (!body.lesson_id) {
    return NextResponse.json({ error: "lesson_id is required" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("lesson_progress")
    .select("completed")
    .eq("student_id", user.id)
    .eq("lesson_id", body.lesson_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  const wasCompleted = existing?.completed ?? false;
  const { error: upsertError } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        student_id: user.id,
        lesson_id: body.lesson_id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  let xpAwarded = 0;
  if (!wasCompleted) {
    const result = await awardXp(supabase, user.id, 10);
    xpAwarded = result.awarded;
  }

  return NextResponse.json({ ok: true, completed: true, xp_awarded: xpAwarded });
}
