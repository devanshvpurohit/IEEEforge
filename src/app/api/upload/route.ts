import { NextRequest, NextResponse } from "next/server";
import { parsePdf, parseDocx, parseTxt, getMetadata } from "@/lib/document-parser";
import {
  analyzeDocument,
  parseAiRequestConfig,
  validateAiConfig,
} from "@/lib/ai-engine";
import { formatAiErrorMessage, isPlaceholderApiKey } from "@/lib/api-key";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file instanceof File ? file.name : "upload.txt";
    const aiConfig = parseAiRequestConfig({
      provider: (formData.get("provider") as string) || "gemini",
      gemini_key: (formData.get("gemini_key") as string) || "",
      gemini_model: (formData.get("gemini_model") as string) || undefined,
      ollama_model: (formData.get("ollama_model") as string) || undefined,
      model: (formData.get("model") as string) || undefined,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = fileName.split(".").pop()?.toLowerCase();

    let textContent = "";
    try {
      if (extension === "pdf") {
        textContent = await parsePdf(buffer);
      } else if (extension === "docx") {
        textContent = await parseDocx(buffer);
      } else if (extension === "txt" || extension === "md") {
        textContent = await parseTxt(buffer);
      } else {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : "Could not read this file.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: "No text found in this file. Try a different export format." },
        { status: 400 }
      );
    }

    const metadata = getMetadata(textContent);
    const withAiAnalysis = formData.get("with_ai_analysis") !== "false";

    let analysis = null;
    let analysis_error: string | undefined;

    if (!withAiAnalysis) {
      return NextResponse.json({
        filename: fileName,
        metadata,
        analysis: null,
        analysis_error: undefined,
        content: textContent,
        parsed_only: true,
      });
    }

    const configError = validateAiConfig(aiConfig);
    if (configError) {
      const geminiKey = (formData.get("gemini_key") as string)?.trim() || "";
      if (aiConfig.provider === "gemini" && geminiKey && isPlaceholderApiKey(geminiKey)) {
        analysis_error =
          "Saved API key is still a placeholder. Add a real Gemini key in Settings and click Save.";
      } else {
        analysis_error = configError;
      }
    } else {
      try {
        analysis = await analyzeDocument(textContent, aiConfig);
      } catch (error) {
        console.error("Analysis error:", error);
        analysis_error = formatAiErrorMessage(error);
      }
    }

    return NextResponse.json({
      filename: fileName,
      metadata,
      analysis,
      analysis_error,
      content: textContent,
      parsed_only: false,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
