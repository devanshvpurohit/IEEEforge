import { NextResponse } from "next/server";
import { discoverOllamaServer } from "@/lib/ollama";

export async function GET() {
  try {
    const discovery = await discoverOllamaServer();
    if (!discovery) {
      return NextResponse.json({
        connected: false,
        baseUrl: null,
        models: [],
        message: "Ollama not found. Run `ollama serve` on this machine.",
      });
    }

    return NextResponse.json({
      connected: true,
      baseUrl: discovery.baseUrl,
      models: discovery.models,
      message:
        discovery.models.length > 0
          ? `Found ${discovery.models.length} model(s) on ${discovery.baseUrl}`
          : "Ollama is running but no models are installed. Run `ollama pull llama3.2`.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Discovery failed";
    return NextResponse.json(
      { connected: false, baseUrl: null, models: [], message },
      { status: 500 }
    );
  }
}
