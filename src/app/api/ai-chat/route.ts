import { NextRequest } from "next/server";

export const runtime = "edge";

type LocalChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function createSseResponse(content: string) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { content } }],
          })}\n\n`
        )
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: NextRequest) {
  let messages: LocalChatMessage[] = [];

  try {
    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    messages = rawMessages
      .filter(
        (message: { role?: unknown; content?: unknown }): message is LocalChatMessage =>
          (message.role === "user" || message.role === "assistant" || message.role === "system") &&
          typeof message.content === "string"
      )
      .map((message: LocalChatMessage) => ({
        role: message.role,
        content: message.content,
      }));
  } catch {
    return createSseResponse("Kirim pertanyaan yang valid supaya saya bisa membantu.");
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message?.role === "user" && typeof message?.content === "string")
    ?.content?.trim();

  const fallbackMessage = latestUserMessage
    ? `Maaf, saya tidak dapat terhubung ke server AI saat ini. Coba lagi dalam beberapa saat.`
    : "Maaf, terjadi kesalahan. Coba kirim pertanyaan tentang networking, Cisco, Linux, atau cybersecurity.";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return createSseResponse(fallbackMessage);
  }

  const systemPrompt: LocalChatMessage = {
    role: "system",
    content: `You are Netvora Intelligence, an expert AI tutor specialized in:
- Networking (OSI Model, TCP/IP, routing protocols like OSPF, EIGRP, BGP)
- Cisco IOS configuration (routers, switches, VLANs, ACLs, NAT)
- Linux Server Administration (bash, systemctl, nginx, ssh, firewalls)
- Cybersecurity (penetration testing, firewalls, IDS/IPS, VPN)
- Network troubleshooting and debugging

Respond in a clear, concise, and practical way. Use code blocks for commands and configs. Keep responses focused and educational. Always respond in the same language as the user's question (Indonesian or English). If asked something outside your scope, redirect to your specialization.`,
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://netvora.academy",
        "X-Title": "Netvora Academy AI Tutor",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [systemPrompt, ...messages],
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => "unknown error");
      console.error("OpenRouter error:", response.status, errText);
      return createSseResponse(fallbackMessage);
    }

    // Pass the stream directly through
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return createSseResponse(fallbackMessage);
  }
}
