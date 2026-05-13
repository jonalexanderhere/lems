"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, Send, X, Trash2, Sparkles, Command } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string };

function shouldHideOnPath(pathname: string) {
  if (!pathname) return false;
  if (pathname.startsWith("/quiz/")) return true;
  if (pathname.startsWith("/dashboard/teacher/quiz")) return true;
  return false;
}

export function FloatingTutor() {
  const pathname = usePathname() ?? "";
  const hidden = useMemo(() => shouldHideOnPath(pathname), [pathname]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!hidden) return;
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [hidden]);

  const clearChat = () => {
    setMessages([]);
  };

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const history = [...messages, userMessage];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistantChunks: string[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (!delta) continue;
              assistantChunks.push(delta);
              const assistantText = assistantChunks.join("");
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            } catch {
              // ignore malformed / partial JSON
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Maaf, koneksi AI bermasalah. Coba lagi sebentar." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      <style jsx global>{`
        .chat-prose pre {
          background: #1a1a1a !important;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 12px !important;
          margin: 8px 0 !important;
        }
        .chat-prose code {
          color: #ff2d2d;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.85em;
        }
        .chat-prose p {
          margin-bottom: 0.75rem !important;
          line-height: 1.6;
        }
        .chat-prose ul, .chat-prose ol {
          margin-bottom: 0.75rem !important;
          padding-left: 1.25rem !important;
        }
        .chat-prose li {
          margin-bottom: 0.25rem !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>

      {open && (
        <div className="w-[400px] max-w-[calc(100vw-2.5rem)] h-[600px] max-h-[calc(100vh-8rem)] bg-[#080808]/98 backdrop-blur-2xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col rounded-3xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-[#FF2D2D] to-[#B01B1B] rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,45,45,0.2)]">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#080808] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  Netvora AI <Sparkles className="w-3 h-3 text-[#FF2D2D]" />
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-semibold mt-0.5">Intelligence System</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-2.5 text-white/20 hover:text-[#FF2D2D] hover:bg-[#FF2D2D]/5 transition-all rounded-xl"
                  title="Bersihkan Percakapan"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2.5 text-white/20 hover:text-white hover:bg-white/5 transition-all rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent via-[#080808] to-[#080808]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-5">
                <div className="w-20 h-20 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Command className="w-10 h-10 text-white/10" />
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 font-semibold text-base">Halo, saya Netvora AI.</p>
                  <p className="text-xs text-white/30 leading-relaxed">
                    Siap membantu mengerjakan soal networking, Linux, atau tugas sekolahmu dengan penjelasan mendalam.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div
                    className={`max-w-[90%] px-4 py-3.5 text-[13px] leading-relaxed rounded-2xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-[#FF2D2D] text-white rounded-tr-none font-medium shadow-[#FF2D2D]/10"
                        : "bg-white/[0.04] border border-white/10 text-white/90 rounded-tl-none ring-1 ring-white/5"
                    }`}
                  >
                    {msg.content === "" && loading && msg.role === "assistant" ? (
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Thinking</span>
                      </div>
                    ) : (
                      <div className="chat-prose prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-strong:text-[#FF2D2D] prose-a:text-[#FF2D2D] prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-white/5 bg-[#0A0A0A]/50">
            <form
              className="group relative flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-[#FF2D2D]/40 focus-within:bg-white/[0.05] transition-all duration-300"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan atau pertanyaan..."
                rows={1}
                className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/20 outline-none resize-none max-h-32 text-sm leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-11 h-11 bg-[#FF2D2D] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-10 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-[#FF2D2D]/20 shrink-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-[9px] text-center text-white/20 mt-3 uppercase tracking-widest font-medium">Powering by Netvora Intelligence v2.0</p>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-16 h-16 bg-[#FF2D2D] text-white rounded-[2rem] shadow-[0_16px_32px_rgba(255,45,45,0.3)] hover:scale-110 hover:rounded-2xl active:scale-95 transition-all duration-500 flex items-center justify-center group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <Bot className="w-7 h-7 relative z-10" />
        </button>
      )}
    </div>
  );
}
