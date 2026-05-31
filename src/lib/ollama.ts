export const OLLAMA_HOST_CANDIDATES = [
  "http://127.0.0.1:11434",
  "http://localhost:11434",
] as const;

export interface OllamaDiscovery {
  baseUrl: string;
  models: string[];
}

export async function discoverOllamaServer(): Promise<OllamaDiscovery | null> {
  for (const baseUrl of OLLAMA_HOST_CANDIDATES) {
    try {
      const tags = await fetchOllamaTags(baseUrl);
      if (tags !== null) {
        return { baseUrl, models: tags };
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchOllamaTags(baseUrl: string): Promise<string[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      models?: Array<{ name: string }>;
    };

    return (data.models ?? []).map((m) => m.name).filter(Boolean);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonFromText(text: string): Record<string, unknown> {
  // Remove markdown code blocks if present
  const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Ollama returned an invalid response. Try a model that supports instructions.");
  }
  
  let jsonStr = jsonMatch[0];
  
  // Fix common JSON issues more aggressively
  // Remove trailing commas before closing brackets/braces
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
  // Fix multiple trailing commas
  jsonStr = jsonStr.replace(/,+(\s*[}\]])/g, '$1');
  // Remove comments (// or /* */)
  jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
  jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
  // Fix unescaped quotes in strings (basic attempt)
  jsonStr = jsonStr.replace(/([^\\])"([^"]*)"([^:])/g, '$1\\"$2\\"$3');
  // Fix single quotes to double quotes
  jsonStr = jsonStr.replace(/'/g, '"');
  // Remove any non-printable characters
  jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch (parseErr) {
    console.error("Ollama JSON parse error:", parseErr);
    console.error("Attempted to parse:", jsonStr.substring(0, 1000));
    
    // Last resort: try to extract just the papers array
    try {
      const papersMatch = jsonStr.match(/"papers"\s*:\s*\[([\s\S]*)\]/);
      if (papersMatch) {
        const papersJson = `{"papers":[${papersMatch[1]}]}`;
        return JSON.parse(papersJson) as Record<string, unknown>;
      }
    } catch {
      // If that also fails, throw the original error
    }
    
    throw new Error("Ollama returned malformed JSON. Try Gemini for better results, or use the fallback papers.");
  }
}

interface OllamaChatOptions {
  numPredict?: number;
}

async function ollamaChat(
  baseUrl: string,
  model: string,
  prompt: string,
  useJsonFormat: boolean,
  options?: OllamaChatOptions
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        num_predict: options?.numPredict ?? 8192,
        temperature: 0.35,
      },
    };
    if (useJsonFormat) {
      body.format = "json";
    }

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        errBody.includes("not found")
          ? `Ollama model "${model}" is not installed. Run: ollama pull ${model.split(":")[0]}`
          : `Ollama request failed (${res.status}). Is \`ollama serve\` running?`
      );
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content;
    if (!content) {
      throw new Error("Ollama returned an empty response.");
    }
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Ollama request timed out. Try a smaller document or faster model.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function ollamaGenerateJson(
  baseUrl: string,
  model: string,
  prompt: string,
  options?: OllamaChatOptions
): Promise<Record<string, unknown>> {
  const trimmedModel = model.trim();
  if (!trimmedModel) {
    throw new Error("Select an Ollama model in Settings.");
  }

  try {
    const text = await ollamaChat(baseUrl, trimmedModel, prompt, true, options);
    return parseJsonFromText(text);
  } catch (jsonFormatError) {
    const message = extractOllamaError(jsonFormatError);
    if (!message.includes("format") && !message.includes("json")) {
      throw jsonFormatError;
    }
  }

  const text = await ollamaChat(baseUrl, trimmedModel, prompt, false, options);
  return parseJsonFromText(text);
}

function extractOllamaError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
