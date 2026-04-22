# Netvora Academy

Netvora Academy adalah platform belajar berbasis Next.js dan Supabase untuk sekolah atau komunitas IT yang ingin mengelola pembelajaran, tugas, kuis, absensi, sertifikasi, leaderboard XP, dan AI Tutor dalam satu tempat.

Fokus aplikasi ini adalah:
- membantu siswa belajar secara terarah,
- memberi guru alat untuk memantau progres,
- memberi pengalaman belajar yang terasa modern dan kompetitif,
- dan menghubungkan capaian nyata dengan XP, rank, dan lencana otomatis.

## Fitur Utama

### 1. Dashboard Siswa
- Menampilkan sapaan personal, rank XP, target rank berikutnya, dan progress menuju tier selanjutnya.
- Menampilkan tugas yang belum dikerjakan.
- Menampilkan kuis yang belum dikerjakan.
- Menampilkan kelas yang sedang diikuti.
- Menampilkan lencana otomatis yang terbuka dari capaian belajar.
- Menampilkan ringkasan lencana aktif dari hasil belajar nyata.

### 2. Dashboard Guru
- Mengelola tugas, kuis, kelas, dan hasil penilaian.
- Melihat rekap absensi berdasarkan tanggal dan sesi.
- Menilai submission siswa termasuk link Drive atau file yang dikirim.
- Melihat progres belajar siswa dan hasil kuis.

### 3. Dashboard Admin
- Mengelola akun pengguna.
- Mengubah role akun.
- Melihat daftar siswa, XP, kelas, dan data akun lainnya.
- Melakukan promosi kelas per tahun ajaran.

### 4. Landing Page Progress
- Menampilkan semua rank XP yang bisa dicapai.
- Menampilkan katalog badge dan keluarga lencana yang tersedia.
- Menggunakan image badge terpisah agar tampilan lebih mudah dipahami.

### 5. AI Tutor
- Tutor percakapan untuk networking, Cisco, Linux, cybersecurity, dan topik umum.
- Menjawab dengan bahasa yang sama seperti user.
- Memberi jawaban praktis, step-by-step, dan contoh konfigurasi.
- Punya fallback lokal untuk topik populer seperti VLAN, OSPF, SSH, dan OS.

### 6. Leaderboard XP
- Menampilkan peringkat siswa berdasarkan XP.
- Menampilkan rank, emblem, target tier berikutnya, dan badge ringkas.
- Home page juga menampilkan leaderboard singkat top 5.

### 7. Absensi
- Absensi wajah.
- Rekap absensi per tanggal dan sesi.
- Sinkron dengan waktu lokal Asia/Jakarta.

### 8. Tugas dan Kuis
- Submission tugas dengan file atau link.
- Auto grading untuk tugas tertentu.
- Kuis publik / kelas tertentu.
- Hasil kuis tersimpan untuk progres siswa.

### 9. Sertifikasi
- Quiz sertifikasi untuk mengukur pemahaman dasar.
- Sertifikat bisa diunduh dalam bentuk PDF.

### 10. Lencana Otomatis
- Badge muncul otomatis berdasarkan capaian nyata.
- Sistem badge sekarang mendukung sampai 1000 milestone otomatis.
- Badge bisa terbuka dari:
  - lesson yang selesai,
  - course yang selesai,
  - quiz yang dikerjakan,
  - quiz yang lulus,
  - submission tugas,
  - submission yang sudah dinilai,
  - absensi yang tercatat,
  - XP milestone.

## Cara Kerja Lencana

Sistem badge dibangun agar tidak bergantung pada input manual saja.

Badge otomatis dihitung dari statistik user:
- `lesson_progress`
- `course_progress`
- `quiz_attempts`
- `submissions`
- `attendance_records`
- `xp`

Contoh:
- menyelesaikan lesson akan membuka badge milestone lesson,
- mengerjakan kuis membuka badge quiz,
- mengirim tugas membuka badge assignment,
- absensi yang tercatat membuka badge attendance,
- XP tertentu membuka badge XP milestone.

Ada juga badge khusus seperti:
- `Pioneer`
- badge sertifikasi
- badge rank tertentu

### 11. Kenaikan Kelas Massal
- Guru bisa memilih satu kelas dan menaikkan seluruh murid sekaligus.
- Dropdown kelas sekarang memakai route server khusus agar data lebih konsisten.
- Ada preview kelas tujuan sebelum aksi dijalankan.

## AI Tutor

AI Tutor didesain untuk membantu siswa belajar tanpa terasa kaku.

### Perilaku yang diharapkan
- Kalau pertanyaan masih terlalu umum, AI memberi jawaban awal yang berguna lalu meminta detail lanjutan.
- Kalau user memberi contoh seperti VLAN, OSPF, SSH, atau OS, AI langsung masuk ke jawaban teknis.
- Kalau pertanyaannya singkat seperti `halo`, AI menjawab ramah dan memberi contoh format pertanyaan.

### Contoh topik yang didukung
- VLAN
- OSPF
- SSH
- OSI model
- TCP vs UDP
- subnetting
- routing dasar
- tugas sekolah umum

## Teknologi

- Next.js 16
- React 19
- Supabase
- OpenRouter untuk AI Tutor
- Tailwind CSS
- Lucide Icons
- GSAP untuk animasi
- jsPDF untuk sertifikat

## Struktur Halaman

- `/` - Beranda
- `/leaderboard` - Papan skor
- `/ai-tutor` - Tutor AI
- `/dashboard` - Dashboard siswa
- `/dashboard/teacher` - Dashboard guru
- `/dashboard/admin` - Dashboard admin
- `/dashboard/attendance` - Absensi
- `/dashboard/certification` - Sertifikasi
- `/courses` - Daftar course
- `/course/[id]` - Detail course
- `/quiz/[id]` - Detail kuis
- `/quiz/[id]/take` - Mengerjakan kuis
- `/assignments/[id]` - Detail tugas
- `/profile/[id]` - Profil publik siswa

## API Penting

- `/api/ai-chat` - AI Tutor streaming
- `/api/auto-grade` - Penilaian otomatis tugas
- `/api/lesson-progress/complete` - Tandai lesson selesai
- `/api/management/accounts` - Data akun admin/guru
- `/api/management/users` - Data siswa
- `/api/management/grade-submission` - Nilai submission
- `/api/management/promote-class` - Naikkan seluruh murid dari satu kelas ke kelas berikutnya
- `/api/attendance/record` - Simpan absensi
- `/api/achievements/me` - Statistik dan badge otomatis user login
- `/api/classes` - Daftar kelas aman untuk dashboard guru/admin

## Environment Variables

Gunakan variabel berikut di `.env.local` atau di hosting:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

Fallback juga didukung untuk nama variabel:
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka:

```bash
http://localhost:3000
```

## Build Production

```bash
npm run build
npm run start
```

## Database

Folder `supabase/` berisi SQL untuk:
- schema utama,
- attendance refactor,
- course progress,
- RLS policy,
- cleanup helper,
- update database bertahap.

Jika kamu ingin deploy database dari nol atau sinkronisasi schema, mulai dari file SQL yang paling sesuai dengan kondisi database kamu.

## Catatan Pengembangan

- Leaderboard dan halaman utama dibuat dinamis supaya data XP terbaru langsung terbaca.
- Sistem env Supabase mendukung fallback nama variabel agar lebih aman di deployment.
- Lencana otomatis tidak lagi bergantung pada kolom `badges` di `profiles`.
- Landing page sekarang menampilkan roadmap rank dan badge library secara visual.
- Dashboard guru punya tombol kenaikan kelas massal agar tidak perlu pindah murid satu per satu.
- AI Tutor punya fallback lokal supaya tetap berguna saat provider AI sedang bermasalah.

## Kontribusi

Kalau mau menambah fitur baru:
- tambahkan endpoint di `src/app/api/` bila perlu data server-side,
- simpan helper bersama di `src/utils/`,
- pertahankan gaya UI yang konsisten dengan halaman yang sudah ada.

## Lisensi

Proyek ini dipakai untuk kebutuhan pengembangan internal Netvora Academy.
