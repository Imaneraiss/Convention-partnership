from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.comite import Comite, ComiteDestinataireExterne
from app.models.user import User
from app.schemas.comite import ComiteCreate, ComiteUpdate, ComiteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/comites", tags=["Comités"])

@router.get("/", response_model=List[ComiteResponse])
def get_comites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Comite).all()

@router.get("/{comite_id}", response_model=ComiteResponse)
def get_comite(comite_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    return comite

@router.post("/", response_model=ComiteResponse)
def create_comite(data: ComiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comite = Comite(
        type=data.type,
        frequence=data.frequence,
        convention_id=data.convention_id
    )
    # Ajouter destinataires internes
    if data.destinataires_internes:
        users = db.query(User).filter(User.id.in_(data.destinataires_internes)).all()
        comite.destinataires_internes = users
    db.add(comite)
    db.commit()
    # Ajouter destinataires externes
    for email in data.destinataires_externes:
        externe = ComiteDestinataireExterne(comite_id=comite.id, email=email)
        db.add(externe)
    db.commit()
    db.refresh(comite)
    return comite

@router.put("/{comite_id}", response_model=ComiteResponse)
def update_comite(comite_id: UUID, data: ComiteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(comite, key, value)
    db.commit()
    db.refresh(comite)
    return comite

@router.delete("/{comite_id}")
def delete_comite(comite_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    db.delete(comite)
    db.commit()
    return {"message": "Comité supprimé avec succès"}