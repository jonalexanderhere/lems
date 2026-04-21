import { NextResponse } from "next/server";

type GradeRequest = {
  assignmentTitle?: string;
  assignmentDescription?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  note?: string;
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
  };
}

export async function POST(req: Request) {
  const payload = (await req.json()) as GradeRequest;
  const fallback = fallbackGrade(payload);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallback);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://netvora.academy",
        "X-Title": "Netvora Academy Auto Grader",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an automatic assignment grader for a networking and cybersecurity LMS. Return only valid JSON with keys score and feedback. score must be an integer from 0 to 100. feedback must be a short Indonesian paragraph. Do not include markdown or extra keys.",
          },
          {
            role: "user",
            content: JSON.stringify({
              assignmentTitle: payload.assignmentTitle ?? "",
              assignmentDescription: payload.assignmentDescription ?? "",
              fileName: payload.fileName ?? "",
              fileType: payload.fileType ?? "",
              note: payload.note ?? "",
            }),
          },
        ],
        max_tokens: 250,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(content as string) as { score?: unknown; feedback?: unknown };
      const score = Number(parsed.score);
      const feedback = typeof parsed.feedback === "string" ? parsed.feedback : fallback.feedback;
      if (Number.isFinite(score)) {
        return NextResponse.json({
          score: Math.max(0, Math.min(100, Math.round(score))),
          feedback,
        });
      }
    } catch {
      // fall through to fallback
    }
  } catch {
    return NextResponse.json(fallback);
  }

  return NextResponse.json(fallback);
}
