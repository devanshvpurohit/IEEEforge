from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document_service import DocumentProcessor
from app.services.ai_service import AIService
import os

router = APIRouter(prefix="/v1/documents", tags=["documents"])
ai_service = AIService()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    extension = file.filename.split(".")[-1]
    if extension not in ["pdf", "docx", "txt", "md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    content = await file.read()
    text_content = await DocumentProcessor.extract_content(content, extension)
    
    if not text_content:
        raise HTTPException(status_code=500, detail="Failed to extract content")
    
    metadata = DocumentProcessor.get_metadata(text_content)
    analysis = await ai_service.analyze_document(text_content)
    
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
