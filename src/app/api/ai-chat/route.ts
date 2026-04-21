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

/** Simulasikan streaming karakter-per-karakter dari teks statis */
function createStreamingTextResponse(text: string) {
  const encoder = new TextEncoder();
  const words = text.split(" ");
  const readable = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? "" : " ") + words[i];
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { content: token } }],
            })}\n\n`
          )
        );
        // small delay for streaming feel
        await new Promise((r) => setTimeout(r, 18));
      }
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

const SYSTEM_PROMPT = `You are Netvora Intelligence, an expert AI tutor specialized in:
- Networking (OSI Model, TCP/IP, routing protocols like OSPF, EIGRP, BGP)
- Cisco IOS configuration (routers, switches, VLANs, ACLs, NAT, STP)
- Linux Server Administration (bash, systemctl, nginx, ssh, iptables)
- Cybersecurity (penetration testing, firewalls, IDS/IPS, VPN)
- Network troubleshooting and packet analysis

Respond in a clear, concise, practical way. Use code blocks (\`\`\`) for configs and commands.
Always respond in the same language as the user (Indonesian or English).
If asked something outside your scope, redirect to your specialization.`;

// Priority list: free models first, paid as fallback
const MODEL_LIST = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-4b-it:free",
  "openai/gpt-4o-mini",
];

async function tryOpenRouter(
  apiKey: string,
  model: string,
  messages: LocalChatMessage[]
): Promise<Response | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://netvora.academy",
        "X-Title": "Netvora Academy",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!res.ok || !res.body) return null;
    return res;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // --- Parse messages ---
  let messages: LocalChatMessage[] = [];
  try {
    const body = await req.json();
    const raw = Array.isArray(body?.messages) ? body.messages : [];
    messages = raw.filter(
      (m: { role?: unknown; content?: unknown }): m is LocalChatMessage =>
        (m.role === "user" || m.role === "assistant" || m.role === "system") &&
        typeof m.content === "string"
    );
  } catch {
    return createSseResponse("Kirim pertanyaan yang valid supaya saya bisa membantu.");
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return createSseResponse(
      "Konfigurasi server belum lengkap. Hubungi administrator."
    );
  }

  // --- Try each model in order ---
  let successResponse: Response | null = null;
  for (const model of MODEL_LIST) {
    successResponse = await tryOpenRouter(apiKey, model, messages);
    if (successResponse) break;
  }

  // --- If all models fail, use smart local fallback ---
  if (!successResponse) {
    const lastMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content?.toLowerCase() ?? "";

    let localAnswer = buildLocalAnswer(lastMsg);
    return createStreamingTextResponse(localAnswer);
  }

  // --- Stream response back to client ---
  const { readable, writable } = new TransformStream();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const writer = writable.getWriter();
  const reader = successResponse.body!.getReader();

  (async () => {
    try {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content !== undefined) {
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
                  )
                );
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch {
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({ choices: [{ delta: { content: "\n\n[Koneksi terputus]" } }] })}\n\n`
        )
      );
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// =====================================================
// LOCAL KNOWLEDGE BASE — fallback when AI unavailable
// =====================================================
function buildLocalAnswer(query: string): string {
  if (/vlan|virtual lan/i.test(query)) {
    return `Berikut cara setup VLAN pada Cisco Switch:

\`\`\`
Switch> enable
Switch# configure terminal

! Buat VLAN
Switch(config)# vlan 10
Switch(config-vlan)# name MARKETING
Switch(config-vlan)# exit

! Assign port ke VLAN (Access mode)
Switch(config)# interface FastEthernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10
Switch(config-if)# exit

! Trunk port (untuk inter-VLAN routing)
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk allowed vlan 10,20,30
Switch(config-if)# exit

Switch(config)# end
Switch# show vlan brief
\`\`\`

VLAN memisahkan traffic jaringan secara logis meski dalam switch fisik yang sama.`;
  }

  if (/ospf/i.test(query)) {
    return `Konfigurasi OSPF pada Cisco Router:

\`\`\`
Router(config)# router ospf 1
Router(config-router)# router-id 1.1.1.1
Router(config-router)# network 192.168.1.0 0.0.0.255 area 0
Router(config-router)# network 10.0.0.0 0.0.0.3 area 0
Router(config-router)# passive-interface GigabitEthernet0/1

! Verifikasi
Router# show ip ospf neighbor
Router# show ip ospf database
Router# show ip route ospf
\`\`\`

OSPF adalah protokol routing Link-State yang menggunakan algoritma Dijkstra (SPF) untuk menghitung jalur terpendek.`;
  }

  if (/ssh|secure shell/i.test(query)) {
    return `Cara setup SSH pada Linux Server:

\`\`\`bash
# Install OpenSSH
sudo apt update && sudo apt install openssh-server -y

# Enable & start service
sudo systemctl enable ssh
sudo systemctl start ssh

# Edit konfigurasi SSH
sudo nano /etc/ssh/sshd_config
# Ubah: Port 2222 (opsional, ubah dari 22)
# Ubah: PermitRootLogin no
# Ubah: PasswordAuthentication no (setelah setup key)

# Restart SSH
sudo systemctl restart sshd

# Generate SSH key di client
ssh-keygen -t ed25519 -C "youremail@example.com"
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server-ip
\`\`\``;
  }

  if (/osi|layer/i.test(query)) {
    return `Model OSI terdiri dari 7 layer:

Layer 7 - Application   → HTTP, FTP, DNS, SMTP
Layer 6 - Presentation  → SSL/TLS, Encryption, Compression
Layer 5 - Session       → NetBIOS, RPC
Layer 4 - Transport     → TCP (reliable), UDP (fast)
Layer 3 - Network       → IP, OSPF, BGP, Routing
Layer 2 - Data Link     → Ethernet, MAC, VLAN, STP
Layer 1 - Physical      → Kabel, WiFi, sinyal

Trik hafal: "All People Seem To Need Data Processing" (dari bawah ke atas).`;
  }

  if (/tcp.*udp|udp.*tcp|perbedaan tcp/i.test(query)) {
    return `Perbedaan TCP vs UDP:

TCP (Transmission Control Protocol):
- Connection-oriented (3-way handshake)
- Reliable: ada acknowledgment & retransmission
- Flow control & congestion control
- Lebih lambat
- Digunakan: HTTP, HTTPS, FTP, SSH, SMTP

UDP (User Datagram Protocol):
- Connectionless
- Unreliable: tidak ada acknowledgment
- Tidak ada flow control
- Sangat cepat, latency rendah
- Digunakan: DNS, DHCP, VoIP, Video streaming, Gaming`;
  }

  if (/static.?route|route statis/i.test(query)) {
    return `Konfigurasi Static Route pada Cisco IOS:

\`\`\`
! Syntax: ip route [network] [mask] [next-hop IP / exit interface]

Router(config)# ip route 192.168.2.0 255.255.255.0 10.0.0.2
Router(config)# ip route 0.0.0.0 0.0.0.0 10.0.0.1  ! Default route

! Verifikasi
Router# show ip route
Router# show ip route static
Router# ping 192.168.2.1 source GigabitEthernet0/0
\`\`\`

Static route cocok untuk jaringan kecil atau rute spesifik yang jarang berubah.`;
  }

  // Generic fallback
  return `Saya adalah Netvora Intelligence, AI Tutor untuk materi jaringan komputer.

Saya dapat membantu kamu dengan:
• **Cisco IOS** — VLAN, Routing, ACL, NAT, STP, OSPF, EIGRP, BGP
• **Linux Server** — SSH, Nginx, Firewall, Bash scripting
• **Networking** — OSI Model, TCP/IP, Subnetting, Troubleshooting
• **Cybersecurity** — Firewall, VPN, IDS/IPS, Penetration Testing

Coba tanyakan sesuatu yang lebih spesifik, misalnya:
- "Bagaimana cara konfigurasi VLAN di Cisco Switch?"
- "Jelaskan cara kerja OSPF"
- "Cara setup SSH key di Linux"`;
}
