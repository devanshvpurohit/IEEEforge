"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, CheckCircle } from "lucide-react";
import type { TimeEstimate } from "@/lib/time-estimate";
import { formatElapsed } from "@/lib/time-estimate";

interface ProcessingTimerProps {
  active: boolean;
  elapsedSeconds: number;
  estimate: TimeEstimate | null;
  label?: string;
}

export default function ProcessingTimer({
  active,
  elapsedSeconds,
  estimate,
  label = "Processing",
}: ProcessingTimerProps) {
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());

  // Animate progress bar smoothly
  useEffect(() => {
    if (!active) {
      setDisplayedProgress(0);
      return;
    }
    startRef.current = Date.now() - elapsedSeconds * 1000;
  }, [active, elapsedSeconds]);

  useEffect(() => {
    if (!active || !estimate) {
      if (!active) setDisplayedProgress(0);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const maxSeconds = estimate.maxSeconds;
      // Ease towards 90% at maxSeconds, never hits 100% until done
      const raw = Math.min(elapsed / maxSeconds, 0.95);
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      setDisplayedProgress(Math.round(eased * 95));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active, estimate]);

  // When done, flash to 100%
  useEffect(() => {
    if (!active) {
      setDisplayedProgress(100);
      const t = setTimeout(() => setDisplayedProgress(0), 1200);
      return () => clearTimeout(t);
    }
  }, [active]);

  const remaining = estimate
    ? Math.max(0, Math.ceil(estimate.maxSeconds - elapsedSeconds))
    : null;

  const steps = [
    { label: "Parsing document", done: elapsedSeconds > 3 },
    { label: "AI analysis", done: elapsedSeconds > 8 },
    { label: label.toLowerCase().includes("generat") ? "Building sections" : "Generating insights", done: elapsedSeconds > 15 },
    { label: "Finalizing", done: elapsedSeconds > (estimate?.minSeconds ?? 30) },
  ];

  if (!active && displayedProgress === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-[#D4AF37]/20 space-y-4 shadow-lg shadow-[#D4AF37]/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-ping opacity-40" />
          </div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatElapsed(elapsedSeconds)} elapsed
          </span>
          {remaining !== null && remaining > 0 && active && (
            <span className="text-white/30">~{remaining}s remaining</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${displayedProgress}%`,
              background: "linear-gradient(90deg, #D4AF37, #f0c93a, #D4AF37)",
              backgroundSize: "200% 100%",
              animation: active ? "shimmer 2s linear infinite" : "none",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30">
          <span>{displayedProgress}%</span>
          {estimate && (
            <span>Est. {estimate.label}</span>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all duration-500 ${
              step.done
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : active && i === steps.filter((s) => s.done).length
                ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                : "bg-white/[0.03] text-white/25 border border-white/5"
            }`}
          >
            {step.done ? (
              <CheckCircle size={11} />
            ) : active && i === steps.filter((s) => s.done).length ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border border-current opacity-50" />
            )}
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
