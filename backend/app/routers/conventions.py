from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.convention import Convention
from app.models.user import User
from app.schemas.convention import ConventionCreate, ConventionUpdate, ConventionResponse
from app.auth import get_current_user

router = APIRouter(
    prefix="/api/conventions",
    tags=["Conventions"]
)

# ✅ GET — Liste toutes les conventions
@router.get("/", response_model=List[ConventionResponse])
def get_conventions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conventions = db.query(Convention).all()
    return conventions

# ✅ GET — Détail d'une convention
@router.get("/{convention_id}", response_model=ConventionResponse)
def get_convention(convention_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    return convention

# ✅ POST — Créer une convention numérotée
@router.post("/", response_model=ConventionResponse)
def create_convention(data: ConventionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    annee = datetime.now().year
    derniere = db.query(Convention)\
        .filter(extract('year', Convention.date_signature) == annee)\
        .order_by(Convention.numero_reference.desc())\
        .first()
    numero = 1 if not derniere else int(derniere.numero_reference.split('/')[0]) + 1

    convention = Convention(**data.model_dump())
    convention.numero_reference = f"{numero:02d}/{annee}"
    db.add(convention)
    db.commit()
    db.refresh(convention)
    return convention

# ✅ PUT — Modifier une convention
@router.put("/{convention_id}", response_model=ConventionResponse)
def update_convention(convention_id: UUID, data: ConventionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(convention, key, value)
    db.commit()
    db.refresh(convention)
    return convention

# ✅ DELETE — Supprimer une convention
@router.delete("/{convention_id}")
def delete_convention(convention_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    db.delete(convention)
    db.commit()
    return {"message": "Convention supprimée avec succès"}