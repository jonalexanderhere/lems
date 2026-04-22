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

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .select("id, modules!inner(id, course_id)")
    .eq("id", body.lesson_id)
    .maybeSingle();

  if (lessonError || !lessonRow) {
    return NextResponse.json({ ok: true, completed: true, xp_awarded: xpAwarded });
  }

  const moduleEntry = Array.isArray(lessonRow.modules) ? lessonRow.modules[0] ?? null : lessonRow.modules;
  const courseId = moduleEntry?.course_id ?? null;

  if (courseId) {
    const { data: moduleRows } = await supabase.from("modules").select("id").eq("course_id", courseId);
    const moduleIds = (moduleRows ?? []).map((row: { id: string }) => row.id).filter(Boolean);

    if (moduleIds.length > 0) {
      const { data: courseLessons } = await supabase.from("lessons").select("id").in("module_id", moduleIds);
      const lessonIds = (courseLessons ?? []).map((row: { id: string }) => row.id).filter(Boolean);

      if (lessonIds.length > 0) {
        const { count: completedCount } = await supabase
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("student_id", user.id)
          .eq("completed", true)
          .in("lesson_id", lessonIds);

        const { data: existingCourseProgress } = await supabase
          .from("course_progress")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

        if ((completedCount ?? 0) >= lessonIds.length && !existingCourseProgress) {
          const { error: courseProgressError } = await supabase
            .from("course_progress")
            .upsert(
              {
                student_id: user.id,
                course_id: courseId,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "student_id,course_id" }
            );

          if (!courseProgressError) {
            const courseResult = await awardXp(supabase, user.id, 100);
            xpAwarded += courseResult.awarded;
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, completed: true, xp_awarded: xpAwarded });
}
