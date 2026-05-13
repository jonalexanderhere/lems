import { NextRequest } from "next/server";
import { getAiStream } from "@/lib/ai/fallbackManager";

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

const SYSTEM_PROMPT = `You are Netvora Intelligence, an expert AI tutor with professional, structured, and aesthetic response style.

Your Expertise:
- Networking (Cisco IOS, Mikrotik, Subnetting, VLAN, OSPF, BGP)
- Linux Server Administration (Debian, Ubuntu, SSH, Web Server, Security)
- Cybersecurity & Programming (Python, JavaScript, Next.js, Security Auditing)
- School work, productivity, and general technical guidance.

Response Rules (MUST FOLLOW):
1. **Language:** Always respond in clear, professional, yet friendly Indonesian (Bahasa Indonesia).
2. **Structure:** Use clear headings (##), bullet points, and numbered lists for steps.
3. **Typography:** Use **bold** for key terms and *italics* for emphasis.
4. **Code Blocks:** Always use appropriate language tags for code/commands (e.g., \`\`\`bash, \`\`\`ios, \`\`\`json).
5. **Conciseness:** Be direct. Avoid unnecessary filler words. Use short, punchy paragraphs.
6. **Interaction:** If a question is broad, provide a summary first, then ask one specific follow-up question to dive deeper.
7. **No Placeholders:** Provide real examples, not "your_text_here".`;



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

  const groqApiKey = process.env.GROQ_API_KEY;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;

  if (!groqApiKey && !openRouterApiKey) {
    return createSseResponse(
      "Konfigurasi server belum lengkap. Hubungi administrator."
    );
  }

  // Helper to stream from standard OpenAI-like readable stream
  const createAiStreamResponse = (readable: ReadableStream) => {
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  };

  // --- MODULAR AI PROVIDER CHAIN ---
  try {
    const aiStream = getAiStream({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of aiStream) {
            if (chunk.content) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content: chunk.content } }] })}\n\n`
                )
              );
            }

            // Log reasoning tokens if available (OpenRouter)
            if (chunk.usage && (chunk.usage as any).reasoningTokens) {
              console.log("[AI Tutor] Reasoning tokens:", (chunk.usage as any).reasoningTokens);
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err: any) {
          console.error("[AI Chat Route] Stream Error:", err.message);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ choices: [{ delta: { content: "\n\n[Koneksi ke AI terputus. Silakan coba lagi.]" } }] })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return createAiStreamResponse(readable);

  } catch (err: any) {
    console.error("[AI Chat Route] Primary Error:", err.message);
    
    // FINAL FALLBACK TO LOCAL
    const lastMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.content?.toLowerCase() ?? "";

    const localAnswer = buildLocalAnswer(lastMsg);
    return createStreamingTextResponse(localAnswer);
  }
}

// =====================================================
// LOCAL KNOWLEDGE BASE — fallback when AI unavailable
// =====================================================
function buildLocalAnswer(query: string): string {
  if (/^(halo|hai|hello|hi|help|tolong|bantu)$/i.test(query.trim())) {
    return `Halo! Saya bisa bantu jelaskan materi jaringan, Linux, Cisco, cybersecurity, tugas sekolah, atau konsep teknis lain.

Coba tulis salah satu format ini:
- "contoh VLAN"
- "jelaskan OSI layer 3"
- "cara setup SSH di Linux"
- "bedanya TCP dan UDP"

Kalau kamu mau, kirim topik yang ingin dipelajari, nanti saya jelaskan langkah demi langkah.`;
  }

  if (/tutorial\s+os/i.test(query) || /bantu\s+tutorial/i.test(query)) {
    return `Kalau yang kamu maksud tutorial OS, kita bisa mulai dari dua arah:

1. OS sebagai operating system
   - Fungsi: mengelola hardware, aplikasi, dan user
   - Contoh: Windows, Linux, macOS

2. Struktur dasar OS
   - Kernel
   - Shell / interface
   - File system
   - Process management

Contoh singkat:
\`\`\`
User -> Application -> Operating System -> Hardware
\`\`\`

Kalau mau, sebutkan OS yang kamu maksud:
- Windows
- Linux
- Android
- macOS

Saya bisa lanjutkan dengan tutorial yang lebih spesifik.`;
  }

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

  if (/tugas|kuis|ujian|belajar|leaderboard|xp|absensi/i.test(query)) {
    return `Saya bisa bantu itu juga. Coba kirim detailnya:

- tujuan yang ingin dicapai
- error atau hasil yang muncul
- langkah yang sudah dicoba

Dengan detail itu, saya bisa kasih jawaban yang lebih tepat dan langsung bisa dipakai.`;
  }

  return `Berikut jawaban singkat yang bisa saya bantu:

${query}

Kalau kamu mau, kirim konteks yang lebih spesifik supaya saya bisa bantu dengan contoh langkah atau solusi yang lebih presisi.`;
}

