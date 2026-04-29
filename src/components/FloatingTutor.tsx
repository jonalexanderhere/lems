"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Loader2, Send, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

function shouldHideOnPath(pathname: string) {
  // Hide on any quiz-related route to avoid "tanya jawab" during exams.
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
    // If user navigates into a hidden area, close the widget.
    if (!hidden) return;
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [hidden]);

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
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-7rem)] bg-[#0A0A0A] border border-white/10 shadow-2xl flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 bg-[#FF2D2D]/15 border border-[#FF2D2D]/25 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#FF2D2D]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-tight text-white leading-none">AI Tutor</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mt-1">24/7 helper</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Tutup"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-sm text-white/45 leading-relaxed">
                Tanyakan apa saja tentang networking, Cisco, Linux, cybersecurity, atau tugas sekolah.
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-white/10 border-white/10 text-white"
                        : "bg-[#FF2D2D]/5 border-[#FF2D2D]/15 text-white/90"
                    }`}
                  >
                    {msg.content === "" && loading && msg.role === "assistant" ? (
                      <span className="inline-flex items-center gap-2 text-white/45">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                      </span>
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form
            className="p-3 border-t border-white/10 flex gap-2 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya sesuatu..."
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-white/20 outline-none focus:border-[#FF2D2D]/50 transition-colors resize-none max-h-28 text-sm"
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
              className="w-10 h-10 bg-[#FF2D2D] text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Kirim"
              title="Kirim"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-12 h-12 bg-[#FF2D2D] text-white border border-[#FF2D2D]/50 shadow-2xl hover:bg-white hover:text-black transition-colors flex items-center justify-center"
          aria-label="Buka AI Tutor"
          title="Buka AI Tutor"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
