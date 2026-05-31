import os
import google.generativeai as genai
import requests
import json
from typing import Dict, Any

class AIService:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
        else:
            self.gemini_model = None

    async def analyze_document(self, content: str) -> Dict[str, Any]:
        prompt = f"""
        Analyze the following technical document and provide a JSON summary.
        Document Content: {content[:4000]}...
        
        Return exactly this JSON structure:
        {{
            "summary": "Short 2-3 sentence summary",
            "detected_sections": ["list", "of", "sections"],
            "research_domain": "Domain name",
            "technical_complexity": "Low/Medium/High",
            "missing_sections": ["sections", "to", "add"],
            "readiness_score": 0.0-1.0
        }}
        """
        
        if self.gemini_model:
            response = self.gemini_model.generate_content(prompt)
            try:
                # Basic parsing, might need cleaning
                text = response.text
                start = text.find('{')
                end = text.rfind('}') + 1
                return json.loads(text[start:end])
            except Exception as e:
                return {"error": f"Gemini parsing error: {str(e)}"}
        else:
            # Fallback to Ollama
            try:
                response = requests.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": "llama3",
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                return response.json().get("response", {})
            except Exception as e:
                return {"error": f"Ollama connection error: {str(e)}"}

    async def convert_to_ieee(self, content: str) -> Dict[str, Any]:
        prompt = f"""
        Convert the following technical report into a structured IEEE research paper format.
        Extract and rewrite sections as necessary.
        
        Content: {content}
        
        Return exactly this JSON structure:
        {{
            "title": "IEEE Paper Title",
            "abstract": "Formal academic abstract",
            "keywords": ["keyword1", "keyword2"],
            "sections": [
                {{ "title": "I. Introduction", "content": "..." }},
                {{ "title": "II. Methodology", "content": "..." }},
                {{ "title": "III. Results", "content": "..." }},
                {{ "title": "IV. Conclusion", "content": "..." }}
            ],
            "references": [
                "[1] Author, 'Title', Journal, Year."
            ]
        }}
        """
        # Similar logic for Gemini/Ollama as above
        pass
