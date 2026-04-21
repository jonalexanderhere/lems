"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginClient({ resetSuccess }: { resetSuccess: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user!.id)
      .single();

    const role = profile?.role ?? "student";
    if (role === "admin") {
      router.push("/dashboard/admin");
    } else if (role === "teacher") {
      router.push("/dashboard/teacher");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D2D]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="block text-center font-black text-3xl tracking-wider text-white mb-12" style={{ fontFamily: "var(--font-grotesk)" }}>
          NETVORA<span className="text-[#FF2D2D]">.</span>
        </Link>

        <div className="bg-white/5 border border-white/10 p-8 md:p-12">
          <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2" style={{ fontFamily: "var(--font-grotesk)" }}>
            Masuk
          </h1>
          <p className="text-white/50 mb-8">Akses dashboard Anda dan lanjutkan pelatihan.</p>

          {resetSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-400/20 text-green-300 text-sm">
              Password berhasil diubah. Silakan masuk lagi.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
              />
            </div>
            <div className="flex items-center justify-end">
              <Link href="/reset-password" className="text-xs uppercase tracking-widest text-white/35 hover:text-[#FF2D2D] transition-colors">
                Lupa password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Masuk Akademi</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Belum punya akun?{" "}
            <Link href="/signup" className="text-[#FF2D2D] hover:text-white transition-colors font-medium">
              Daftar gratis
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
