import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardXp } from "@/utils/xp";

type GradeSubmissionBody = {
  submission_id?: string;
  score?: number | null;
  feedback?: string | null;
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

  const body = (await req.json()) as GradeSubmissionBody;
  if (!body.submission_id) {
    return NextResponse.json({ error: "submission_id is required" }, { status: 400 });
  }

  if (body.score != null && (!Number.isFinite(body.score) || body.score < 0 || body.score > 100)) {
    return NextResponse.json({ error: "Score must be between 0 and 100" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: submission, error: fetchError } = await admin
    .from("submissions")
    .select("id, assignment_id, student_id, score, assignments(teacher_id)")
    .eq("id", body.submission_id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const assignment = Array.isArray(submission.assignments)
    ? submission.assignments[0] ?? null
    : submission.assignments ?? null;

  if (profile.role === "teacher" && assignment?.teacher_id && assignment.teacher_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error: updateError } = await admin
    .from("submissions")
    .update({
      score: body.score ?? null,
      feedback: body.feedback ?? null,
      graded_at: new Date().toISOString(),
    })
    .eq("id", body.submission_id)
    .select("id, score, feedback, graded_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const hadScoreBefore = submission.score != null;
  if (!hadScoreBefore && body.score != null && submission.student_id) {
    await awardXp(admin, submission.student_id, 10 + Math.round(body.score / 10));
  }

  return NextResponse.json({ ok: true, submission: updated });
}
