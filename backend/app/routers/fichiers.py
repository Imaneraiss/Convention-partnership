from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os, shutil, uuid
from app.database import get_db
from app.models.fichier import Fichier
from app.models.user import User
from app.schemas.fichier import FichierResponse
from app.auth import get_current_user
from app.services.ocr_service import process_document

router = APIRouter(prefix="/api/fichiers", tags=["Fichiers"])

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

@router.post("/upload", response_model=FichierResponse)
def upload_fichier(
    file: UploadFile = File(...),
    convention_id: Optional[UUID] = None,
    reunion_id: Optional[UUID] = None,
    budget_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validation type de fichier
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé")

    # Organisation par dossier
    if convention_id:
        upload_dir = f"/app/uploads/conventions/{convention_id}"
    elif reunion_id:
        upload_dir = f"/app/uploads/reunions/{reunion_id}"
    elif budget_id:
        upload_dir = f"/app/uploads/budgets/{budget_id}"
    else:
        raise HTTPException(status_code=400, detail="Veuillez préciser une convention, réunion ou budget")

    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    fichier = Fichier(
        nom_fichier=file.filename,
        type_fichier=file.content_type,
        chemin=file_path,
        convention_id=convention_id,
        reunion_id=reunion_id,
        budget_id=budget_id
    )
    db.add(fichier)
    db.commit()
    db.refresh(fichier)
    return fichier

@router.get("/convention/{convention_id}", response_model=List[FichierResponse])
def get_fichiers_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Fichier).filter(Fichier.convention_id == convention_id).all()

@router.get("/reunion/{reunion_id}", response_model=List[FichierResponse])
def get_fichiers_reunion(
    reunion_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Fichier).filter(Fichier.reunion_id == reunion_id).all()

@router.get("/budget/{budget_id}", response_model=List[FichierResponse])
def get_fichiers_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Fichier).filter(Fichier.budget_id == budget_id).all()

@router.delete("/{fichier_id}")
def delete_fichier(
    fichier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fichier = db.query(Fichier).filter(Fichier.id == fichier_id).first()
    if not fichier:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    if os.path.exists(fichier.chemin):
        os.remove(fichier.chemin)
    db.delete(fichier)
    db.commit()
    return {"message": "Fichier supprimé avec succès"}


@router.post("/extract")
async def extract_convention(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Lit le fichier
    file_bytes = await file.read()
    
    # Traite le document
    result = process_document(file_bytes, file.content_type)
    
    return result