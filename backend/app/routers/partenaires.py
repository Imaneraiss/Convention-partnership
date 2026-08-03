from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.partenaire import Partenaire
from app.models.user import User
from app.schemas.partenaire import PartenaireCreate, PartenaireUpdate, PartenaireResponse
from app.auth import get_current_user

router = APIRouter(
    prefix="/api/partenaires",
    tags=["Partenaires"]
)

#   GET — Liste tous les partenaires
@router.get("/", response_model=List[PartenaireResponse])
def get_partenaires(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partenaires = db.query(Partenaire).all()
    return partenaires

#   GET — Détail d'un partenaire
@router.get("/{partenaire_id}", response_model=PartenaireResponse)
def get_partenaire(partenaire_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partenaire = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
    if not partenaire:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    return partenaire

#   POST — Créer un partenaire
@router.post("/", response_model=PartenaireResponse)
def create_partenaire(data: PartenaireCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partenaire = Partenaire(**data.model_dump())
    db.add(partenaire)
    db.commit()
    db.refresh(partenaire)
    return partenaire

#   PUT — Modifier un partenaire
@router.put("/{partenaire_id}", response_model=PartenaireResponse)
def update_partenaire(partenaire_id: UUID, data: PartenaireUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partenaire = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
    if not partenaire:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(partenaire, key, value)
    db.commit()
    db.refresh(partenaire)
    return partenaire

#   DELETE — Supprimer un partenaire
@router.delete("/{partenaire_id}")
def delete_partenaire(partenaire_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    partenaire = db.query(Partenaire).filter(Partenaire.id == partenaire_id).first()
    if not partenaire:
        raise HTTPException(status_code=404, detail="Partenaire non trouvé")
    db.delete(partenaire)
    db.commit()
    return {"message": "Partenaire supprimé avec succès"}