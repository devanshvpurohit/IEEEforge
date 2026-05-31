import { resolveUserGeminiApiKey } from "@/lib/api-key";
import type { AiSettings } from "@/lib/settings-storage";
import { hasBuilderContent, isBuilderReadyForConvert, type PaperBuilderDraft } from "@/lib/paper-builder";

export function validateClientAiSettings(settings: AiSettings): string | null {
  if (settings.provider === "gemini") {
    if (!resolveUserGeminiApiKey(settings.geminiKey)) {
      return "Add a valid Gemini API key in Settings → Save Settings (from Google AI Studio).";
    }
    return null;
  }

  if (!settings.ollamaModel?.trim()) {
    return "Select an Ollama model in Settings and click Refresh.";
  }

  return null;
}

export function validateConvertInputs(
  settings: AiSettings,
  analysisContent: string | undefined,
  builder: PaperBuilderDraft
): string | null {
  const configError = validateClientAiSettings(settings);
  if (configError) return configError;

  const hasDoc = Boolean(analysisContent?.trim());
  const hasBuilder = hasBuilderContent(builder);

  if (!hasDoc && !hasBuilder) {
    return "Upload a document and/or fill in the paper assistant first.";
  }

  if (!hasDoc && hasBuilder && !isBuilderReadyForConvert(builder)) {
    return "Paper assistant needs: title, problem/approach, and results or tech stack.";
  }

  return null;
}

/** Keep image payloads under ~4MB total for API JSON body */
export function validateImagePayload(
  images: Array<{ data: string }>
): string | null {
  const totalBytes = images.reduce((sum, img) => sum + (img.data?.length ?? 0) * 0.75, 0);
  if (totalBytes > 4 * 1024 * 1024) {
    return "Images are too large. Use fewer or smaller images (under 4MB total).";
  }
  return null;
}
