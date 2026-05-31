import { NextRequest, NextResponse } from "next/server";
import { convertToIEEE } from "@/lib/ai-engine";

export async function POST(req: NextRequest) {
  try {
    const { content, gemini_key } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const apiKey = gemini_key || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing" }, { status: 400 });
    }

    const paper = await convertToIEEE(content, apiKey);
    return NextResponse.json(paper);
  } catch (error: any) {
    console.error("Conversion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
