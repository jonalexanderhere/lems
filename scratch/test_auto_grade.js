const testAutoGrade = async () => {
  const payload = {
    assignmentTitle: "Konfigurasi Static Routing Cisco",
    assignmentDescription: "Konfigurasi rute statis pada Router A untuk mencapai Jaringan B melalui hop 10.0.0.2.",
    fileName: "routing_lab.pkt",
    fileType: "application/octet-stream",
    fileSize: 150240,
    note: "Saya sudah mengonfigurasi routing statis menggunakan perintah 'ip route 192.168.2.0 255.255.255.0 10.0.0.2' dan berhasil melakukan ping antar jaringan. Semua konfigurasi sudah disimpan."
  };

  console.log("--- Menjalankan Simulasi Auto Grader ---");
  console.log("Mengirim data ke /api/auto-grade...");

  try {
    const response = await fetch("http://localhost:3000/api/auto-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log("\n--- HASIL PENILAIAN AI ---");
    console.log(`Skor: ${result.score}/100`);
    console.log(`Feedback: ${result.feedback}`);
    console.log("---------------------------\n");
  } catch (error) {
    console.error("Gagal menghubungi API:", error.message);
  }
};

testAutoGrade();
