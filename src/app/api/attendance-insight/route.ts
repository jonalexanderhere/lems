import { NextResponse } from "next/server";
import { getAiResponse } from "@/lib/ai/fallbackManager";

type AttendanceRecord = {
  studentName: string;
  checkInTime: string;
  checkOutTime?: string;
  location?: string;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as AttendanceRecord;
    const hour = new Date(payload.checkInTime).getHours();
    const isNight = hour >= 21 || hour <= 4;

    const prompt = `Analisis absensi: ${payload.studentName} jam ${payload.checkInTime} (${isNight ? "Jam Malam" : "Jam Normal"}). 
Berikan JSON murni:
{
  "status": "Normal/Warning",
  "insight": "Penjelasan...",
  "recommendation": "Saran..."
}`;

    const content = await getAiResponse({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("[AttendanceInsight] Parse Error. Raw:", content);
      return NextResponse.json({
        status: isNight ? "Warning" : "Normal",
        insight: content,
        recommendation: "Cek kembali jadwal kehadiran."
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
