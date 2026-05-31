export const GEMINI_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_CANDIDATES)[number] | "auto";

export const GEMINI_MODEL_OPTIONS: { id: GeminiModelId; label: string }[] = [
  { id: "auto", label: "Auto (compatible with any API tier)" },
  ...GEMINI_MODEL_CANDIDATES.map((id) => ({
    id: id as GeminiModelId,
    label: id
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  })),
];
