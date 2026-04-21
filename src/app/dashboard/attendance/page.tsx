"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  User,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";

type AttendanceProfile = {
  class_id: string | null;
  full_name: string | null;
  username: string | null;
  classes: { id: string; name: string } | null;
  face_descriptor: number[] | null;
  face_enrolled_at: string | null;
};

type AttendanceRecord = {
  id: string;
  student_id: string;
  created_at: string;
  status: string;
  confidence_score: number | null;
  profiles: { full_name: string | null; username: string | null } | null;
};

type FaceApiModule = typeof import("face-api.js");
type ViewState = "loading-models" | "ready" | "capturing" | "enrolling" | "scanning" | "success" | "error";

export default function AttendancePage() {
  const supabase = useMemo(() => createClient(), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [faceApi, setFaceApi] = useState<FaceApiModule | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [status, setStatus] = useState<ViewState>("loading-models");
  const [message, setMessage] = useState("Memuat model AI...");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<AttendanceProfile | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const enrolledDescriptor = profile?.face_descriptor ? new Float32Array(profile.face_descriptor) : null;
  const hasEnrollment = Boolean(enrolledDescriptor?.length);

  const fetchTodayRecords = async () => {
    setLoadingRecords(true);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data } = await supabase
      .from("attendance_logs")
      .select("id, student_id, created_at, status, confidence_score, profiles(full_name, username)")
      .gte("created_at", startOfDay)
      .lt("created_at", endOfDay)
      .order("created_at", { ascending: false });

    setTodayRecords((data ?? []) as unknown as AttendanceRecord[]);
    setLoadingRecords(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("class_id, full_name, username, face_descriptor, face_enrolled_at, classes(id, name)")
        .eq("id", user.id)
        .single();

      setProfile((p ?? null) as AttendanceProfile | null);
      await fetchTodayRecords();
    };
    init();
  }, [supabase]);

  // Automated scanning loop
  useEffect(() => {
    if (!modelsReady || !hasEnrollment || status === "success" || status === "loading-models") return;

    let timer: NodeJS.Timeout;
    if (status === "capturing" && !isScanning) {
      timer = setInterval(async () => {
        setIsScanning(true);
        await verifyAttendance();
        setIsScanning(false);
      }, 3000); // Scan every 3 seconds
    }
    return () => clearInterval(timer);
  }, [modelsReady, hasEnrollment, status, isScanning]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        if (modelsReady) return;
        const mod = await import("face-api.js");
        setFaceApi(mod);
        setMessage("Sedang mengunduh neural network (5MB)...");
        await Promise.all([
          mod.nets.tinyFaceDetector.loadFromUri("/models"),
          mod.nets.faceLandmark68Net.loadFromUri("/models"),
          mod.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        
        setMessage("Mengoptimalkan model untuk perangkat Anda...");
        // Warm up the models
        const dummyCanvas = document.createElement("canvas");
        dummyCanvas.width = 100;
        dummyCanvas.height = 100;
        await mod.detectSingleFace(dummyCanvas, new mod.TinyFaceDetectorOptions());
        
        setModelsReady(true);
        setStatus("capturing");
        setMessage("Model AI siap. Memasuki mode deteksi otomatis...");
        
        // Start camera directly without checking state variable yet
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) { 
          videoRef.current.srcObject = stream; 
          await videoRef.current.play(); 
        }
      } catch (err) {
        console.error("Model/Camera loading error:", err);
        setStatus("error");
        setMessage("Gagal memuat sistem AI atau kamera. Pastikan folder /models ada dan izin kamera aktif.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startCamera = async () => {
    if (!modelsReady) { setStatus("loading-models"); setMessage("Model AI masih dimuat..."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStatus("capturing");
      setMessage(hasEnrollment ? "Kamera aktif. Klik verifikasi absensi." : "Kamera aktif. Klik daftarkan wajah.");
    } catch {
      setStatus("error");
      setMessage("Gagal mengakses kamera. Pastikan izin kamera sudah aktif.");
    }
  };

  const clearOverlay = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const detectFace = async () => {
    if (!faceApi || !videoRef.current) return null;
    const detection = await faceApi
      .detectSingleFace(videoRef.current, new faceApi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) return null;
    const canvas = canvasRef.current;
    if (canvas && videoRef.current.videoWidth && videoRef.current.videoHeight) {
      const dims = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
      canvas.width = dims.width;
      canvas.height = dims.height;
      faceApi.matchDimensions(canvas, dims);
      const resized = faceApi.resizeResults(detection, dims);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceApi.draw.drawDetections(canvas, resized);
        faceApi.draw.drawFaceLandmarks(canvas, resized);
      }
    }
    return detection.descriptor;
  };

  const enrollFace = async () => {
    if (!faceApi || !userId) return;
    if (status !== "capturing") await startCamera();
    if (!streamRef.current) return;
    setStatus("enrolling");
    setMessage("Mendeteksi wajah untuk pendaftaran...");
    const descriptor = await detectFace();
    if (!descriptor) { setStatus("error"); setMessage("Tidak ada wajah terdeteksi. Posisikan wajah lebih dekat ke kamera."); return; }
    const savedDescriptor = Array.from(descriptor);
    const { error } = await supabase.from("profiles").update({ face_descriptor: savedDescriptor, face_enrolled_at: new Date().toISOString() }).eq("id", userId);
    if (error) { setStatus("error"); setMessage("Gagal menyimpan profil wajah: " + error.message); return; }
    setProfile((prev) => prev ? { ...prev, face_descriptor: savedDescriptor, face_enrolled_at: new Date().toISOString() } : prev);
    setStatus("success");
    setMessage("Wajah berhasil didaftarkan. Absensi berikutnya akan otomatis cocok.");
    clearOverlay();
    stopCamera();
  };

  const verifyAttendance = async () => {
    if (!faceApi || !userId || !enrolledDescriptor) return;
    if (status !== "capturing") await startCamera();
    if (!streamRef.current) return;
    setStatus("scanning");
    setMessage("Mencocokkan wajah dengan model AI...");
    const descriptor = await detectFace();
    if (!descriptor) { setStatus("error"); setMessage("Wajah tidak terdeteksi. Coba lagi dengan pencahayaan lebih baik."); return; }
    const distance = faceApi.euclideanDistance(enrolledDescriptor, descriptor);
    const confidence = Math.max(0, Math.min(1, 1 - distance / 0.6));
    if (distance > 0.55) { setStatus("error"); setMessage(`Wajah tidak cocok. Jarak descriptor: ${distance.toFixed(3)}`); return; }

    // 1. Insert into logs (automated history)
    const { error } = await supabase.from("attendance_logs").insert({
      student_id: userId,
      class_id: profile?.class_id,
      method: "face_ai",
      status: "present",
      confidence_score: confidence,
    });
    if (error) { setStatus("error"); setMessage("Gagal menyimpan log absensi: " + error.message); return; }

    // 2. Hard-insert into attendance_records (main dashboard data)
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("attendance_records").upsert({
      student_id: userId,
      class_id: profile?.class_id,
      date: today,
      status: "present",
    }, { onConflict: "student_id, date" });


    setStatus("success");
    setMessage(`✓ Absensi berhasil! ${profile?.full_name ?? profile?.username ?? "Kamu"} — ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`);
    clearOverlay();
    stopCamera();
    await fetchTodayRecords();
  };

  const isBusy = status === "loading-models" || status === "enrolling" || status === "scanning";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-32 pb-12 px-6 md:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.35em] text-sm mb-4">AI Face Attendance</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
              Absensi <span className="text-accent">Wajah</span>
            </h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Teknologi rekognisi wajah Netvora menggunakan jaringan saraf tiruan (neural networks) untuk mendeteksi identitas secara instan tanpa perlu menyentuh perangkat. Solusi cerdas untuk absensi higienis dan anti-titip absen.
            </p>
          </div>

          <div className="bg-[#FF2D2D]/5 border border-[#FF2D2D]/20 p-6 mb-12 text-center">
            <p className="text-sm font-mono text-[#FF2D2D] uppercase tracking-widest">Target: Siswa SMK TJKT & Praktisi IT</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT — Camera */}
            <div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-white/5 border border-white/10 text-center">
                  <ScanFace className="w-5 h-5 text-accent mx-auto mb-1.5" />
                  <p className="font-bold text-xs mb-0.5">Model AI</p>
                  <p className="text-white/40 text-xs">{modelsReady ? "Siap" : "Memuat..."}</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 text-center">
                  <ShieldCheck className="w-5 h-5 text-accent mx-auto mb-1.5" />
                  <p className="font-bold text-xs mb-0.5">Wajah</p>
                  <p className="text-white/40 text-xs">{hasEnrollment ? "Terdaftar ✓" : "Belum ada"}</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 text-center">
                  <BadgeCheck className="w-5 h-5 text-accent mx-auto mb-1.5" />
                  <p className="font-bold text-xs mb-0.5">Kelas</p>
                  <p className="text-white/40 text-xs truncate">{profile?.classes?.name ?? "—"}</p>
                </div>
              </div>

              <div className="relative aspect-video bg-white/5 border border-white/10 rounded-sm overflow-hidden mb-4">
                {status === "loading-models" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-accent" />
                    <p className="text-white/50">Memuat model AI...</p>
                  </div>
                )}
                {status !== "success" && (
                  <video ref={videoRef} autoPlay playsInline muted
                    className={`w-full h-full object-cover ${status === "loading-models" ? "opacity-0" : "opacity-100"}`}
                  />
                )}
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                {(status === "capturing" || status === "scanning" || status === "enrolling") && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72 border-2 border-accent border-dashed opacity-60 rounded-3xl" />
                    {status === "scanning" && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-accent/50 shadow-[0_0_15px_rgba(255,45,45,0.8)] animate-scan" />
                    )}
                  </div>
                )}
                {status === "success" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-sm">
                    <CheckCircle2 className="w-16 h-16 text-green-400 mb-3 animate-bounce" />
                    <p className="text-xl font-black text-white uppercase tracking-tight">Terverifikasi!</p>
                    <p className="text-green-400 text-sm mt-1 font-mono">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</p>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className={`p-3 border mb-4 flex items-center gap-3 text-sm transition-colors rounded-sm ${
                status === "error" ? "bg-accent/10 border-accent/30 text-accent" :
                status === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" :
                "bg-white/5 border-white/10 text-white/60"
              }`}>
                {status === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> :
                 status === "loading-models" ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> :
                 <ShieldCheck className="w-4 h-4 shrink-0" />}
                <p>{message}</p>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={startCamera} disabled={isBusy} className="py-3 bg-white/10 text-white text-sm font-bold uppercase tracking-wide hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Camera className="w-4 h-4" /> Kamera
                </button>
                <button onClick={enrollFace} disabled={isBusy || !modelsReady} className="py-3 bg-[#FF2D2D]/20 text-[#FF2D2D] border border-[#FF2D2D]/30 text-sm font-bold uppercase tracking-wide hover:bg-[#FF2D2D] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <UserRoundPlus className="w-4 h-4" /> Daftar Wajah
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-white/30">
                <button onClick={stopCamera} className="inline-flex items-center gap-1.5 hover:text-white transition-colors">
                  <RefreshCw className="w-3 h-3" /> Matikan kamera
                </button>
                <Link href="/dashboard" className="hover:text-white transition-colors">← Dashboard</Link>
              </div>
            </div>

            {/* RIGHT — Rekap Absensi Hari Ini */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-grotesk)" }}>
                    Rekap Hari Ini
                  </h2>
                  <p className="text-white/40 text-xs mt-0.5">
                    {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={fetchTodayRecords} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-sm text-center">
                  <p className="text-2xl font-black text-green-400">{todayRecords.length}</p>
                  <p className="text-white/50 text-xs uppercase tracking-widest mt-1">Hadir</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-sm text-center">
                  <p className="text-2xl font-black text-white">
                    {todayRecords.length > 0
                      ? new Date(todayRecords[todayRecords.length - 1].created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </p>
                  <p className="text-white/50 text-xs uppercase tracking-widest mt-1">Pertama Masuk</p>
                </div>
              </div>

              {/* Attendance list */}
              <div className="bg-white/5 border border-white/10 rounded-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Log Absensi</span>
                </div>
                {loadingRecords ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                  </div>
                ) : todayRecords.length === 0 ? (
                  <div className="p-8 text-center text-white/30">
                    <ScanFace className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Belum ada absensi hari ini</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                    {todayRecords.map((rec) => {
                      const name = (rec.profiles as { full_name: string | null; username: string | null } | null)?.full_name
                        ?? (rec.profiles as { full_name: string | null; username: string | null } | null)?.username
                        ?? "Tidak Dikenal";
                      const time = new Date(rec.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      const conf = rec.confidence_score ? `${(rec.confidence_score * 100).toFixed(0)}%` : null;
                      return (
                        <div key={rec.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{name}</p>
                            <p className="text-white/40 text-xs font-mono">{time} WIB</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold uppercase rounded-full">Hadir</span>
                            {conf && <p className="text-white/30 text-xs mt-0.5">AI {conf}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes scan { 0% { top: 10%; } 100% { top: 90%; } }
        .animate-scan { animation: scan 1.5s linear infinite alternate; }
      `}</style>
    </main>
  );
}
