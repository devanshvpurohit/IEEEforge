from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.document_service import DocumentProcessor
from app.services.ai_service import AIService
from typing import Optional
import os

router = APIRouter(prefix="/v1/documents", tags=["documents"])
ai_service = AIService()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    gemini_key: Optional[str] = Form(None),
    ollama_url: Optional[str] = Form(None),
    prefer_ollama: Optional[str] = Form("false")
):
    extension = file.filename.split(".")[-1]
    if extension not in ["pdf", "docx", "txt", "md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    content = await file.read()
    text_content = await DocumentProcessor.extract_content(content, extension)
    
    if not text_content:
        raise HTTPException(status_code=500, detail="Failed to extract content")
    
    is_prefer_ollama = prefer_ollama.lower() == "true"
    
    metadata = DocumentProcessor.get_metadata(text_content)
    analysis = await ai_service.analyze_document(
        text_content, 
        gemini_key=gemini_key, 
        ollama_url=ollama_url, 
        prefer_ollama=is_prefer_ollama
    )
    
    return {
        "filename": file.filename,
        "metadata": metadata,
        "analysis": analysis,
        "content_preview": text_content[:1000]
    }

@router.post("/convert")
async def convert_document(content: str):
    # This would typically take a document ID and fetch from DB
    result = await ai_service.convert_to_ieee(content)
    return result
