const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://hbrwwnnekhdaejfjjusw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhicnd3bm5la2hkYWVqZmpqdXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc0Njk2MiwiZXhwIjoyMDkyMzIyOTYyfQ._hswraY6DnPtTd_DyLOptR7ZGT547XMtgXUAyyHzric";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const className = "XI TJKT 3";
const teacher = { name: "Abid Rahmat Satria Putra", email: "abid@netvora.edu" };
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

async function run() {
  console.log("🚀 Memulai proses pendaftaran massal...");

  // 1. Pastikan Kelas Ada
  let { data: classData } = await supabase.from('classes').select('id').eq('name', className).maybeSingle();
  if (!classData) {
    const { data: newClass, error: cErr } = await supabase.from('classes').insert({ name: className }).select().single();
    if (cErr) return console.error("Gagal buat kelas:", cErr);
    classData = newClass;
  }
  const classId = classData.id;
  console.log(`✅ Kelas: ${className} (ID: ${classId})`);

  // 2. Fungsi Daftar User & Profil
  async function registerUser(name, email, role) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Netvora123!',
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(`- ${name} (${role}) sudah terdaftar.`);
        return;
      }
      return console.error(`❌ Gagal daftar ${name}:`, error.message);
    }

    const userId = data.user.id;
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: name,
      role: role,
      class_id: classId
    });

    if (pErr) console.error(`❌ Gagal update profil ${name}:`, pErr.message);
    else console.log(`✅ Berhasil: ${name} (${role})`);
  }

  // 3. Eksekusi Guru
  await registerUser(teacher.name, teacher.email, 'teacher');

  // 4. Eksekusi Siswa
  for (const sName of students) {
    const sEmail = `${sName.toLowerCase().replace(/\s+/g, '.')}@netvora.edu`;
    await registerUser(sName, sEmail, 'student');
  }

  console.log("\n✨ SEMUA DATA BERHASIL DIIMPORT.");
}

run();
