from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.reunion import Reunion
from app.models.user import User
from app.schemas.reunion import ReunionCreate, ReunionUpdate, ReunionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/reunions", tags=["Réunions"])

@router.get("/", response_model=List[ReunionResponse])
def get_reunions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Reunion).all()

@router.post("/", response_model=ReunionResponse)
def create_reunion(data: ReunionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reunion = Reunion(**data.model_dump())
    db.add(reunion)
    db.commit()
    db.refresh(reunion)
    return reunion

@router.put("/{reunion_id}", response_model=ReunionResponse)
def update_reunion(reunion_id: UUID, data: ReunionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reunion = db.query(Reunion).filter(Reunion.id == reunion_id).first()
    if not reunion:
        raise HTTPException(status_code=404, detail="Réunion non trouvée")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(reunion, key, value)
    db.commit()
    db.refresh(reunion)
    return reunion

@router.delete("/{reunion_id}")
def delete_reunion(reunion_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reunion = db.query(Reunion).filter(Reunion.id == reunion_id).first()
    if not reunion:
        raise HTTPException(status_code=404, detail="Réunion non trouvée")
    db.delete(reunion)
    db.commit()
    return {"message": "Réunion supprimée avec succès"}