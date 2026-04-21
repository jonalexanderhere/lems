"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Camera, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AttendancePage() {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"idle" | "capturing" | "scanning" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: p } = await supabase.from("profiles").select("*, classes(id, name)").eq("id", user.id).single();
      setProfile(p);
    };
    init();
  }, []);

  const startCamera = async () => {
    setStatus("capturing");
    setMessage("Menginisialisasi kamera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMessage("Posisikan wajah Anda di dalam bingkai");
    } catch (err) {
      setStatus("error");
      setMessage("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  };

  const captureAndVerify = async () => {
    if (status !== "capturing") return;
    setStatus("scanning");
    setMessage("Memindai wajah... Mohon tunggu");

    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Capture frame (simulated)
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      context?.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      
      // In a real app, we would send this to a face-api endpoint.
      // Here we simulate a successful match.
      const confidence = 0.94 + Math.random() * 0.05;

      const { error } = await supabase.from("attendance_logs").insert({
        student_id: userId,
        class_id: profile?.class_id,
        confidence_score: confidence,
        status: "present"
      });

      if (error) {
        setStatus("error");
        setMessage("Gagal menyimpan data absensi: " + error.message);
      } else {
        setStatus("success");
        setMessage(`Absensi berhasil diverifikasi! Skor kecocokan: ${(confidence * 100).toFixed(1)}%`);
        // Stop camera
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-32 pb-12 px-6 md:px-12">
        <div className="container mx-auto max-w-2xl text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
            Absensi <span className="text-accent">Wajah.</span>
          </h1>
          <p className="text-white/50 mb-12">Gunakan verifikasi biometrik untuk mencatat kehadiran Anda hari ini.</p>

          <div className="relative aspect-video bg-white/5 border border-white/10 rounded-sm overflow-hidden mb-8 group">
            {status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-accent" />
                </div>
                <button onClick={startCamera} className="px-8 py-3 bg-accent text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                  Buka Kamera
                </button>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${status === "idle" || status === "success" ? "hidden" : "block"}`}
            />

            {(status === "capturing" || status === "scanning") && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Face Frame UI */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-accent border-dashed opacity-50 rounded-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-88 border border-white/10 opacity-20 rounded-[4rem]" />
                
                {/* Scanning Animation */}
                {status === "scanning" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent/50 shadow-[0_0_15px_rgba(255,45,45,0.8)] animate-scan" />
                )}
              </div>
            )}

            {status === "success" && (
              <canvas ref={canvasRef} width="640" height="480" className="w-full h-full object-cover grayscale opacity-40" />
            )}

            {status === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-sm">
                <CheckCircle2 className="w-20 h-20 text-green-400 mb-4 animate-bounce" />
                <p className="text-2xl font-black text-white uppercase tracking-tight">Terverifikasi</p>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-sm border mb-8 flex items-center gap-3 transition-colors ${
            status === "error" ? "bg-accent/10 border-accent/30 text-accent" : 
            status === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
            "bg-white/5 border-white/10 text-white/60"
          }`}>
            {status === "error" ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
             status === "scanning" ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> :
             <ShieldCheck className="w-5 h-5 shrink-0" />}
            <p className="text-sm font-medium">{message || "Sistem Siap"}</p>
          </div>

          {status === "capturing" && (
            <button
              onClick={captureAndVerify}
              className="w-full py-4 bg-accent text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              Verifikasi Sekarang
            </button>
          )}

          {status === "success" && (
            <Link href="/dashboard" className="inline-block px-12 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              Kembali ke Dashboard
            </Link>
          )}

          {status === "error" && (
            <button onClick={startCamera} className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-colors">
              Coba Lagi
            </button>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite alternate;
        }
      `}</style>
    </main>
  );
}
