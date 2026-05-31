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

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanation, no trailing commas.

{
  "papers": [
    {
      "title": "Full paper title",
      "authors": "First Author, Second Author et al.",
      "venue": "IEEE Transactions on or Conference name",
      "year": "2023",
      "relevance": "One sentence explaining why this paper is relevant.",
      "url": "https://arxiv.org/abs/2301.00000"
    }
  ]
}

STRICT RULES:
- Return exactly 6 papers in the array
- NO trailing commas after last array element
- NO special characters in strings that need escaping
- Papers from 2018-2024 only
- Use real, plausible IEEE/arXiv paper titles
- relevance must be ONE sentence only
- Prefer IEEE Transactions, CVPR, ICCV, NeurIPS, ICML, ICLR, AAAI
- url format: https://arxiv.org/abs/XXXX.XXXXX or https://ieeexplore.ieee.org/document/XXXXXXX
- Ensure all JSON is properly formatted with no syntax errors`;
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<Record<string, unknown>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { 
          maxOutputTokens: 2048, 
          temperature: 0.3,
          responseMimeType: "application/json"
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON object
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      
      let jsonStr = match[0];
      
      // Fix common JSON issues
      // Remove trailing commas before closing brackets
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      // Fix escaped quotes issues
      jsonStr = jsonStr.replace(/\\"/g, '"');
      
      try {
        return JSON.parse(jsonStr) as Record<string, unknown>;
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        console.error("Attempted to parse:", jsonStr.substring(0, 500));
        throw new Error("AI returned invalid JSON format");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("not found") || msg.includes("404") || msg.includes("not supported")) continue;
      if (msg.includes("JSON")) throw err;
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
