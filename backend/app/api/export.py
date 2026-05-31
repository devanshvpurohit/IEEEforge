from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from app.services.export_service import ExportService
from typing import Dict, Any
import io

router = APIRouter(prefix="/v1/export", tags=["export"])

@router.post("/docx")
async def export_docx(data: Dict[str, Any] = Body(...)):
    try:
        file_stream = ExportService.generate_ieee_docx(data)
        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=ieee_paper.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.post("/latex")
async def export_latex(data: Dict[str, Any] = Body(...)):
    try:
        latex_content = ExportService.generate_ieee_latex(data)
        return {"latex": latex_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
