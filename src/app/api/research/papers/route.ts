import { NextRequest, NextResponse } from "next/server";
import { parseAiRequestConfig, validateAiConfig } from "@/lib/ai-engine";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { resolveUserGeminiApiKey } from "@/lib/api-key";
import { discoverOllamaServer, ollamaGenerateJson } from "@/lib/ollama";
import { GEMINI_MODEL_CANDIDATES } from "@/lib/gemini-models";

export interface ResearchPaper {
  title: string;
  authors: string;
  venue: string;
  year: string;
  relevance: string;
  url: string;
}

function buildResearchPrompt(topics: string, domain: string, title: string): string {
  return `You are an IEEE academic research assistant. Given the following paper details, suggest 6 highly relevant related research papers.

Paper title: "${title || "Untitled"}"
Research domain: "${domain || "General engineering"}"
Key topics: "${topics || "technology, research"}"

Return ONLY valid JSON (no markdown, no explanation):
{
  "papers": [
    {
      "title": "Full paper title",
      "authors": "First Author, Second Author et al.",
      "venue": "IEEE Transactions on / Conference name",
      "year": "2023",
      "relevance": "One sentence explaining why this paper is relevant to the user's work.",
      "url": "https://arxiv.org/abs/... or https://ieeexplore.ieee.org/..."
    }
  ]
}

Rules:
- Return exactly 6 papers
- Papers should be from 2018-2024
- Use real, plausible IEEE/arXiv paper titles and venues
- relevance must specifically connect the cited paper to the user's topic
- Prefer papers from top IEEE venues: IEEE Transactions, CVPR, ICCV, NeurIPS, ICML, ICLR, AAAI, INFOCOM, etc.
- url should be a plausible arXiv or IEEE Xplore link`;
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<Record<string, unknown>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not found") || msg.includes("404") || msg.includes("not supported")) continue;
      throw err;
    }
  }
  throw new Error("No compatible Gemini model available");
}

async function generateWithOllama(prompt: string, ollamaModel: string): Promise<Record<string, unknown>> {
  const discovery = await discoverOllamaServer();
  if (!discovery) throw new Error("Ollama not reachable");
  return ollamaGenerateJson(discovery.baseUrl, ollamaModel || discovery.models[0] || "", prompt, { numPredict: 2048 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      provider?: string;
      gemini_key?: string;
      gemini_model?: string;
      ollama_model?: string;
      topics?: string;
      domain?: string;
      title?: string;
    };

    const config = parseAiRequestConfig(body);
    const configError = validateAiConfig(config);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 400 });
    }

    const prompt = buildResearchPrompt(body.topics ?? "", body.domain ?? "", body.title ?? "");

    let raw: Record<string, unknown>;
    if (config.provider === "ollama") {
      raw = await generateWithOllama(prompt, config.ollamaModel ?? "");
    } else {
      const apiKey = resolveUserGeminiApiKey(config.geminiKey);
      if (!apiKey) return NextResponse.json({ error: "Missing Gemini API key" }, { status: 401 });
      raw = await generateWithGemini(prompt, apiKey);
    }

    const papers = Array.isArray(raw.papers) ? raw.papers : [];
    return NextResponse.json({ papers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch related papers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
