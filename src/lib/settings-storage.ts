export const AI_SETTINGS_STORAGE_KEY = "ieeeforge-ai-settings";

export type AiProvider = "gemini" | "ollama";

export interface AiSettings {
  provider: AiProvider;
  geminiKey: string;
  geminiModel: string;
  ollamaModel: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: "gemini",
  geminiKey: "",
  geminiModel: "auto",
  ollamaModel: "",
};

export function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;

  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AiSettings> & { model?: string };

    return {
      provider: parsed.provider === "ollama" ? "ollama" : "gemini",
      geminiKey: typeof parsed.geminiKey === "string" ? parsed.geminiKey : "",
      geminiModel:
        typeof parsed.geminiModel === "string"
          ? parsed.geminiModel
          : typeof parsed.model === "string"
            ? parsed.model
            : "auto",
      ollamaModel: typeof parsed.ollamaModel === "string" ? parsed.ollamaModel : "",
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAiSettings(settings: AiSettings): void {
  localStorage.setItem(
    AI_SETTINGS_STORAGE_KEY,
    JSON.stringify({
      provider: settings.provider,
      geminiKey: settings.geminiKey.trim(),
      geminiModel: settings.geminiModel,
      ollamaModel: settings.ollamaModel.trim(),
    })
  );
}
