import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

  if (!response.ok) {
    const error = await response.text();
    return new Response(`Error from OpenRouter: ${error}`, { status: 500 });
  }

  // Return the SSE stream directly to the client
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
