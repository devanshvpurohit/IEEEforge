import { NextRequest, NextResponse } from "next/server";
import {
  convertToIEEE,
  parseAiRequestConfig,
  validateAiConfig,
} from "@/lib/ai-engine";
import { formatAiErrorMessage, httpStatusForAiError, isAuthError } from "@/lib/api-key";
import { buildContentFromBuilder, hasBuilderContent, type PaperBuilderDraft } from "@/lib/paper-builder";
import { attachImagesToPaper, ensurePaper } from "@/lib/paper-types";
import type { PaperImageInput } from "@/lib/ai-config";

export const maxDuration = 300;

function parseBuilder(raw: unknown): PaperBuilderDraft | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Record<string, unknown>;
  return {
    title: String(b.title ?? ""),
    techStack: String(b.techStack ?? ""),
    topics: String(b.topics ?? ""),
    roughExplanation: String(b.roughExplanation ?? ""),
    results: String(b.results ?? ""),
    comparison: String(b.comparison ?? ""),
    extraNotes: String(b.extraNotes ?? ""),
  };
}

function parseImages(raw: unknown): PaperImageInput[] {
  if (!Array.isArray(raw)) return [];
  const images: PaperImageInput[] = [];
  
  for (let i = 0; i < raw.length && images.length < 6; i++) {
    const item = raw[i];
    if (item && typeof item === "object") {
      const r = item as Record<string, unknown>;
      const mimeType = String(r.mimeType ?? "");
      const data = String(r.data ?? "");
      
      if (mimeType && data) {
        images.push({
          id: String(r.id ?? `img-${i}`),
          mimeType,
          data,
          filename: r.filename ? String(r.filename) : undefined,
          userCaption: r.caption ? String(r.caption) : r.userCaption ? String(r.userCaption) : undefined,
        });
      }
    }
  }
  
  return images;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = typeof body.content === "string" ? body.content : "";
    const builder = parseBuilder(body.builder);
    const images = parseImages(body.images);

    const builderContent = builder && hasBuilderContent(builder) ? buildContentFromBuilder(builder) : "";
    const mergedContent = [content, builderContent].filter(Boolean).join("\n\n");

    if (!mergedContent.trim()) {
      return NextResponse.json(
        { error: "Add a document and/or complete the paper assistant (title + explanation required)." },
        { status: 400 }
      );
    }

    const aiConfig = parseAiRequestConfig(body);
    const configError = validateAiConfig(aiConfig);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 });
    }

    const rawPaper = await convertToIEEE(mergedContent, aiConfig, { images });
    const paper = attachImagesToPaper(ensurePaper(rawPaper), images);

    return NextResponse.json(paper);
  } catch (error: unknown) {
    console.error("Conversion error:", error);
    const rawMessage = error instanceof Error ? error.message : "Conversion failed";
    const message = formatAiErrorMessage(error);
    const status = isAuthError(rawMessage) || isAuthError(message) ? 401 : httpStatusForAiError(message);
    return NextResponse.json({ error: message }, { status });
  }
}
