"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, CheckCircle2, Loader2, Shield, Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"request" | "set">("request");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setMode(data.session ? "set" : "request");
      setLoading(false);
    };

    init();
  }, [supabase]);

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingEmail(true);
    setError("");
    setMessage("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setSendingEmail(false);
      return;
    }

    setMessage("Link reset password sudah dikirim. Cek inbox email Anda.");
    setSendingEmail(false);
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUpdatingPassword(true);
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      setUpdatingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setUpdatingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setUpdatingPassword(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("Password berhasil diubah. Silakan masuk lagi.");
    setUpdatingPassword(false);
    router.push("/login?reset=success");
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,45,45,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_35%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-xl">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Kembali ke beranda
        </Link>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 md:p-10">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-[#FF2D2D]/15 border border-[#FF2D2D]/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#FF2D2D]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ fontFamily: "var(--font-grotesk)" }}>
                Reset Password
              </h1>
              <p className="text-white/45 mt-2">
                Jika Anda sudah menerima link recovery, set password baru di sini. Kalau belum, minta link reset dulu.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center text-white/50">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <>
              {message && (
                <div className="mb-5 p-4 bg-green-500/10 border border-green-400/20 text-green-300 text-sm flex gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="mb-5 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">
                  {error}
                </div>
              )}

              {mode === "set" ? (
                <form className="space-y-4" onSubmit={updatePassword}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-xs uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Session recovery aktif
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Password baru</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
                      placeholder="Password baru"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Konfirmasi password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
                      placeholder="Ulangi password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-60"
                  >
                    {updatingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Simpan Password Baru</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={requestReset}>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-xs uppercase tracking-widest">
                    <Mail className="w-4 h-4 text-[#FF2D2D]" />
                    Minta link reset
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email akun</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-60"
                  >
                    {sendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Kirim Link Reset</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm text-white/45">
                <span>Ingat password Anda?</span>
                <Link href="/login" className="text-[#FF2D2D] hover:text-white transition-colors">
                  Masuk
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
