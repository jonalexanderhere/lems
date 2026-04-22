"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Circle, CheckCircle2, Loader2 } from "lucide-react";

type LessonCompleteButtonProps = {
  lessonId: string;
  initialCompleted: boolean;
};

export function LessonCompleteButton({ lessonId, initialCompleted }: LessonCompleteButtonProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = () => {
    setError("");
    setIsPending(true);
    void (async () => {
      try {
        const response = await fetch("/api/lesson-progress/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lesson_id: lessonId }),
        });

        const payload = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          setError(payload.error ?? "Gagal menandai selesai.");
          return;
        }

        setIsCompleted(true);
        router.refresh();
      } catch {
        setError("Gagal menandai selesai.");
      } finally {
        setIsPending(false);
      }
    })();
  };

  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 font-bold uppercase tracking-widest text-sm">
        <CheckCircle2 className="w-5 h-5" /> Selesai
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending}
        className="flex items-center gap-2 px-6 py-3 bg-[#FF2D2D] text-white font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Circle className="w-5 h-5" />}
        Tandai Selesai
      </button>
      {error && <p className="text-xs text-[#FF2D2D] max-w-xs text-right">{error}</p>}
    </div>
  );
}
