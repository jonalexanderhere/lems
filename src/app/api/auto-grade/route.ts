import { NextResponse } from "next/server";
import { getAiResponse } from "@/lib/ai/fallbackManager";

type GradeRequest = {
  assignmentTitle?: string;
  assignmentDescription?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  note?: string;
  submittedAt?: string; // ISO timestamp
};

function fallbackGrade(payload: GradeRequest) {
  const noteWords = (payload.note ?? "").trim().split(/\s+/).filter(Boolean).length;
  const fileBonus = payload.fileType ? 12 : 0;
  const sizeBonus = payload.fileSize ? Math.min(18, Math.round(payload.fileSize / 250000)) : 0;
  const completeness = Math.min(40, noteWords * 2);
  const score = Math.max(35, Math.min(100, 40 + completeness + fileBonus + sizeBonus));

  return {
    score,
    feedback:
      "Penilaian otomatis berdasarkan kelengkapan file, catatan, dan metadata tugas. Tambahkan ringkasan kerja yang lebih jelas untuk skor lebih tinggi.",
    behaviorAnalysis: "Data pengerjaan tidak lengkap untuk analisis perilaku.",
  };
}

export async function POST(req: Request) {
  const payload = (await req.json()) as GradeRequest;
  const fallback = fallbackGrade(payload);

  try {
    const prompt = `Anda adalah asisten penilaian tugas otomatis untuk LMS Networking & Cybersecurity.
Tugas: ${payload.assignmentTitle}
Deskripsi Tugas: ${payload.assignmentDescription}
Nama File: ${payload.fileName}
Catatan Siswa: ${payload.note}
Waktu Pengumpulan: ${payload.submittedAt || "Tidak diketahui"}

Berikan penilaian objektif dalam format JSON murni tanpa teks lain atau markdown blocks:
{
  "score": (angka 0-100),
  "feedback": "Penjelasan singkat dalam Bahasa Indonesia mengapa nilai tersebut diberikan dan saran perbaikan.",
  "behaviorAnalysis": "Analisis singkat perilaku siswa berdasarkan waktu pengumpulan (misal: pengerjaan larut malam, pengerjaan cepat, atau dedikasi tinggi) dan hubungannya dengan kualitas tugas."
}`;

    const content = await getAiResponse({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as { 
        score?: unknown; 
        feedback?: unknown;
        behaviorAnalysis?: string;
      };
      
      const score = Number(parsed.score);
      const feedback = typeof parsed.feedback === "string" ? parsed.feedback : fallback.feedback;
      const behaviorAnalysis = parsed.behaviorAnalysis || fallback.behaviorAnalysis;
      
      if (Number.isFinite(score)) {
        return NextResponse.json({
          score: Math.max(0, Math.min(100, Math.round(score))),
          feedback,
          behaviorAnalysis
        });
      }
    } catch (e) {
      console.error("Failed to parse AI grading response:", content);
    }
  } catch (err: any) {
    console.error("Auto Grade Error:", err.message);
  }

  return NextResponse.json(fallback);
}
