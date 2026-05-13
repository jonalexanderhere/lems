import { NextResponse } from "next/server";
import { getAiResponse } from "@/lib/ai/fallbackManager";

type ExamResult = {
  studentName: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  wrongAnswers: {
    question: string;
    studentAnswer: string;
    correctAnswer: string;
    category: string;
  }[];
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as ExamResult;

    const prompt = `Anda adalah asisten diagnostik akademik. Analisis hasil ujian:
Siswa: ${payload.studentName}
Ujian: ${payload.examTitle}
Kesalahan:
${payload.wrongAnswers.map((w, i) => `${i+1}. [${w.category}] ${w.question} | Siswa: ${w.studentAnswer}`).join("\n")}

Berikan JSON murni tanpa teks lain:
{
  "weaknesses": ["Topik 1", "Topik 2"],
  "diagnosticSummary": "Ringkasan...",
  "learningPath": ["Step 1", "Step 2"],
  "motivation": "Motivasi"
}`;

    const content = await getAiResponse({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Lower temperature for more consistent JSON
    });

    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("[ExamAnalysis] Parse Error. Raw Content:", content);
      return NextResponse.json({ 
        weaknesses: ["Umum"], 
        diagnosticSummary: content, 
        learningPath: ["Tinjau kembali materi yang salah."],
        motivation: "Tetap semangat!"
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
