import { NextRequest, NextResponse } from "next/server";
import { parsePdf, parseDocx, parseTxt, getMetadata } from "@/lib/document-parser";
import { analyzeDocument } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const geminiKey = formData.get("gemini_key") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop()?.toLowerCase();

    let textContent = "";
    if (extension === "pdf") {
      textContent = await parsePdf(buffer);
    } else if (extension === "docx") {
      textContent = await parseDocx(buffer);
    } else if (extension === "txt" || extension === "md") {
      textContent = await parseTxt(buffer);
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const metadata = getMetadata(textContent);
    
    // Default to server key if user doesn't provide one
    const apiKey = geminiKey || process.env.GEMINI_API_KEY;
    let analysis = null;

    if (apiKey) {
      analysis = await analyzeDocument(textContent, apiKey);
    }

    return NextResponse.json({
      filename: file.name,
      metadata,
      analysis,
      content: textContent,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
