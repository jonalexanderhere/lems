import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

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

  const body = (await req.json()) as RecordAttendanceBody;
  const status = body.status ?? "present";
  const date = body.date ?? new Date().toISOString().split("T")[0];
  const method = body.method ?? "face_ai";
  const confidenceScore =
    typeof body.confidence_score === "number" ? body.confidence_score : null;

  const admin = createAdminClient();

  const attendanceRecord = {
    student_id: user.id,
    class_id: profile.class_id,
    date,
    status,
  };

  const attendanceLog = {
    student_id: user.id,
    class_id: profile.class_id,
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
