"use client";

import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Send, Bot, User, Loader2, Trash2, Zap } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "Contoh dari VLAN",
  "Jelaskan OSI layer 3",
  "Cara setup SSH di Linux",
  "Bedanya TCP dan UDP",
  "Cara kerja OSPF",
  "Bantu tutorial OS",
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistantChunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantChunks.push(delta);
                const assistantText = assistantChunks.join("");
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantText,
                  };
                  return updated;
                });
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <Navigation />

      <div className="flex-1 flex flex-col pt-20 max-h-screen">
        {/* Header */}
        <div className="border-b border-white/10 px-6 md:px-12 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF2D2D]/20 border border-[#FF2D2D]/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[#FF2D2D]" />
            </div>
            <div>
              <h1 className="font-black uppercase tracking-tight text-lg" style={{ fontFamily: "var(--font-grotesk)" }}>
                Netvora Intelligence
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-white/40 uppercase tracking-widest">Online · GPT-4o mini</span>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="flex items-center gap-2 text-white/30 hover:text-white text-sm transition-colors">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[#FF2D2D]/10 border border-[#FF2D2D]/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-[#FF2D2D]" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-3" style={{ fontFamily: "var(--font-grotesk)" }}>
                Your AI Mentor.
              </h2>
              <p className="text-white/50 text-lg mb-12 max-w-lg">
                Tanya apa saja tentang networking, Cisco, Linux, cybersecurity, atau tugas sekolah.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 text-left text-sm text-white/70 hover:bg-white/10 hover:border-[#FF2D2D]/30 hover:text-white transition-all group"
                  >
                    <Zap className="w-4 h-4 text-[#FF2D2D] shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === "user" ? "bg-white/10 border border-white/20" : "bg-[#FF2D2D]/20 border border-[#FF2D2D]/30"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#FF2D2D]" />}
              </div>
              <div
                className={`px-5 py-4 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-white/10 border border-white/10 text-white"
                    : "bg-[#FF2D2D]/5 border border-[#FF2D2D]/10 text-white/90"
                }`}
              >
                {msg.content === "" && loading ? (
                  <span className="flex items-center gap-2 text-white/40">
                    <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                  </span>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 px-4 md:px-12 py-4 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
              <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contoh: contoh VLAN, jelaskan OSI, atau bantu tutorial OS"
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors resize-none max-h-32 font-sans text-sm"
              style={{ lineHeight: "1.6" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-12 h-12 bg-[#FF2D2D] text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-center text-white/20 text-xs mt-3">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </main>
  );
}
