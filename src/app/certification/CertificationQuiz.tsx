"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Lock, Trophy, ArrowRight } from "lucide-react";

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
    prompt: "Perintah Cisco untuk memberi alamat IP pada interface adalah?",
    options: [
      "ip address 192.168.1.1 255.255.255.0",
      "set ip 192.168.1.1/24",
      "assign address 192.168.1.1 24",
      "ip config 192.168.1.1 255.255.255.0",
    ],
    answer: 0,
    explanation: "Di Cisco IOS, perintah yang benar adalah `ip address` di mode konfigurasi interface.",
  },
  {
    id: "q2",
    prompt: "Protokol yang biasa dipakai untuk routing dinamis di jaringan internal adalah?",
    options: ["HTTP", "OSPF", "SMTP", "DHCP"],
    answer: 1,
    explanation: "OSPF adalah protokol routing dinamis yang umum dipakai di jaringan internal.",
  },
  {
    id: "q3",
    prompt: "Port default SSH adalah?",
    options: ["21", "22", "80", "443"],
    answer: 1,
    explanation: "SSH memakai port 22 secara default.",
  },
  {
    id: "q4",
    prompt: "Subnet mask untuk jaringan /24 adalah?",
    options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"],
    answer: 2,
    explanation: "Prefix /24 sama dengan subnet mask 255.255.255.0.",
  },
  {
    id: "q5",
    prompt: "Fungsi utama ACL pada router atau switch adalah?",
    options: [
      "Mengganti IP address otomatis",
      "Mengatur akses trafik berdasarkan rule",
      "Menambah bandwidth internet",
      "Membuat VLAN baru",
    ],
    answer: 1,
    explanation: "ACL digunakan untuk memfilter atau mengizinkan trafik berdasarkan aturan.",
  },
];

export function CertificationQuiz() {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    return QUESTIONS.reduce((total, question) => {
      return answers[question.id] === question.answer ? total + 20 : total;
    }, 0);
  }, [answers]);

  const passed = submitted && score >= 80;

  return (
    <section className="py-16 px-6 md:px-12 border-t border-white/5">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Lock className="w-5 h-5 text-accent" />
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
            Ujian Sertifikasi Langsung
          </h2>
        </div>

        <div className="space-y-6">
          {QUESTIONS.map((question, index) => (
            <div key={question.id} className="p-5 md:p-6 bg-white/5 border border-white/10">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Soal {index + 1}
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 leading-snug">
                {question.prompt}
              </h3>
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
              {submitted && (
                <p className="mt-3 text-sm text-white/50">
                  {question.explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10">
          <div>
            <p className="text-sm uppercase tracking-widest text-white/40 mb-1">Skor Ujian</p>
            <p className="text-3xl font-black text-white">{score}/100</p>
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
                ? "Kamu sudah melewati ambang kelulusan. Sertifikat di bawah ini kini aktif."
                : "Kamu perlu minimal 80 poin untuk membuka sertifikat. Coba lagi setelah meninjau jawaban."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
