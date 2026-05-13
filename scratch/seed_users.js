const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Menggunakan service role agar bisa bypass RLS
);

const teacherName = "Abid Rahmat Satria Putra";
const className = "XI TJKT 3";
const students = [
  "ANGGI", "AURA NIRMA MAULIDA", "AVIFAH KLAURIA", "BUNGA RODATUL JANAH",
  "DELA KEYNORA", "DELTA LIYA PRATAMA", "DEPI ENJELIKA", "HESTI PUSPITA",
  "INDRI SABELA", "KEISHA AZZAHRA SALSABIL", "KEYLA LOSPITA", "KEYSA NISA AL ZAHRA",
  "KHELSI ELIZA", "LEKOK FITRIYANI", "LUCKY EARLY", "MELDI ANGGARA",
  "MUHAMMAD FAHRI TIZA", "MUHAMMAD NIKI PRADITA", "NAELA NUR ANGGRAINI",
  "NAILA AYU MAHARANI", "NAILA RIZKA ROMADONA", "NAUFAL PRADITAMA",
  "PAREL DERI WINATA", "RAHMAWATI PUSPITA DEWI", "RANGGA SETIAWAN PRATAMA",
  "REMA PADILA", "REY RINGGA ADRIAN VACLANASA", "RIZKY AMALINA",
  "SITI NURJANAH", "SOPIAH ASKA JUNIANTI", "SYIFA QINAYA SALSABILLA",
  "TAZKIYAH NURUSSYIFA", "YOGI DINATA", "ZELFI VITRI YANI"
];

async function seedData() {
  console.log("--- Memulai Import Data Guru & Siswa ---");

  // 1. Buat Kelas
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .upsert({ name: className })
    .select()
    .single();

  if (classError) {
    console.error("Gagal membuat kelas:", classError.message);
    return;
  }
  const classId = classData.id;
  console.log(`✅ Kelas ${className} siap (ID: ${classId})`);

  // 2. Buat Profil Guru (Placeholder ID)
  // Catatan: Di Supabase, ID profil harus sinkron dengan Auth ID. 
  // Kita akan buat entri di profiles, guru bisa login nanti.
  console.log(`⏳ Mendaftarkan Guru: ${teacherName}`);
  
  // 3. Masukkan Siswa
  console.log(`⏳ Memasukkan ${students.length} siswa...`);
  for (const name of students) {
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@netvora.edu`;
    // Kita asumsikan sistem menggunakan profile-first atau nanti disinkronkan.
    // Untuk saat ini kita siapkan data profilnya.
    const { error: studentError } = await supabase
      .from('profiles')
      .insert({
        full_name: name,
        role: 'student',
        class_id: classId,
        // ID akan digenerate jika kolomnya bukan UUID yang wajib dari auth.users
      });
    
    if (studentError) {
      // Jika ID wajib UUID, kita mungkin butuh pendekatan lain.
      // Mari kita cek dulu skema tabelnya.
    }
  }

  console.log("--- Import Selesai ---");
}

// Untuk keamanan, saya akan cek skema tabel profiles dulu sebelum eksekusi insert.
