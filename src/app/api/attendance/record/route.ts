import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getLocalDateString } from "@/utils/attendance";

type RecordAttendanceBody = {
  status?: "present" | "late" | "sick" | "permission" | "absent";
  confidence_score?: number | null;
  method?: string;
  date?: string;
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("class_id, full_name, username, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let resolvedClassId = profile.class_id;
  const metadataClassId = typeof user.user_metadata?.class_id === "string" ? user.user_metadata.class_id : null;
  if (!resolvedClassId && metadataClassId) {
    const repairResult = await createAdminClient()
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: profile.full_name ?? user.user_metadata?.full_name ?? null,
          username: profile.username ?? user.user_metadata?.username ?? null,
          class_id: metadataClassId,
          year_enrolled: Number.isFinite(Number(user.user_metadata?.year_enrolled))
            ? Number(user.user_metadata.year_enrolled)
            : null,
        },
        { onConflict: "id" }
      );

    if (!repairResult.error) {
      resolvedClassId = metadataClassId;
    }
  }

  const body = (await req.json()) as RecordAttendanceBody;
  const status = body.status ?? "present";
  const date = body.date ?? getLocalDateString();
  const method = body.method ?? "face_ai";
  const confidenceScore =
    typeof body.confidence_score === "number" ? body.confidence_score : null;

  const admin = createAdminClient();

  const attendanceRecord = {
    student_id: user.id,
    class_id: resolvedClassId,
    date,
    status,
    method,
    confidence_score: confidenceScore,
  };

  const attendanceLog = {
    student_id: user.id,
    class_id: resolvedClassId,
    method,
    status,
    confidence_score: confidenceScore,
  };

  const [recordResult, logResult] = await Promise.all([
    admin
      .from("attendance_records")
      .upsert(attendanceRecord, { onConflict: "student_id, date" })
      .select("id"),
    admin.from("attendance_logs").insert(attendanceLog).select("id"),
  ]);

  if (recordResult.error) {
    return NextResponse.json({ error: recordResult.error.message }, { status: 400 });
  }

  if (logResult.error) {
    return NextResponse.json(
      {
        ok: true,
        warning: `Attendance record saved but log insert failed: ${logResult.error.message}`,
      },
      { status: 207 }
    );
  }

  return NextResponse.json({ ok: true });
}
