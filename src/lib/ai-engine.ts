import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeDocument(content: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  
  return JSON.parse(jsonMatch[0]);
}

export async function convertToIEEE(content: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Convert the following technical report into a structured IEEE research paper format.
    Extract and rewrite sections as necessary to meet IEEE standards.
    
    Content: ${content}
    
    Return exactly this JSON structure:
    {
        "title": "IEEE Paper Title",
        "abstract": "Formal academic abstract",
        "keywords": ["keyword1", "keyword2"],
        "sections": [
            { "title": "I. Introduction", "content": "..." },
            { "title": "II. Methodology", "content": "..." },
            { "title": "III. Results", "content": "..." },
            { "title": "IV. Conclusion", "content": "..." }
        ],
        "references": [
            "[1] Author, 'Title', Journal, Year."
        ]
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  
  return JSON.parse(jsonMatch[0]);
}
