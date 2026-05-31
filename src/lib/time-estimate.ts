import type { AiProvider } from "@/lib/settings-storage";
import { countWords } from "@/lib/paper-types";
import { buildContentFromBuilder, type PaperBuilderDraft } from "@/lib/paper-builder";

export interface TimeEstimate {
  minSeconds: number;
  maxSeconds: number;
  label: string;
  detail: string;
}

export function estimateAnalysisTime(wordCount: number, provider: AiProvider): TimeEstimate {
  const base = provider === "ollama" ? 25 : 12;
  const scaled = Math.min(Math.floor(wordCount / 400), 40);
  const minSeconds = base + scaled;
  const maxSeconds = minSeconds + (provider === "ollama" ? 45 : 25);
  return formatEstimate(minSeconds, maxSeconds, "Analysis");
}

export function estimateConvertTime(
  content: string,
  provider: AiProvider,
  imageCount: number,
  builder?: PaperBuilderDraft
): TimeEstimate {
  const builderText = builder ? buildContentFromBuilder(builder) : "";
  const wordCount = countWords([content, builderText].filter(Boolean).join(" "));

  let minSeconds = provider === "ollama" ? 75 : 40;
  minSeconds += Math.min(Math.floor(wordCount / 80), 150);
  minSeconds += imageCount * (provider === "gemini" ? 20 : 12);

  const needsExpansion = wordCount > 1800;
  if (needsExpansion) {
    minSeconds += provider === "ollama" ? 90 : 50;
  }

  const maxSeconds = minSeconds + (provider === "ollama" ? 120 : 75);
  return formatEstimate(minSeconds, maxSeconds, "Full paper generation");
}

function formatEstimate(minSeconds: number, maxSeconds: number, task: string): TimeEstimate {
  const label = formatDurationRange(minSeconds, maxSeconds);
  return {
    minSeconds,
    maxSeconds,
    label,
    detail: `${task}: typically ${label}`,
  };
}

export function formatDurationRange(minSeconds: number, maxSeconds: number): string {
  if (maxSeconds < 60) {
    return `~${minSeconds}–${maxSeconds} sec`;
  }
  const minMin = Math.max(1, Math.floor(minSeconds / 60));
  const maxMin = Math.max(minMin, Math.ceil(maxSeconds / 60));
  if (minMin === maxMin) return `~${minMin} min`;
  return `~${minMin}–${maxMin} min`;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
