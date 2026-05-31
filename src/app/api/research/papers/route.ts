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
  return `You are an IEEE academic research assistant. Generate 6 relevant research papers based on these details:

Paper title: "${title || "Untitled"}"
Research domain: "${domain || "General engineering"}"
Key topics: "${topics || "technology, research"}"

You MUST respond with ONLY this exact JSON structure, nothing else:

{"papers":[{"title":"Paper Title 1","authors":"Author A, Author B","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00001"},{"title":"Paper Title 2","authors":"Author C, Author D","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00002"},{"title":"Paper Title 3","authors":"Author E, Author F","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00003"},{"title":"Paper Title 4","authors":"Author G, Author H","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00004"},{"title":"Paper Title 5","authors":"Author I, Author J","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00005"},{"title":"Paper Title 6","authors":"Author K, Author L","venue":"IEEE Conference or Journal","year":"2023","relevance":"Why this paper is relevant.","url":"https://arxiv.org/abs/2301.00006"}]}

CRITICAL RULES:
1. Return ONLY the JSON object above, no other text
2. NO markdown, NO code blocks, NO explanations
3. Replace the example data with real papers related to the topic
4. Keep the exact same structure
5. All 6 papers must be included
6. Years must be 2018-2024
7. URLs must be valid arXiv or IEEE Xplore links`;
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
    try {
      if (config.provider === "ollama") {
        raw = await generateWithOllama(prompt, config.ollamaModel ?? "");
      } else {
        const apiKey = resolveUserGeminiApiKey(config.geminiKey);
        if (!apiKey) return NextResponse.json({ error: "Missing Gemini API key" }, { status: 401 });
        raw = await generateWithGemini(prompt, apiKey);
      }
    } catch (aiError) {
      console.error("AI generation failed:", aiError);
      // Return fallback papers if AI fails
      const fallbackPapers = generateFallbackPapers(body.topics ?? "", body.domain ?? "", body.title ?? "");
      return NextResponse.json({ 
        papers: fallbackPapers,
        warning: "Using example papers - AI generation failed. Try again for personalized results."
      });
    }

    const papers = Array.isArray(raw.papers) ? raw.papers : [];
    return NextResponse.json({ papers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch related papers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function generateFallbackPapers(topics: string, domain: string, _title: string): ResearchPaper[] {
  const domainKeyword = domain || topics || "technology";
  return [
    {
      title: `Deep Learning Approaches in ${domainKeyword}: A Comprehensive Survey`,
      authors: "Smith, J., Johnson, A., Williams, B.",
      venue: "IEEE Transactions on Neural Networks and Learning Systems",
      year: "2023",
      relevance: `Provides foundational understanding of deep learning techniques applicable to ${domainKeyword} research.`,
      url: "https://arxiv.org/abs/2301.00001"
    },
    {
      title: `Recent Advances in ${domainKeyword} Systems and Applications`,
      authors: "Chen, L., Kumar, R., Anderson, M.",
      venue: "IEEE International Conference on Computer Vision (ICCV)",
      year: "2023",
      relevance: `Discusses state-of-the-art methods and practical implementations in ${domainKeyword}.`,
      url: "https://arxiv.org/abs/2302.00002"
    },
    {
      title: `Machine Learning for ${domainKeyword}: Methods and Best Practices`,
      authors: "Garcia, P., Lee, S., Brown, K.",
      venue: "IEEE Transactions on Pattern Analysis and Machine Intelligence",
      year: "2022",
      relevance: `Covers essential machine learning techniques relevant to ${domainKeyword} applications.`,
      url: "https://arxiv.org/abs/2203.00003"
    },
    {
      title: `Optimization Techniques in Modern ${domainKeyword} Research`,
      authors: "Taylor, D., Martinez, C., Wilson, E.",
      venue: "NeurIPS - Neural Information Processing Systems",
      year: "2023",
      relevance: `Presents optimization strategies that can improve ${domainKeyword} system performance.`,
      url: "https://arxiv.org/abs/2305.00004"
    },
    {
      title: `A Survey of ${domainKeyword} Architectures and Frameworks`,
      authors: "Thompson, R., Davis, N., Moore, H.",
      venue: "IEEE Access",
      year: "2022",
      relevance: `Reviews various architectural approaches and frameworks used in ${domainKeyword}.`,
      url: "https://arxiv.org/abs/2204.00005"
    },
    {
      title: `Future Directions in ${domainKeyword}: Challenges and Opportunities`,
      authors: "White, J., Harris, T., Clark, L.",
      venue: "IEEE Transactions on Emerging Topics in Computing",
      year: "2024",
      relevance: `Identifies emerging trends and future research directions in ${domainKeyword}.`,
      url: "https://arxiv.org/abs/2401.00006"
    }
  ];
}
