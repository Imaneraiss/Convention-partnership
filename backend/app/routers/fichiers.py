from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import os, shutil, uuid
from app.database import get_db
from app.models.fichier import Fichier
from app.models.user import User
from app.schemas.fichier import FichierResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/fichiers", tags=["Fichiers"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=FichierResponse)
def upload_fichier(
    file: UploadFile = File(...),
    convention_id: UUID = None,
    reunion_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    fichier = Fichier(
        nom_fichier=file.filename,
        type_fichier=file.content_type,
        chemin=file_path,
        convention_id=convention_id,
        reunion_id=reunion_id
    )
    db.add(fichier)
    db.commit()
    db.refresh(fichier)
    return fichier

@router.get("/convention/{convention_id}", response_model=List[FichierResponse])
def get_fichiers_convention(convention_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Fichier).filter(Fichier.convention_id == convention_id).all()

@router.delete("/{fichier_id}")
def delete_fichier(fichier_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fichier = db.query(Fichier).filter(Fichier.id == fichier_id).first()
    if not fichier:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    if os.path.exists(fichier.chemin):
        os.remove(fichier.chemin)
    db.delete(fichier)
    db.commit()
    return {"message": "Fichier supprimé avec succès"}