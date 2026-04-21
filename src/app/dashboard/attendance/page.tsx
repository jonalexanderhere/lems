"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navigation } from "@/components/Navigation";
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";

type AttendanceProfile = {
  class_id: string | null;
  classes: { id: string; name: string } | null;
  face_descriptor: number[] | null;
  face_enrolled_at: string | null;
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

  const enrolledDescriptor = profile?.face_descriptor ? new Float32Array(profile.face_descriptor) : null;
  const hasEnrollment = Boolean(enrolledDescriptor?.length);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("class_id, face_descriptor, face_enrolled_at, classes(id, name)")
        .eq("id", user.id)
        .single();

      setProfile((p ?? null) as AttendanceProfile | null);
    };

    init();
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        const mod = await import("face-api.js");
        await Promise.all([
          mod.nets.tinyFaceDetector.loadFromUri("/models"),
          mod.nets.faceLandmark68Net.loadFromUri("/models"),
          mod.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        if (!mounted) return;
        setFaceApi(mod);
        setModelsReady(true);
        setStatus("ready");
        setMessage("Model AI siap. Daftarkan wajah atau verifikasi absensi.");
      } catch {
        if (!mounted) return;
        setStatus("error");
        setMessage("Model AI gagal dimuat. Pastikan folder /public/models tersedia.");
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startCamera = async () => {
    if (!modelsReady) {
      setStatus("loading-models");
      setMessage("Model AI masih dimuat...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("capturing");
      setMessage(hasEnrollment ? "Kamera aktif. Klik verifikasi absensi." : "Kamera aktif. Klik daftarkan wajah.");
    } catch {
      setStatus("error");
      setMessage("Gagal mengakses kamera. Pastikan izin kamera sudah aktif.");
    }
  };

  const clearOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const detectFace = async () => {
    if (!faceApi || !videoRef.current) return null;

    const detection = await faceApi
      .detectSingleFace(
        videoRef.current,
        new faceApi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5,
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    const canvas = canvasRef.current;
    if (canvas && videoRef.current.videoWidth && videoRef.current.videoHeight) {
      const dims = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
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
    if (status === "loading-models") return;
    if (status !== "capturing") await startCamera();
    if (!streamRef.current) return;

    setStatus("enrolling");
    setMessage("Mendeteksi wajah untuk pendaftaran...");

    const descriptor = await detectFace();
    if (!descriptor) {
      setStatus("error");
      setMessage("Tidak ada wajah terdeteksi. Posisikan wajah lebih dekat ke kamera.");
      return;
    }

    const savedDescriptor = Array.from(descriptor);
    const { error } = await supabase
      .from("profiles")
      .update({
        face_descriptor: savedDescriptor,
        face_enrolled_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setStatus("error");
      setMessage("Gagal menyimpan profil wajah: " + error.message);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            face_descriptor: savedDescriptor,
            face_enrolled_at: new Date().toISOString(),
          }
        : prev
    );
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
    if (!descriptor) {
      setStatus("error");
      setMessage("Wajah tidak terdeteksi. Coba lagi dengan pencahayaan lebih baik.");
      return;
    }

    const distance = faceApi.euclideanDistance(enrolledDescriptor, descriptor);
    const confidence = Math.max(0, Math.min(1, 1 - distance / 0.6));

    if (distance > 0.55) {
      setStatus("error");
      setMessage(`Wajah tidak cocok. Jarak descriptor: ${distance.toFixed(3)}`);
      return;
    }

    const { error } = await supabase.from("attendance_logs").insert({
      student_id: userId,
      class_id: profile?.class_id,
      method: "face_ai",
      status: "present",
      confidence_score: confidence,
    });

    if (error) {
      setStatus("error");
      setMessage("Gagal menyimpan data absensi: " + error.message);
      return;
    }

    setStatus("success");
    setMessage(`Absensi otomatis diverifikasi dengan confidence ${(confidence * 100).toFixed(1)}%.`);
    clearOverlay();
    stopCamera();
  };

  const isBusy = status === "loading-models" || status === "enrolling" || status === "scanning";

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <Navigation />

      <section className="pt-32 pb-12 px-6 md:px-12">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-[#FF2D2D] font-mono uppercase tracking-[0.35em] text-sm mb-4">AI Face Attendance</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: "var(--font-grotesk)" }}>
            Absensi <span className="text-accent">Wajah</span>
          </h1>
          <p className="text-white/50 mb-10">
            Daftarkan wajah sekali, lalu sistem AI akan mencocokkan absensi secara otomatis.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white/5 border border-white/10 text-left">
              <ScanFace className="w-5 h-5 text-accent mb-2" />
              <p className="font-bold text-sm mb-1">Model aktif</p>
              <p className="text-white/40 text-xs">{modelsReady ? "Siap digunakan" : "Memuat model AI"}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 text-left">
              <ShieldCheck className="w-5 h-5 text-accent mb-2" />
              <p className="font-bold text-sm mb-1">Enrolment</p>
              <p className="text-white/40 text-xs">{hasEnrollment ? "Sudah terdaftar" : "Belum ada wajah tersimpan"}</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 text-left">
              <BadgeCheck className="w-5 h-5 text-accent mb-2" />
              <p className="font-bold text-sm mb-1">Kelas</p>
              <p className="text-white/40 text-xs">{profile?.classes?.name ?? "Belum dipetakan"}</p>
            </div>
          </div>

          <div className="relative aspect-video bg-white/5 border border-white/10 rounded-sm overflow-hidden mb-8">
            {status === "loading-models" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <p className="text-white/50">Memuat model AI...</p>
              </div>
            )}

            {status !== "success" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${status === "loading-models" ? "opacity-0" : "opacity-100"}`}
              />
            )}

            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {(status === "capturing" || status === "scanning" || status === "enrolling") && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 border-2 border-accent border-dashed opacity-50 rounded-3xl" />
                {status !== "scanning" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-88 border border-white/10 opacity-20 rounded-[4rem]" />
                )}
                {status === "scanning" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent/50 shadow-[0_0_15px_rgba(255,45,45,0.8)] animate-scan" />
                )}
              </div>
            )}

            {status === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/10 backdrop-blur-sm">
                <CheckCircle2 className="w-20 h-20 text-green-400 mb-4 animate-bounce" />
                <p className="text-2xl font-black text-white uppercase tracking-tight">Terverifikasi</p>
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-sm border mb-6 flex items-center gap-3 transition-colors ${
              status === "error"
                ? "bg-accent/10 border-accent/30 text-accent"
                : status === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-white/5 border-white/10 text-white/60"
            }`}
          >
            {status === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0" />
            ) : status === "loading-models" ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{message}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startCamera}
              disabled={isBusy}
              className="flex-1 py-4 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              Buka Kamera
            </button>
            <button
              onClick={enrollFace}
              disabled={isBusy || !modelsReady}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <UserRoundPlus className="w-5 h-5" />
              Daftarkan Wajah
            </button>
            <button
              onClick={verifyAttendance}
              disabled={isBusy || !hasEnrollment || !modelsReady}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-accent text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Verifikasi Absensi
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/40">
            <button onClick={stopCamera} className="inline-flex items-center gap-2 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
              Matikan kamera
            </button>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Kembali ke dashboard
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 10%;
          }
          100% {
            top: 90%;
          }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite alternate;
        }
      `}</style>
    </main>
  );
}
