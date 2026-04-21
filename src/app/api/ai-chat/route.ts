import { OpenRouter } from "@openrouter/sdk";
import { NextRequest } from "next/server";

export const runtime = "edge";

type LocalChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function createSseResponse(content: string, extra?: Record<string, unknown>) {
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { content } }],
            ...extra,
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
    ? `Saya belum bisa terhubung ke model AI saat ini, jadi ini jawaban sementara: untuk pertanyaan "${latestUserMessage}", coba jelaskan topiknya lebih spesifik supaya saya bisa bantu dengan contoh konfigurasi atau langkah praktis.`
    : "Saya belum bisa terhubung ke model AI saat ini. Coba kirim pertanyaan tentang networking, Cisco, Linux, atau cybersecurity.";

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

Respond in a clear, concise, and practical way. Use code blocks for commands and configs. Keep responses focused and educational. If asked something outside your scope, redirect to your specialization.`,
  };

  const openrouter = new OpenRouter({
    apiKey,
    httpReferer: "https://netvora.academy",
    appTitle: "Netvora Academy AI Tutor",
  });

  try {
    const stream = await openrouter.chat.send({
      chatRequest: {
        model: "openai/gpt-4o-mini",
        messages: [systemPrompt, ...messages] as never,
        stream: true,
        maxTokens: 1024,
      },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }

            if (chunk.usage?.completionTokensDetails?.reasoningTokens != null) {
              controller.enqueue(
                encoder.encode(
                  `event: usage\ndata: ${JSON.stringify({
                    reasoningTokens: chunk.usage.completionTokensDetails.reasoningTokens,
                    promptTokens: chunk.usage.promptTokens,
                    completionTokens: chunk.usage.completionTokens,
                    totalTokens: chunk.usage.totalTokens,
                  })}\n\n`
                )
              );
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.error(new Error("OpenRouter stream failed"));
        }
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
  } catch {
    return createSseResponse(fallbackMessage);
  }
}
