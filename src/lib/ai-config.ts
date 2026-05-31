import type { AiProvider } from "@/lib/settings-storage";
import type { PaperBuilderDraft } from "@/lib/paper-builder";

export interface AiRequestConfig {
  provider: AiProvider;
  geminiKey?: string;
  geminiModel?: string;
  ollamaModel?: string;
}

export interface PaperImageInput {
  id: string;
  mimeType: string;
  data: string;
  filename?: string;
  userCaption?: string;
}

export interface ConvertOptions {
  builder?: PaperBuilderDraft;
  images?: PaperImageInput[];
}
