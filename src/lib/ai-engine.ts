import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_CANDIDATES } from "@/lib/gemini-models";
import { formatAiErrorMessage, isAuthError, isQuotaError, resolveUserGeminiApiKey } from "@/lib/api-key";
import type { AiRequestConfig, ConvertOptions, PaperImageInput } from "@/lib/ai-config";
import { discoverOllamaServer, ollamaGenerateJson } from "@/lib/ollama";
import {
  countWords,
  expectedMinWords,
  getPaperStats,
  normalizePaper,
  type IEEEPaper,
} from "@/lib/paper-types";
import {
  normalizeQuestionSet,
  type BuilderQuestionSet,
} from "@/lib/builder-questions";

const GEMINI_INPUT_LIMIT = 120_000;
const OLLAMA_INPUT_LIMIT = 28_000;

function resolveGeminiModelOrder(preferred?: string): string[] {
  const trimmed = preferred?.trim();
  if (!trimmed || trimmed === "auto") {
    return [...GEMINI_MODEL_CANDIDATES];
  }
  return [trimmed, ...GEMINI_MODEL_CANDIDATES.filter((m) => m !== trimmed)];
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function parseJsonFromModelText(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI returned an invalid response. Please try again.");
  }
  try {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    throw new Error("AI returned malformed JSON. Try again or pick a different model.");
  }
}

function isRetryableModelError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("not supported") ||
    lower.includes("does not exist") ||
    lower.includes("404") ||
    (lower.includes("model") && lower.includes("invalid"))
  );
}

function conversionInputLimit(config: AiRequestConfig): number {
  return config.provider === "ollama" ? OLLAMA_INPUT_LIMIT : GEMINI_INPUT_LIMIT;
}

function buildConversionPrompt(
  sourceContent: string,
  sourceWordCount: number,
  imageCount = 0
): string {
  const minWords = expectedMinWords(sourceWordCount);
  const figureBlock =
    imageCount > 0
      ? `
12. figures: Include exactly ${imageCount} entries with IEEE-style captions describing each uploaded image (charts, diagrams, screenshots). Reference them in section text as "Fig. 1", etc. Place each in the most relevant section.
`
      : `
12. figures: Include figure entries if the source describes visuals; otherwise use an empty array.
`;

  return `You are an expert IEEE journal and conference paper editor.

Transform the SOURCE DOCUMENT below into a COMPLETE, publication-ready IEEE-style research paper.

STRICT REQUIREMENTS:
1. Return ONLY valid JSON matching the schema. No markdown code fences or commentary.
2. NEVER use placeholders ("...", "TBD", "[content]", "etc." as filler). Write full paragraphs everywhere.
3. Preserve ALL technical content: methods, algorithms, data, metrics, tables (describe in prose), figures (describe), equations (write clearly), and findings from the source.
4. Formal third-person academic English (IEEE Transactions style).
5. Total length: at least ${minWords} words across all section bodies combined. Scale up for longer sources.
6. Abstract: 150–250 words, standalone summary, no citation numbers in the abstract.
7. keywords: 5–8 Index Terms.
8. Section titles use Roman numerals: "I. INTRODUCTION", "II. RELATED WORK", "III. METHODOLOGY", "IV. RESULTS AND DISCUSSION", "V. CONCLUSION". Add extra sections (e.g. System Design, Experiments, Limitations, Future Work) if the source supports them.
9. Each section: multiple substantial paragraphs separated by \\n\\n in the JSON string. Use IEEE-style subsections (A., B., C.) inside content when helpful.
10. references: IEEE numbered style "[1] A. Author, \\"Title,\\" Journal, vol. x, pp. x–x, Year." Include at least 5 references when the source mentions prior work; infer standard citations if needed.
11. authors: extract from source or use ["Author Name, Department, University"] if unknown.
${figureBlock}
JSON SCHEMA:
{
  "title": "Concise IEEE paper title",
  "authors": ["Name, Affiliation"],
  "abstract": "Full abstract text",
  "keywords": ["term1", "term2"],
  "sections": [
    { "title": "I. INTRODUCTION", "content": "Full section text with\\\\n\\\\n between paragraphs" }
  ],
  "figures": [
    { "number": 1, "caption": "Caption describing the figure.", "section_title": "IV. RESULTS AND DISCUSSION" }
  ],
  "references": ["[1] ...", "[2] ..."]
}

SOURCE DOCUMENT (${sourceWordCount} words):
${sourceContent}`;
}

function buildExpansionPrompt(paper: IEEEPaper, sourceContent: string, targetWords: number): string {
  return `Expand this IEEE paper draft into a fuller publication-ready version with at least ${targetWords} total words in section bodies.

Keep the same JSON schema and title. Enrich every section with more technical detail drawn from the SOURCE. Do not shorten any section. No placeholders.

CURRENT DRAFT JSON:
${JSON.stringify(paper)}

SOURCE DOCUMENT (for additional detail):
${sourceContent.slice(0, 50000)}`;
}

function buildGeminiParts(prompt: string, images?: PaperImageInput[]) {
  if (!images?.length) return prompt;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  images.slice(0, 6).forEach((img, index) => {
    parts.push({
      inlineData: { mimeType: img.mimeType, data: img.data },
    });
    parts.push({
      text: `Uploaded image ${index + 1} (${img.filename || "figure"}): ${img.userCaption || "Incorporate into the paper with a formal IEEE figure caption and discuss it in the results section."}`,
    });
  });

  return parts;
}

async function generateJsonWithGemini(
  prompt: string,
  apiKey: string,
  model?: string,
  images?: PaperImageInput[]
): Promise<Record<string, unknown>> {
  const models = resolveGeminiModelOrder(model);
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: string | null = null;

  for (const modelName of models) {
    try {
      const geminiModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.35,
        },
      });
      const input = buildGeminiParts(prompt, images);
      const result = await geminiModel.generateContent(input);
      const text = result.response.text();
      return parseJsonFromModelText(text);
    } catch (error) {
      const message = extractErrorMessage(error);
      lastError = `[${modelName}] ${message}`;

      if (isAuthError(message) || isQuotaError(message)) {
        throw new Error(formatAiErrorMessage(error));
      }

      if (isRetryableModelError(message)) {
        continue;
      }

      throw new Error(formatAiErrorMessage(new Error(lastError)));
    }
  }

  throw new Error(
    formatAiErrorMessage(
      new Error(
        lastError ??
          "No compatible Gemini model is available. Try another model in Settings."
      )
    )
  );
}

async function generateJsonWithOllama(
  prompt: string,
  ollamaModel: string
): Promise<Record<string, unknown>> {
  const discovery = await discoverOllamaServer();
  if (!discovery) {
    throw new Error(
      "Could not find Ollama. Start it with `ollama serve` on your machine, then refresh models in Settings."
    );
  }

  const model =
    ollamaModel.trim() ||
    discovery.models[0] ||
    "";

  if (!model) {
    throw new Error(
      "No Ollama models installed. Run e.g. `ollama pull llama3.2` then refresh in Settings."
    );
  }

  if (!discovery.models.includes(model)) {
    throw new Error(
      `Model "${model}" is not available on Ollama. Installed: ${discovery.models.join(", ") || "none"}`
    );
  }

  return ollamaGenerateJson(discovery.baseUrl, model, prompt, { numPredict: 8192 });
}

async function generateJson(
  prompt: string,
  config: AiRequestConfig,
  images?: PaperImageInput[]
): Promise<Record<string, unknown>> {
  if (config.provider === "ollama") {
    const imageNotes =
      images?.length ?
        `\n\nThe author provided ${images.length} figure(s). Describe each in the results section and add matching "figures" array entries with IEEE captions.`
      : "";
    return generateJsonWithOllama(prompt + imageNotes, config.ollamaModel ?? "");
  }

  const apiKey = resolveUserGeminiApiKey(config.geminiKey);
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add your key in Settings and click Save."
    );
  }

  if (images?.length) {
    return generateJsonWithGemini(prompt, apiKey, config.geminiModel, images);
  }

  return generateJsonWithGemini(prompt, apiKey, config.geminiModel);
}

export async function analyzeDocument(content: string, config: AiRequestConfig) {
  const prompt = `
    Analyze the following technical document and provide a JSON summary.
    Document Content: ${content.substring(0, 10000)}...
    
    Return exactly this JSON structure:
    {
        "summary": "Short 2-3 sentence summary",
        "detected_sections": ["list", "of", "sections"],
        "research_domain": "Domain name",
        "technical_complexity": "Low/Medium/High",
        "missing_sections": ["sections", "to", "add"],
        "readiness_score": 0.85
    }
  `;

  return generateJson(prompt, config);
}

export async function generateBuilderQuestions(
  config: AiRequestConfig,
  context?: {
    documentContent?: string;
    filename?: string;
    analysisSummary?: string;
    researchDomain?: string;
  }
): Promise<BuilderQuestionSet> {
  const excerpt = context?.documentContent?.slice(0, 12000) ?? "";
  const hasDoc = excerpt.length > 80;

  const prompt = `You are an IEEE paper writing coach. Generate personalized interview questions for the author.

${hasDoc ? `They uploaded "${context?.filename ?? "a document"}".` : "They are starting without a document."}
${context?.analysisSummary ? `Document summary: ${context.analysisSummary}` : ""}
${context?.researchDomain ? `Research domain: ${context.researchDomain}` : ""}
${hasDoc ? `Document excerpt:\n${excerpt}` : ""}

Return ONLY valid JSON:
{
  "intro": "2-3 sentences explaining what you understood and what you'll help them produce",
  "path_recommendation": "document" | "assistant" | "both",
  "questions": [
    {
      "id": "unique-id",
      "field": "title" | "techStack" | "topics" | "roughExplanation" | "results" | "comparison" | "extraNotes",
      "question": "Conversational question tailored to their work",
      "placeholder": "Short hint for the answer box",
      "suggested_answer": "Pre-filled draft answer from the document if possible, else empty string"
    }
  ]
}

Rules:
- Provide 5-8 questions in logical order for an IEEE paper.
- If a document was provided, tailor every question and suggested_answer to it.
- suggested_answer should be substantive when the document contains the info (otherwise "").
- path_recommendation: "both" if they have a document, "assistant" if starting from scratch, "document" if they only need analysis.`;

  const raw = await generateJson(prompt, config);
  return normalizeQuestionSet(raw);
}

export async function convertToIEEE(
  content: string,
  config: AiRequestConfig,
  options?: ConvertOptions
): Promise<IEEEPaper> {
  // `content` is already merged with builder on the API route when applicable
  const combined = content.trim();
  const sourceWordCount = countWords(combined);

  if (sourceWordCount < 12) {
    throw new Error(
      "Provide more content: upload a document and/or add detail in the paper assistant (title, explanation, results)."
    );
  }

  const limit = conversionInputLimit(config);
  const sourceExcerpt = combined.slice(0, limit);
  const minWords = expectedMinWords(sourceWordCount);
  const images = options?.images ?? [];

  let raw = await generateJson(
    buildConversionPrompt(sourceExcerpt, sourceWordCount, images.length),
    config,
    images
  );

  let paper = normalizePaper(raw);

  if (paper.sections.length < 2) {
    throw new Error(
      "The model returned an incomplete paper (too few sections). Try again or use a more capable model in Settings."
    );
  }

  const stats = getPaperStats(paper);
  if (stats.totalWords < minWords * 0.55) {
    raw = await generateJson(
      buildExpansionPrompt(paper, sourceExcerpt, minWords),
      config,
      images
    );
    paper = normalizePaper(raw);
  }

  if (paper.sections.length < 2 || getPaperStats(paper).totalWords < 250) {
    throw new Error(
      "Could not generate a full paper. Try Gemini with a capable model, or add more detail in the paper assistant."
    );
  }

  return paper;
}

export function parseAiRequestConfig(body: {
  provider?: string;
  gemini_key?: string;
  gemini_model?: string;
  ollama_model?: string;
  model?: string;
}): AiRequestConfig {
  const provider = body.provider === "ollama" ? "ollama" : "gemini";
  return {
    provider,
    geminiKey: body.gemini_key,
    geminiModel: body.gemini_model?.trim() || body.model?.trim() || "auto",
    ollamaModel: body.ollama_model?.trim() || "",
  };
}

export function validateAiConfig(config: AiRequestConfig): string | null {
  if (config.provider === "gemini") {
    if (!resolveUserGeminiApiKey(config.geminiKey)) {
      return "Add a valid Gemini API key in Settings and click Save.";
    }
    return null;
  }

  return null;
}
