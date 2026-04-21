"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Maximize2, Minimize2 } from "lucide-react";

interface HistoryItem {
  type: "command" | "output" | "error";
  content: string;
}

export function TerminalLab() {
  const [history, setHistory] = useState<HistoryItem[]>([
    { type: "output", content: "Netvora Academy TJKT Laboratorium v1.0.0" },
    { type: "output", content: "Ketik 'help' untuk melihat daftar perintah." },
  ]);
  const [input, setInput] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const commands: Record<string, (args: string[]) => string> = {
    help: () => `Daftar Perintah:
  - help: Menampilkan bantuan ini
  - clear: Bersihkan layar
  - whoami: Lihat user saat ini
  - ip addr: Lihat konfigurasi IP (Simulasi)
  - conf t: Masuk ke mode konfigurasi (Simulasi Cisco)
  - ls: Lihat file di direktori saat ini
  - ping [host]: Tes koneksi`,
    clear: () => {
      setHistory([]);
      return "";
    },
    whoami: () => "student@netvora-academy",
    ls: () => "lab_config.txt  network_topology.pdf  notes.md",
    "ip addr": () => `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    link/ether 08:00:27:8d:c3:4a brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.105/24 brd 192.168.1.255 scope global dynamic eth0`,
    "conf t": () => "Entering configuration mode (terminal). Type 'exit' to leave.",
    ping: (args) => args.length ? `PING ${args[0]} (192.168.1.1): 56 data bytes
64 bytes from ${args[0]}: icmp_seq=0 ttl=64 time=0.045 ms
64 bytes from ${args[0]}: icmp_seq=1 ttl=64 time=0.052 ms` : "Usage: ping [host]",
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const [cmd, ...args] = input.trim().toLowerCase().split(" ");
    const newHistory: HistoryItem[] = [...history, { type: "command", content: input }];

    if (cmd === "clear") {
      setHistory([]);
    } else if (commands[cmd]) {
      newHistory.push({ type: "output", content: commands[cmd](args) });
      setHistory(newHistory);
    } else if (input.trim().startsWith("ip ")) {
        const fullCmd = input.trim();
        if (commands[fullCmd]) {
            newHistory.push({ type: "output", content: commands[fullCmd]([]) });
        } else {
            newHistory.push({ type: "error", content: `Perintah tidak dikenal: ${input}` });
        }
        setHistory(newHistory);
    } else {
      newHistory.push({ type: "error", content: `Perintah tidak dikenal: ${input}` });
      setHistory(newHistory);
    }

    setInput("");
  };

  return (
    <div className={`flex flex-col bg-black border border-white/20 font-mono transition-all duration-300 shadow-2xl ${isMaximized ? "fixed inset-0 z-50" : "h-[500px] w-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-white/50 uppercase tracking-widest">TJKT Terminal Lab</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-1 hover:bg-white/10 text-white/40 transition-colors">
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
        {history.map((item, i) => (
          <div key={i} className={item.type === "command" ? "text-white" : item.type === "error" ? "text-accent" : "text-white/60"}>
            {item.type === "command" && <span className="text-accent mr-2">$</span>}
            <pre className="whitespace-pre-wrap">{item.content}</pre>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleCommand} className="p-4 bg-white/5 flex items-center gap-2 border-t border-white/10">
        <span className="text-accent font-bold">$</span>
        <input
          autoFocus
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border-none outline-none text-white w-full text-sm"
          placeholder="Ketik perintah..."
        />
      </form>
    </div>
  );
}
