from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import os
from datetime import datetime

from services.parser import parse_document
from services.builder import build_document
from routers.template import TEMPLATE_PATH

router = APIRouter()

class GenerateRequest(BaseModel):
    selected_ids: List[str]

@router.get("/structure")
def get_structure():
    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(status_code=404, detail="Template not found")
    
    tree = parse_document(TEMPLATE_PATH)
    return tree

@router.post("/generate")
def generate_document(req: GenerateRequest):
    if not os.path.exists(TEMPLATE_PATH):
        raise HTTPException(status_code=404, detail="Template not found")
    
    result_stream = build_document(TEMPLATE_PATH, req.selected_ids)
    
    today = datetime.now().strftime("%Y-%m-%d")
    return StreamingResponse(
        result_stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="offerta_{today}.docx"'}
    )
