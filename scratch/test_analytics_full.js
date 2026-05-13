const BASE_URL = "http://localhost:3000";

const runTests = async () => {
  console.log("🚀 MEMULAI PENGUJIAN ANALITIK AI NETVORA ACADEMY...\n");

  // 1. Test Auto Grade + Behavior Analysis (Late Night Task)
  console.log("--- [1] Testing Auto Grade & Behavior Analysis ---");
  try {
    const res = await fetch(`${BASE_URL}/api/auto-grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentTitle: "Konfigurasi VLAN & Inter-VLAN Routing",
        assignmentDescription: "Buat VLAN 10 dan 20, hubungkan melalui Router.",
        fileName: "vlan_lab_v2.pkt",
        note: "Saya mengerjakan ini setelah pulang kerja, mohon maaf baru bisa kirim sekarang.",
        submittedAt: "2026-05-13T02:30:00Z" 
      })
    });
    const data = await res.json();
    console.log("✅ Skor:", data.score);
    console.log("✅ Analisis Perilaku:", data.behaviorAnalysis);
  } catch (e) { console.error("❌ Test 1 Gagal:", e.message); }

  console.log("\n--- [2] Testing Exam Diagnostic Analysis ---");
  try {
    const res = await fetch(`${BASE_URL}/api/exam-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Budi",
        examTitle: "Ulangan Harian: Jaringan Dasar",
        score: 2,
        totalQuestions: 5,
        wrongAnswers: [
          {
            question: "Apa fungsi dari IP Address?",
            studentAnswer: "Untuk menyimpan data",
            correctAnswer: "Sebagai alamat identitas perangkat dalam jaringan",
            category: "IP Networking"
          },
          {
            question: "Hitung jumlah host pada subnet /24",
            studentAnswer: "512",
            correctAnswer: "254",
            category: "Subnetting"
          }
        ]
      })
    });
    const data = await res.json();
    console.log("✅ Kelemahan:", data.weaknesses ? data.weaknesses.join(", ") : "Tidak tersedia");
    console.log("✅ Diagnosa:", data.diagnosticSummary || "Tidak tersedia");
    console.log("✅ Jalur Belajar:", data.learningPath ? data.learningPath[0] : "Tidak tersedia");
  } catch (e) { console.error("❌ Test 2 Gagal:", e.message); }

  console.log("\n--- [3] Testing Attendance Insight (Night Shift) ---");
  try {
    const res = await fetch(`${BASE_URL}/api/attendance-insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: "Budi",
        checkInTime: "2026-05-13T23:45:00Z", 
      })
    });
    const data = await res.json();
    console.log("✅ Status:", data.status);
    console.log("✅ Insight Kehadiran:", data.insight);
  } catch (e) { console.error("❌ Test 3 Gagal:", e.message); }

  console.log("\n✨ PENGUJIAN SELESAI.");
};

runTests();
