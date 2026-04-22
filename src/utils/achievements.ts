import type { SupabaseClient } from "@supabase/supabase-js";

export type AchievementStats = {
  lessonsCompleted: number;
  coursesCompleted: number;
  quizAttempts: number;
  quizzesPassed: number;
  assignmentsSubmitted: number;
  assignmentsGraded: number;
  attendanceRecords: number;
};

export async function getAchievementStats(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
): Promise<AchievementStats> {
  const [
    lessonsCompleted,
    coursesCompleted,
    quizAttempts,
    quizzesPassed,
    assignmentsSubmitted,
    assignmentsGraded,
    attendanceRecords,
  ] = await Promise.all([
    supabase.from("lesson_progress").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("completed", true),
    supabase.from("course_progress").select("id", { count: "exact", head: true }).eq("student_id", userId),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("student_id", userId).not("submitted_at", "is", null),
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("student_id", userId).gte("score", 80),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("student_id", userId).not("submitted_at", "is", null),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("student_id", userId).not("score", "is", null),
    supabase.from("attendance_records").select("id", { count: "exact", head: true }).eq("student_id", userId),
  ]);

  return {
    lessonsCompleted: lessonsCompleted.count ?? 0,
    coursesCompleted: coursesCompleted.count ?? 0,
    quizAttempts: quizAttempts.count ?? 0,
    quizzesPassed: quizzesPassed.count ?? 0,
    assignmentsSubmitted: assignmentsSubmitted.count ?? 0,
    assignmentsGraded: assignmentsGraded.count ?? 0,
    attendanceRecords: attendanceRecords.count ?? 0,
  };
}

export function formatAchievementBadgeLabel(prefix: string, threshold: number) {
  return `${prefix} ${threshold.toString().padStart(3, "0")}`;
}
