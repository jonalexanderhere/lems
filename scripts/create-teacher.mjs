import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.env.TEACHER_EMAIL || "guru@netvora.academy";
const password = process.env.TEACHER_PASSWORD || "GuruNetvora123!";
const fullName = process.env.TEACHER_FULL_NAME || "Guru Netvora";
const username = process.env.TEACHER_USERNAME || "guru.netvora";

if (!url || !serviceRole) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;

try {
  const { data: createResult } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username,
    },
  });
  userId = createResult?.user?.id ?? null;
} catch (error) {
  if (!String(error?.message ?? error).toLowerCase().includes("already")) {
    throw error;
  }
}

if (!userId) {
  const { data: existing, error: existingError } = await supabase.auth.admin.listUsers();
  if (existingError) throw existingError;
  const found = existing.users.find((user) => user.email === email);
  if (!found) throw new Error("Teacher user could not be found or created.");
  userId = found.id;
  const { error: updateAuthError } = await supabase.auth.admin.updateUserById(found.id, {
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username,
    },
  });
  if (updateAuthError) throw updateAuthError;
}

if (!userId) {
  throw new Error("Teacher user ID not found.");
}

const { error: profileError } = await supabase.from("profiles").upsert({
  id: userId,
  role: "teacher",
  full_name: fullName,
  username,
});

if (profileError) {
  throw profileError;
}

console.log(JSON.stringify({
  email,
  password,
  fullName,
  username,
  userId,
}, null, 2));
