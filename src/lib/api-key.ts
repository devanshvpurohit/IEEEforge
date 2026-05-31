const PLACEHOLDER_VALUES = new Set([
  "",
  "your_gemini_api_key_here",
  "your-api-key",
  "sk-xxx",
]);

export function isPlaceholderApiKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (PLACEHOLDER_VALUES.has(normalized)) return true;
  return (
    normalized.includes("your_") &&
    (normalized.includes("api_key") || normalized.includes("apikey"))
  );
}

/** Uses the key provided by the user, or falls back to server-side GEMINI_API_KEY env var. */
export function resolveUserGeminiApiKey(userKey?: string | null): string | null {
  const trimmed = userKey?.trim();
  if (trimmed && !isPlaceholderApiKey(trimmed)) return trimmed;
  
  // Fallback to server-side environment variable
  const serverKey = process.env.GEMINI_API_KEY;
  if (serverKey && !isPlaceholderApiKey(serverKey)) return serverKey;
  
  return null;
}

export function formatAiErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "AI request failed. Please try again.";

  if (isAuthError(raw)) {
    return "Your Gemini API key is invalid. Open Settings, enter a valid key from Google AI Studio, and click Save.";
  }

  if (isQuotaError(raw)) {
    return "Gemini API quota exceeded. Check your Google AI Studio usage or try again later.";
  }

  if (raw.toLowerCase().includes("ollama")) {
    return raw;
  }

  const withoutModel = raw.replace(/^\[[^\]]+\]\s*/, "");
  return withoutModel.length > 280 ? `${withoutModel.slice(0, 277)}...` : withoutModel;
}

export function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key") ||
    lower.includes("api key is invalid") ||
    lower.includes("gemini api key") ||
    lower.includes("add a valid gemini") ||
    lower.includes("permission denied") ||
    lower.includes("unauthenticated")
  );
}

export function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource_exhausted");
}

export function httpStatusForAiError(message: string): number {
  if (isAuthError(message)) return 401;
  if (isQuotaError(message)) return 429;
  return 400;
}
