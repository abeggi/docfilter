import os
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TEMPLATE_PATH = os.path.join(DATA_DIR, "template.docx")

@router.get("/info")
def get_template_info():
    if not os.path.exists(TEMPLATE_PATH):
        return {"name": None, "upload_date": None, "size_bytes": 0}
    
    stat = os.stat(TEMPLATE_PATH)
    return {
        "name": "template.docx",
        "upload_date": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "size_bytes": stat.st_size
    }

@router.post("/upload")
async def upload_template(file: UploadFile = File(...)):
    if not file.filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")
    
    os.makedirs(DATA_DIR, exist_ok=True)
    
    with open(TEMPLATE_PATH, "wb") as f:
        content = await file.read()
        f.write(content)
        
    stat = os.stat(TEMPLATE_PATH)
    return {
        "message": "Template uploaded successfully",
        "name": "template.docx",
        "upload_date": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "size_bytes": stat.st_size
    }
