import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white px-6 md:px-12 py-28">
      <div className="container mx-auto max-w-4xl">
        <p className="text-[#FF2D2D] uppercase tracking-[0.35em] text-xs font-bold mb-4">Terms</p>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8" style={{ fontFamily: "var(--font-grotesk)" }}>
          Terms of Use
        </h1>
        <div className="space-y-5 text-white/70 leading-relaxed">
          <p>
            Pengguna wajib menjaga akun masing-masing, memakai layanan dengan etika belajar yang baik, dan tidak menyalahgunakan fitur sertifikasi, leaderboard, atau reset akun.
          </p>
          <p>
            Hak akses guru dan admin hanya dipakai untuk aktivitas operasional pembelajaran. Tindakan sensitif seperti reset password dan pengelolaan kelas harus dilakukan dengan tanggung jawab.
          </p>
          <p>
            Dengan menggunakan platform ini, pengguna setuju bahwa data capaian dan badge dapat ditampilkan sesuai konfigurasi fitur yang aktif.
          </p>
        </div>
        <div className="mt-10">
          <Link href="/" className="inline-flex items-center px-5 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-[#FF2D2D] hover:text-white transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
