import { OpenRouter } from "@openrouter/sdk";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    httpReferer: "https://netvora.academy",
    appTitle: "Netvora Academy AI Tutor",
  });

  const systemPrompt = {
    role: "system",
    content: `You are Netvora Intelligence, an expert AI tutor specialized in:
- Networking (OSI Model, TCP/IP, routing protocols like OSPF, EIGRP, BGP)
- Cisco IOS configuration (routers, switches, VLANs, ACLs, NAT)
- Linux Server Administration (bash, systemctl, nginx, ssh, firewalls)
- Cybersecurity (penetration testing, firewalls, IDS/IPS, VPN)
- Network troubleshooting and debugging

Respond in a clear, concise, and practical way. Use code blocks for commands and configs. Keep responses focused and educational. If asked something outside your scope, redirect to your specialization.`,
  };

  const stream = await openrouter.chat.send({
    chatRequest: {
      model: "openai/gpt-4o-mini",
      messages: [systemPrompt, ...messages],
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
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
