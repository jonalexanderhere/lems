"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

type ClassOption = { id: string; name: string; grade: string };

const GRADES = ["X", "XI", "XII"];
const SECTIONS = ["TJKT 1", "TJKT 2", "TJKT 3"];

export default function SignupPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("classes")
        .select("id, name, grade, section")
        .neq("grade", "Alumni")
        .order("grade")
        .order("section");
      if (data) setClasses(data);
    };
    fetchClasses();
  }, []);

  const selectedClass = classes.find(
    (c) => c.grade === selectedGrade && c.name.includes(selectedSection)
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) { setError("Please select your class."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, username: form.username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Update profile with class_id and year_enrolled
    if (data.user) {
      await supabase.from("profiles").update({
        class_id: selectedClass.id,
        year_enrolled: new Date().getFullYear(),
      }).eq("id", data.user.id);
    }

    router.push("/dashboard");
    router.refresh();
  };

  const perks = [
    "Access to all free courses",
    "AI Tutor assistance",
    "XP & Leaderboard system",
    "Course completion certificates",
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2D2D]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <Link href="/" className="font-black text-3xl tracking-wider text-white" style={{ fontFamily: "var(--font-grotesk)" }}>
            NETVORA<span className="text-[#FF2D2D]">.</span>
          </Link>
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight text-white mt-8 mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
            Mulai Secara<br /><span className="text-[#FF2D2D]">Gratis.</span>
          </h1>
          <p className="text-white/50 text-lg mb-10">Tanpa kartu kredit. Bangun keahlian nyata dari hari pertama.</p>
          <ul className="space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/70">
                <CheckCircle2 className="w-5 h-5 text-[#FF2D2D] shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 md:p-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6" style={{ fontFamily: "var(--font-grotesk)" }}>Daftar Akun</h2>

          {error && (
            <div className="mb-5 p-4 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 text-[#FF2D2D] text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Nama Lengkap</label>
              <input type="text" placeholder="Nama Anda" required
                value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Username</label>
              <input type="text" placeholder="net_hacker_xyz" required
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors font-mono" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Email</label>
              <input type="email" placeholder="kamu@contoh.com" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Password</label>
              <input type="password" placeholder="••••••••" required minLength={6}
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors" />
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Tingkat / Kelas</label>
              <div className="grid grid-cols-3 gap-2">
                {GRADES.map((g) => (
                  <button key={g} type="button" onClick={() => setSelectedGrade(g)}
                    className={`py-2.5 text-sm font-bold uppercase tracking-wider border transition-colors ${
                      selectedGrade === g ? "bg-[#FF2D2D] border-[#FF2D2D] text-white" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Jurusan (TJKT)</label>
              <div className="grid grid-cols-3 gap-2">
                {SECTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setSelectedSection(s)}
                    className={`py-2.5 text-sm font-bold uppercase tracking-wider border transition-colors ${
                      selectedSection === s ? "bg-[#FF2D2D] border-[#FF2D2D] text-white" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              {selectedGrade && selectedSection && (
                <p className="mt-2 text-[#FF2D2D] text-xs font-mono">
                  ✓ {selectedGrade} {selectedSection}
                  {selectedClass ? "" : " — tidak ditemukan, periksa pilihan Anda"}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-60 mt-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Gabung Sekarang</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#FF2D2D] hover:text-white transition-colors font-medium">Masuk</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
