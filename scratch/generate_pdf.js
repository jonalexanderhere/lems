const { jsPDF } = require("jsPDF");
const autoTable = require("jspdf-autotable").default;
const fs = require("fs");

const students = [
  ["1", "ANGGI", "anggi@netvora.edu", "Netvora123!"],
  ["2", "AURA NIRMA MAULIDA", "aura.nirma.maulida@netvora.edu", "Netvora123!"],
  ["3", "AVIFAH KLAURIA", "avifah.klauria@netvora.edu", "Netvora123!"],
  ["4", "BUNGA RODATUL JANAH", "bunga.rodatul.janah@netvora.edu", "Netvora123!"],
  ["5", "DELA KEYNORA", "dela.keynora@netvora.edu", "Netvora123!"],
  ["6", "DELTA LIYA PRATAMA", "delta.liya.pratama@netvora.edu", "Netvora123!"],
  ["7", "DEPI ENJELIKA", "depi.enjelika@netvora.edu", "Netvora123!"],
  ["8", "HESTI PUSPITA", "hesti.puspita@netvora.edu", "Netvora123!"],
  ["9", "INDRI SABELA", "indri.sabela@netvora.edu", "Netvora123!"],
  ["10", "KEISHA AZZAHRA SALSABIL", "keisha.azzahra.salsabil@netvora.edu", "Netvora123!"],
  ["11", "KEYLA LOSPITA", "keyla.lospita@netvora.edu", "Netvora123!"],
  ["12", "KEYSA NISA AL ZAHRA", "keysa.nisa.al.zahra@netvora.edu", "Netvora123!"],
  ["13", "KHELSI ELIZA", "khelsi.eliza@netvora.edu", "Netvora123!"],
  ["14", "LEKOK FITRIYANI", "lekok.fitriyani@netvora.edu", "Netvora123!"],
  ["15", "LUCKY EARLY", "lucky.early@netvora.edu", "Netvora123!"],
  ["16", "MELDI ANGGARA", "meldi.anggara@netvora.edu", "Netvora123!"],
  ["17", "MUHAMMAD FAHRI TIZA", "muhammad.fahri.tiza@netvora.edu", "Netvora123!"],
  ["18", "MUHAMMAD NIKI PRADITA", "muhammad.niki.pradita@netvora.edu", "Netvora123!"],
  ["19", "NAELA NUR ANGGRAINI", "naela.nur.anggraini@netvora.edu", "Netvora123!"],
  ["20", "NAILA AYU MAHARANI", "naila.ayu.maharani@netvora.edu", "Netvora123!"],
  ["21", "NAILA RIZKA ROMADONA", "naila.rizka.romadona@netvora.edu", "Netvora123!"],
  ["22", "NAUFAL PRADITAMA", "naufal.praditama@netvora.edu", "Netvora123!"],
  ["23", "PAREL DERI WINATA", "parel.deri.winata@netvora.edu", "Netvora123!"],
  ["24", "RAHMAWATI PUSPITA DEWI", "rahmawati.puspita.dewi@netvora.edu", "Netvora123!"],
  ["25", "RANGGA SETIAWAN PRATAMA", "rangga.setiawan.pratama@netvora.edu", "Netvora123!"],
  ["26", "REMA PADILA", "rema.padila@netvora.edu", "Netvora123!"],
  ["27", "REY RINGGA ADRIAN VACLANASA", "rey.ringga.adrian.vaclanasa@netvora.edu", "Netvora123!"],
  ["28", "RIDHO JULIANTO", "ridhojulianto188@gmail.com", "Netvora123!"],
  ["29", "RIZKY AMALINA", "rizky.amalina@netvora.edu", "Netvora123!"],
  ["30", "SITI NURJANAH", "siti.nurjanah@netvora.edu", "Netvora123!"],
  ["31", "SOPIAH ASKA JUNIANTI", "sopiah.aska.junianti@netvora.edu", "Netvora123!"],
  ["32", "SYIFA QINAYA SALSABILLA", "syifa.qinaya.salsabilla@netvora.edu", "Netvora123!"],
  ["33", "TAZKIYAH NURUSSYIFA", "tazkiyah.nurussyifa@netvora.edu", "Netvora123!"],
  ["34", "YOGI DINATA", "yogi.dinata@netvora.edu", "Netvora123!"],
  ["35", "ZELFI VITRI YANI", "zelfi.vitri.yani@netvora.edu", "Netvora123!"]
];

const doc = new jsPDF();
doc.setFontSize(18);
doc.setTextColor(255, 45, 45);
doc.text("NETVORA ACADEMY", 105, 15, { align: "center" });
doc.setFontSize(14);
doc.setTextColor(0, 0, 0);
doc.text("DAFTAR AKUN LOGIN SISWA", 105, 23, { align: "center" });
doc.setFontSize(12);
doc.text("KELAS: XI TJKT 3", 105, 30, { align: "center" });
doc.setDrawColor(255, 45, 45);
doc.line(20, 35, 190, 35);

autoTable(doc, {
  head: [["No", "Nama Lengkap", "Email Login", "Password Default"]],
  body: students,
  startY: 40,
  headStyles: { fillColor: [255, 45, 45], textColor: [255, 255, 255], fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [245, 245, 245] },
  styles: { fontSize: 9, cellPadding: 3 },
  columnStyles: {
    0: { cellWidth: 10 },
    1: { cellWidth: 60 },
    2: { cellWidth: 80 },
    3: { cellWidth: 35 }
  }
});

const pdfOutput = doc.output();
fs.writeFileSync("Daftar_Login_Siswa_XI_TJKT_3.pdf", pdfOutput, "binary");
console.log("✅ Berhasil memperbarui PDF dengan Email Ridho yang baru.");
