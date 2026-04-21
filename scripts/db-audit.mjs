import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  return fs.readFile(path, "utf8").then((content) => {
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  });
}

const DEMO_USERNAMES = ["budi_tjkt", "ani_tjkt", "dedi_tjkt", "guru.netvora"];
const DEMO_EMAILS = ["guru@netvora.academy"];
const DEMO_NAME_PATTERNS = [/demo/i, /dummy/i, /sample/i, /test/i];
const TABLES = [
  "academic_years",
  "activity_logs",
  "assignments",
  "attendance_logs",
  "attendance_records",
  "attendance_sessions",
  "classes",
  "courses",
  "lesson_progress",
  "lessons",
  "modules",
  "profiles",
  "quiz_attempts",
  "quiz_questions",
  "quizzes",
  "submissions",
];

function matchesDemoValue(value) {
  if (!value) return false;
  return DEMO_NAME_PATTERNS.some((pattern) => pattern.test(value));
}

function isMissingTableError(error) {
  const code = error?.code ?? "";
  const message = String(error?.message ?? "");
  return code === "PGRST205" || message.includes("Could not find the table");
}

async function tableExists(supabase, table) {
  const { error } = await supabase.from(table).select("id", { head: true, count: "exact" });
  if (!error) return true;
  if (isMissingTableError(error)) return false;
  throw error;
}

async function tableCount(supabase, table) {
  const exists = await tableExists(supabase, table);
  if (!exists) return null;
  const { count, error } = await supabase.from(table).select("id", { head: true, count: "exact" });
  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
  return count ?? 0;
}

async function deleteByColumn(supabase, table, column, ids) {
  if (!ids.length) return 0;
  const exists = await tableExists(supabase, table);
  if (!exists) return 0;
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).in(column, ids);
  if (error) {
    if (isMissingTableError(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function main() {
  await loadEnvFile(new URL("../.env.local", import.meta.url));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Table counts:");
  const counts = {};
  for (const table of TABLES) {
    counts[table] = await tableCount(supabase, table);
  }
  console.log(JSON.stringify(counts, null, 2));

  const [usersResult, profilesResult] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from("profiles").select("id, full_name, username, role"),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const authCandidates = usersResult.data.users.filter((user) => {
    const email = user.email?.toLowerCase() ?? "";
    const username = String(user.user_metadata?.username ?? "").toLowerCase();
    const fullName = String(user.user_metadata?.full_name ?? "").toLowerCase();
    return (
      DEMO_EMAILS.includes(email) ||
      DEMO_USERNAMES.includes(username) ||
      matchesDemoValue(fullName) ||
      matchesDemoValue(email) ||
      matchesDemoValue(username)
    );
  });

  const profileCandidates = (profilesResult.data ?? []).filter((profile) => {
    const fullName = profile.full_name ?? "";
    const username = profile.username ?? "";
    return DEMO_USERNAMES.includes(username) || matchesDemoValue(fullName) || matchesDemoValue(username);
  });

  const profileIds = new Set(profileCandidates.map((profile) => profile.id));
  for (const user of authCandidates) {
    profileIds.add(user.id);
  }

  const candidateIds = [...profileIds];
  const authIds = authCandidates.map((user) => user.id);

  console.log("Demo auth users:");
  console.log(JSON.stringify(authCandidates.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username ?? null,
    full_name: user.user_metadata?.full_name ?? null,
  })), null, 2));

  console.log("Demo profiles:");
  console.log(JSON.stringify(profileCandidates, null, 2));

  const deleted = {
    attendance_sessions: await deleteByColumn(supabase, "attendance_sessions", "teacher_id", candidateIds),
    courses: await deleteByColumn(supabase, "courses", "teacher_id", candidateIds),
    assignments: await deleteByColumn(supabase, "assignments", "teacher_id", candidateIds),
    quizzes: await deleteByColumn(supabase, "quizzes", "teacher_id", candidateIds),
    lesson_progress: await deleteByColumn(supabase, "lesson_progress", "student_id", candidateIds),
    submissions: await deleteByColumn(supabase, "submissions", "student_id", candidateIds),
    quiz_attempts: await deleteByColumn(supabase, "quiz_attempts", "student_id", candidateIds),
    attendance_records: await deleteByColumn(supabase, "attendance_records", "student_id", candidateIds),
    attendance_logs: await deleteByColumn(supabase, "attendance_logs", "student_id", candidateIds),
    activity_logs: await deleteByColumn(supabase, "activity_logs", "user_id", candidateIds),
    profiles: await deleteByColumn(supabase, "profiles", "id", candidateIds),
  };

  for (const userId of authIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw error;
    }
  }

  console.log("Deleted counts:");
  console.log(JSON.stringify(deleted, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
