import { NextRequest, NextResponse } from "next/server";
import { generateBuilderQuestions, parseAiRequestConfig, validateAiConfig } from "@/lib/ai-engine";
import { formatAiErrorMessage, isAuthError } from "@/lib/api-key";
import { FALLBACK_QUESTION_SET } from "@/lib/builder-questions";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const aiConfig = parseAiRequestConfig(body);
    const configError = validateAiConfig(aiConfig);

    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 });
    }

    const questionSet = await generateBuilderQuestions(aiConfig, {
      documentContent: typeof body.documentContent === "string" ? body.documentContent : undefined,
      filename: typeof body.filename === "string" ? body.filename : undefined,
      analysisSummary:
        typeof body.analysisSummary === "string" ? body.analysisSummary : undefined,
      researchDomain:
        typeof body.researchDomain === "string" ? body.researchDomain : undefined,
    });

    return NextResponse.json(questionSet);
  } catch (error: unknown) {
    console.error("Builder questions error:", error);
    const message = formatAiErrorMessage(error);
    const status = isAuthError(message) ? 401 : 400;
    return NextResponse.json(
      {
        error: message,
        ...FALLBACK_QUESTION_SET,
        fallback: true,
      },
      { status }
    );
  }
}
