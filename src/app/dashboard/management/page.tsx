import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ManagementRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role === "admin") {
    redirect("/dashboard/admin");
  }

  if (profile?.role === "teacher") {
    redirect("/dashboard/teacher");
  }

  redirect("/dashboard");
}
