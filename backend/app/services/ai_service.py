import os
import google.generativeai as genai
import requests
import json
from typing import Dict, Any

class AIService:
    def __init__(self):
        self.default_gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.default_ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    def _get_model(self, api_key: Optional[str] = None):
        key = api_key or self.default_gemini_api_key
        if key:
            genai.configure(api_key=key)
            return genai.GenerativeModel('gemini-pro')
        return None

    async def analyze_document(self, content: str, gemini_key: Optional[str] = None, ollama_url: Optional[str] = None, prefer_ollama: bool = False) -> Dict[str, Any]:
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
        
        current_ollama_url = ollama_url or self.default_ollama_base_url
        gemini_model = self._get_model(gemini_key)

        if prefer_ollama:
            try:
                return await self._call_ollama(prompt, current_ollama_url)
            except:
                if gemini_model:
                    return await self._call_gemini(prompt, gemini_model)
        else:
            if gemini_model:
                try:
                    return await self._call_gemini(prompt, gemini_model)
                except:
                    return await self._call_ollama(prompt, current_ollama_url)
            else:
                return await self._call_ollama(prompt, current_ollama_url)

    async def _call_gemini(self, prompt, model):
        response = model.generate_content(prompt)
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end])

    async def _call_ollama(self, prompt, url):
        response = requests.post(
            f"{url}/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json"
            },
            timeout=30
        )
        return json.loads(response.json().get("response", "{}"))

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
