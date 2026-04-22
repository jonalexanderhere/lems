"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { jsPDF } from "jspdf";
import { ArrowRight, BadgeCheck, CheckCircle2, Download, Lock, Trophy } from "lucide-react";

type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "Which Cisco IOS command assigns an IP address to an interface?",
    options: [
      "ip address 192.168.1.1 255.255.255.0",
      "set ip 192.168.1.1/24",
      "assign address 192.168.1.1 24",
      "ip config 192.168.1.1 255.255.255.0",
    ],
    answer: 0,
    explanation: "Pada Cisco IOS, perintah yang benar adalah `ip address` di mode konfigurasi interface.",
  },
  {
    id: "q2",
    prompt: "Which routing protocol is commonly used for internal dynamic routing?",
    options: ["HTTP", "OSPF", "SMTP", "DHCP"],
    answer: 1,
    explanation: "OSPF adalah routing protocol dinamis yang umum dipakai di jaringan internal.",
  },
  {
    id: "q3",
    prompt: "What is the default SSH port?",
    options: ["21", "22", "80", "443"],
    answer: 1,
    explanation: "SSH secara default menggunakan port 22.",
  },
  {
    id: "q4",
    prompt: "Which subnet mask corresponds to /24?",
    options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"],
    answer: 2,
    explanation: "Prefix /24 sama dengan subnet mask 255.255.255.0.",
  },
  {
    id: "q5",
    prompt: "What is the primary purpose of an ACL on a router or switch?",
    options: [
      "Automatically change the IP address",
      "Control traffic access based on rules",
      "Increase internet bandwidth",
      "Create a new VLAN",
    ],
    answer: 1,
    explanation: "ACL digunakan untuk memfilter atau mengizinkan trafik berdasarkan aturan.",
  },
  {
    id: "q6",
    prompt: "TCP belongs to which OSI layer?",
    options: ["Network", "Session", "Transport", "Application"],
    answer: 2,
    explanation: "TCP bekerja pada layer Transport.",
  },
  {
    id: "q7",
    prompt: "Which device forwards frames using MAC addresses?",
    options: ["Router", "Switch", "Firewall", "Modem"],
    answer: 1,
    explanation: "Switch bekerja di Layer 2 dan meneruskan frame berdasarkan MAC address.",
  },
  {
    id: "q8",
    prompt: "Which protocol resolves hostnames into IP addresses?",
    options: ["DNS", "NAT", "SSH", "ICMP"],
    answer: 0,
    explanation: "DNS mengubah nama domain menjadi alamat IP.",
  },
  {
    id: "q9",
    prompt: "Which protocol automatically assigns IP addresses?",
    options: ["DNS", "NAT", "DHCP", "ARP"],
    answer: 2,
    explanation: "DHCP memberikan alamat IP secara otomatis kepada client.",
  },
  {
    id: "q10",
    prompt: "Which Linux command shows interface addresses?",
    options: ["ps aux", "ip addr", "grep", "chmod"],
    answer: 1,
    explanation: "Perintah `ip addr` menampilkan informasi alamat antarmuka.",
  },
  {
    id: "q11",
    prompt: "What does NAT do?",
    options: [
      "Encrypts all packets",
      "Translates private addresses to public addresses",
      "Creates VLANs automatically",
      "Blocks all inbound traffic",
    ],
    answer: 1,
    explanation: "NAT menerjemahkan alamat private ke public address saat melewati gateway.",
  },
  {
    id: "q12",
    prompt: "Which protocol is commonly used between autonomous systems?",
    options: ["RIP", "BGP", "EIGRP", "STP"],
    answer: 1,
    explanation: "BGP dipakai untuk routing antar autonomous system.",
  },
  {
    id: "q13",
    prompt: "Which technology secures HTTP traffic in transit?",
    options: ["FTP", "TLS", "ICMP", "Telnet"],
    answer: 1,
    explanation: "TLS melindungi komunikasi HTTP sehingga menjadi HTTPS.",
  },
  {
    id: "q14",
    prompt: "Which attack manipulates database queries through untrusted input?",
    options: ["Phishing", "SQL injection", "DDoS", "Spoofing"],
    answer: 1,
    explanation: "SQL injection memanipulasi query melalui input yang tidak tervalidasi.",
  },
  {
    id: "q15",
    prompt: "What security principle limits permissions to only what is required?",
    options: ["Defense in depth", "Least privilege", "Zero trust", "Fail open"],
    answer: 1,
    explanation: "Least privilege berarti hanya memberi hak akses minimum yang dibutuhkan.",
  },
  {
    id: "q16",
    prompt: "Which tool is commonly used for packet capture on Linux?",
    options: ["tcpdump", "nano", "top", "mkdir"],
    answer: 0,
    explanation: "`tcpdump` dipakai untuk menangkap dan menganalisis paket jaringan.",
  },
  {
    id: "q17",
    prompt: "Which command restarts the nginx service on systemd?",
    options: ["service nginx reset", "systemctl restart nginx", "nginx --restart", "restart nginx"],
    answer: 1,
    explanation: "Pada systemd, layanan di-restart dengan `systemctl restart nginx`.",
  },
  {
    id: "q18",
    prompt: "Which file maps local hostnames to IP addresses on Linux?",
    options: ["/etc/hosts", "/etc/passwd", "/var/log/syslog", "/root/hosts"],
    answer: 0,
    explanation: "`/etc/hosts` menyimpan pemetaan host lokal.",
  },
  {
    id: "q19",
    prompt: "Which command prints the current working directory?",
    options: ["whoami", "pwd", "cd", "ls"],
    answer: 1,
    explanation: "`pwd` menampilkan direktori kerja saat ini.",
  },
  {
    id: "q20",
    prompt: "What does permission mode 640 mean?",
    options: ["rwxr-x---", "rw-r-----", "r--r-----", "rwx------"],
    answer: 1,
    explanation: "640 berarti owner `rw`, group `r`, others tidak punya izin.",
  },
  {
    id: "q21",
    prompt: "What is the length of an IPv6 address?",
    options: ["32 bits", "64 bits", "96 bits", "128 bits"],
    answer: 3,
    explanation: "IPv6 menggunakan alamat sepanjang 128 bit.",
  },
  {
    id: "q22",
    prompt: "How many usable host addresses are available in a /30 network?",
    options: ["1", "2", "4", "6"],
    answer: 1,
    explanation: "/30 memberikan 2 host usable.",
  },
  {
    id: "q23",
    prompt: "Which Layer 2 protocol helps prevent switching loops?",
    options: ["STP", "SNMP", "NTP", "RDP"],
    answer: 0,
    explanation: "STP mencegah loop pada jaringan Layer 2.",
  },
  {
    id: "q24",
    prompt: "Which protocol is connection-oriented and reliable?",
    options: ["UDP", "TCP", "ICMP", "ARP"],
    answer: 1,
    explanation: "TCP memberikan koneksi yang andal dan berorientasi koneksi.",
  },
  {
    id: "q25",
    prompt: "Which protocol is connectionless and often used for low-latency traffic?",
    options: ["TCP", "SMTP", "UDP", "TLS"],
    answer: 2,
    explanation: "UDP bersifat connectionless dan cocok untuk trafik yang butuh latensi rendah.",
  },
  {
    id: "q26",
    prompt: "Which DNS record maps a hostname to an IPv4 address?",
    options: ["A", "MX", "CNAME", "AAAA"],
    answer: 0,
    explanation: "A record digunakan untuk IPv4.",
  },
  {
    id: "q27",
    prompt: "Which DNS record maps a hostname to an IPv6 address?",
    options: ["A", "TXT", "MX", "AAAA"],
    answer: 3,
    explanation: "AAAA record digunakan untuk IPv6.",
  },
  {
    id: "q28",
    prompt: "What is ARP used for?",
    options: [
      "Convert MAC to hostname",
      "Map IP addresses to MAC addresses on a local network",
      "Assign IP addresses automatically",
      "Encrypt traffic between routers",
    ],
    answer: 1,
    explanation: "ARP membantu mencari MAC address dari IP address pada jaringan lokal.",
  },
  {
    id: "q29",
    prompt: "What is the default port for HTTPS?",
    options: ["80", "21", "53", "443"],
    answer: 3,
    explanation: "HTTPS secara default menggunakan port 443.",
  },
  {
    id: "q30",
    prompt: "What is the default port for HTTP?",
    options: ["80", "110", "123", "445"],
    answer: 0,
    explanation: "HTTP menggunakan port 80 secara default.",
  },
  {
    id: "q31",
    prompt: "What do we call the process of splitting one network into smaller networks?",
    options: ["Tunneling", "Subnetting", "Encapsulation", "Broadcasting"],
    answer: 1,
    explanation: "Subnetting membagi jaringan menjadi beberapa subnet yang lebih kecil.",
  },
  {
    id: "q32",
    prompt: "What is the main purpose of a default gateway?",
    options: [
      "Store user passwords",
      "Act as a DNS server",
      "Forward traffic to other networks",
      "Block all broadcast traffic",
    ],
    answer: 2,
    explanation: "Default gateway dipakai untuk mengirim trafik ke jaringan lain.",
  },
  {
    id: "q33",
    prompt: "Which protocol is commonly used for email retrieval?",
    options: ["SMTP", "IMAP", "SNMP", "NTP"],
    answer: 1,
    explanation: "IMAP dipakai untuk mengambil email dari server.",
  },
  {
    id: "q34",
    prompt: "Which protocol synchronizes time across systems?",
    options: ["FTP", "DNS", "ARP", "NTP"],
    answer: 3,
    explanation: "NTP menyamakan waktu antar sistem.",
  },
  {
    id: "q35",
    prompt: "Which Linux command searches text inside files?",
    options: ["grep", "mv", "tar", "df"],
    answer: 0,
    explanation: "`grep` digunakan untuk mencari string pada file.",
  },
  {
    id: "q36",
    prompt: "Which command changes file permissions in Linux?",
    options: ["chmod", "chown", "touch", "locate"],
    answer: 0,
    explanation: "`chmod` mengubah permission file.",
  },
  {
    id: "q37",
    prompt: "What does RAID 1 provide?",
    options: ["Striping without redundancy", "Mirroring and redundancy", "Parity with 2 disks", "Compression"],
    answer: 1,
    explanation: "RAID 1 melakukan mirroring untuk redundansi.",
  },
  {
    id: "q38",
    prompt: "What is the minimum number of disks required for RAID 5?",
    options: ["2", "3", "4", "5"],
    answer: 1,
    explanation: "RAID 5 membutuhkan minimal 3 disk.",
  },
  {
    id: "q39",
    prompt: "What does the 3-2-1 backup rule recommend?",
    options: [
      "3 copies, 2 media types, 1 offsite copy",
      "3 servers, 2 routers, 1 firewall",
      "3 passwords, 2 tokens, 1 key",
      "3 VLANs, 2 subnets, 1 gateway",
    ],
    answer: 0,
    explanation: "Prinsip 3-2-1: tiga salinan, dua media, satu cadangan di luar lokasi.",
  },
  {
    id: "q40",
    prompt: "What does MFA add to authentication?",
    options: ["Only a username", "Multiple factors", "A faster login", "A stronger monitor"],
    answer: 1,
    explanation: "MFA menambahkan lebih dari satu faktor autentikasi.",
  },
  {
    id: "q41",
    prompt: "What is the main purpose of a SIEM?",
    options: [
      "Generate Wi-Fi signals",
      "Store photos in the cloud",
      "Compress files automatically",
      "Collect and correlate security logs",
    ],
    answer: 3,
    explanation: "SIEM mengumpulkan dan mengkorelasi log keamanan.",
  },
  {
    id: "q42",
    prompt: "What is phishing?",
    options: [
      "A social engineering attack to steal credentials",
      "A method to speed up DNS",
      "A backup strategy",
      "A routing protocol",
    ],
    answer: 0,
    explanation: "Phishing adalah serangan sosial untuk mencuri kredensial.",
  },
  {
    id: "q43",
    prompt: "Which protocol provides secure remote shell access?",
    options: ["Telnet", "FTP", "SSH", "SNMP"],
    answer: 2,
    explanation: "SSH dipakai untuk remote shell yang aman.",
  },
  {
    id: "q44",
    prompt: "What is the purpose of a VLAN?",
    options: [
      "Increase CPU performance",
      "Separate broadcast domains logically",
      "Encrypt DNS queries",
      "Replace routing entirely",
    ],
    answer: 1,
    explanation: "VLAN membagi broadcast domain secara logis.",
  },
  {
    id: "q45",
    prompt: "What is PAT?",
    options: [
      "A malware scanner",
      "A backup protocol",
      "A switch feature for VLANs",
      "Port Address Translation allowing many private hosts to share one public IP",
    ],
    answer: 3,
    explanation: "PAT memungkinkan banyak host private berbagi satu alamat public melalui port.",
  },
  {
    id: "q46",
    prompt: "Which routing protocol uses the SPF/Dijkstra algorithm?",
    options: ["RIP", "BGP", "OSPF", "HTTP"],
    answer: 2,
    explanation: "OSPF menggunakan algoritma SPF/Dijkstra.",
  },
  {
    id: "q47",
    prompt: "What is a Certificate Authority (CA) used for?",
    options: [
      "Issue and sign digital certificates",
      "Assign IP addresses",
      "Filter packets",
      "Manage VLAN trunks",
    ],
    answer: 0,
    explanation: "CA mengeluarkan dan menandatangani sertifikat digital.",
  },
  {
    id: "q48",
    prompt: "What is the primary purpose of a firewall?",
    options: [
      "Control traffic based on policy",
      "Store backups",
      "Replace DNS",
      "Convert IPv4 to IPv6",
    ],
    answer: 0,
    explanation: "Firewall mengontrol lalu lintas berdasarkan kebijakan keamanan.",
  },
  {
    id: "q49",
    prompt: "Which Linux command lists running processes?",
    options: ["ls", "ps aux", "cat", "echo"],
    answer: 1,
    explanation: "`ps aux` menampilkan proses yang berjalan.",
  },
  {
    id: "q50",
    prompt: "What does containerization provide for applications?",
    options: [
      "A separate kernel for every app",
      "Automatic internet speed increase",
      "Isolation while sharing the host kernel",
      "A replacement for all virtualization",
    ],
    answer: 2,
    explanation: "Container memberi isolasi aplikasi namun tetap berbagi kernel host.",
  },
];

const PASS_SCORE = 80;

export function CertificationQuiz() {
  const supabase = useMemo(() => createClient(), []);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [badgeSaved, setBadgeSaved] = useState(false);

  const score = useMemo(() => {
    return QUESTIONS.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 2 : total;
    }, 0);
  }, [answers]);

  const answeredCount = useMemo(() => Object.values(answers).filter((value) => value !== null && value !== undefined).length, [answers]);
  const passed = submitted && score >= PASS_SCORE;
  const issueDate = useMemo(() => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()), []);

  useEffect(() => {
    const persistBadge = async () => {
      if (!passed || badgeSaved) return;
      setBadgeSaved(true);
    };

    persistBadge();
  }, [badgeSaved, passed, supabase]);

  const downloadCertificate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .single();

    const displayName = profile?.full_name?.trim() || profile?.username?.trim() || "Netvora Learner";
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, width, height, "F");
    doc.setDrawColor(255, 45, 45);
    doc.setLineWidth(3);
    doc.rect(24, 24, width - 48, height - 48);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.rect(40, 40, width - 80, height - 80);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("NETVORA ACADEMY", width / 2, 92, { align: "center" });

    doc.setTextColor(255, 45, 45);
    doc.setFontSize(38);
    doc.text("CERTIFICATE", width / 2, 156, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "normal");
    doc.text("This certifies that", width / 2, 202, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(displayName, width / 2, 245, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("has successfully passed the foundational certification exam", width / 2, 285, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Certified Network Engineer", width / 2, 330, { align: "center" });

    doc.setFillColor(255, 45, 45);
    doc.roundedRect(width / 2 - 148, 356, 296, 34, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`Score ${score}/100 | Badge Earned`, width / 2, 378, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`Badge ID: cert:NV-NET-001`, 70, height - 100);
    doc.text(`Verification ID: NV-NET-001`, 70, height - 80);
    doc.text(`Issued: ${issueDate}`, width - 70, height - 100, { align: "right" });
    doc.text("Verified by Netvora Academy Certification Board", width - 70, height - 80, { align: "right" });

    doc.setDrawColor(255, 45, 45);
    doc.setLineWidth(2);
    doc.line(70, height - 64, 180, height - 64);
    doc.line(width - 180, height - 64, width - 70, height - 64);

    doc.save(`Netvora-Certificate-${displayName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
              Ujian Sertifikasi 50 Soal
            </h2>
            <p className="text-white/40 text-sm mt-1">Standar internasional, pass mark 80/100, akses hanya untuk pengguna login.</p>
          </div>
        </div>

        <div className="space-y-6">
          {QUESTIONS.map((question, index) => (
            <div key={question.id} className="p-5 md:p-6 bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Question {index + 1}</p>
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 leading-snug">{question.prompt}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[question.id] === optionIndex;
                  const isCorrect = submitted && optionIndex === question.answer;
                  const isWrong = submitted && selected && optionIndex !== question.answer;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className={`text-left p-4 border transition-colors ${
                        isCorrect
                          ? "bg-green-500/10 border-green-500/30 text-green-300"
                          : isWrong
                            ? "bg-[#FF2D2D]/10 border-[#FF2D2D]/30 text-[#FF2D2D]"
                            : selected
                              ? "bg-white/10 border-white/30 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {submitted && <p className="mt-3 text-sm text-white/50">{question.explanation}</p>}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/40 mb-1">Skor Ujian</p>
            <p className="text-3xl font-black text-white">{score}/100</p>
            <p className="text-xs text-white/30 mt-1">{answeredCount}/50 soal terjawab</p>
          </div>

          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Nilai Ujian
          </button>
        </div>

        {submitted && (
          <div className={`mt-6 p-6 border ${passed ? "bg-green-500/10 border-green-500/30" : "bg-[#FF2D2D]/10 border-[#FF2D2D]/30"}`}>
            <div className="flex items-center gap-3 mb-2">
              {passed ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Trophy className="w-5 h-5 text-[#FF2D2D]" />}
              <p className="font-bold uppercase tracking-widest text-sm">{passed ? "Sertifikat terbuka" : "Belum lulus"}</p>
            </div>
            <p className="text-sm text-white/70">
              {passed
                ? "Kamu sudah melewati ambang kelulusan. Sertifikat dan status kelulusan bisa dipakai sebagai bukti capaian."
                : "Kamu perlu minimal 80 poin untuk membuka sertifikat. Coba lagi setelah meninjau jawaban."}
            </p>
            {passed && (
              <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 text-xs font-bold uppercase tracking-widest">
                  <BadgeCheck className="w-4 h-4" />
                  Badge unlocked
                </div>
                <button
                  type="button"
                  onClick={downloadCertificate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-bold uppercase tracking-widest hover:bg-[#FF2D2D] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
