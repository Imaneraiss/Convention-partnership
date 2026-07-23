from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.alerte import Alerte
from app.models.user import User
from app.schemas.alerte import AlerteCreate, AlerteUpdate, AlerteResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/alertes", tags=["Alertes"])

@router.get("/", response_model=List[AlerteResponse])
def get_alertes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Alerte).all()

@router.post("/", response_model=AlerteResponse)
def create_alerte(data: AlerteCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("CHARGE"))):
    alerte = Alerte(
        type_alerte="MANUELLE",
        date_declenchement=data.date_declenchement,
        objet=data.objet,
        convention_id=data.convention_id
    )
    if data.destinataires:
        users = db.query(User).filter(User.id.in_(data.destinataires)).all()
        alerte.destinataires = users
    db.add(alerte)
    db.commit()
    db.refresh(alerte)
    return alerte

@router.get("/convention/{convention_id}", response_model=List[AlerteResponse])
def get_alertes_by_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Alerte)\
             .filter(Alerte.convention_id == convention_id)\
             .all()

@router.put("/{alerte_id}", response_model=AlerteResponse)
def update_alerte(alerte_id: UUID, data: AlerteUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("CHARGE"))):
    alerte = db.query(Alerte).filter(Alerte.id == alerte_id).first()
    if not alerte:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    if alerte.type_alerte != "MANUELLE":
        raise HTTPException(status_code=403, detail="Impossible de modifier une alerte automatique")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(alerte, key, value)
    db.commit()
    db.refresh(alerte)
    return alerte

@router.patch("/{alerte_id}/traiter")
def traiter_alerte(alerte_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(require_role("CHARGE"))):
    alerte = db.query(Alerte).filter(Alerte.id == alerte_id).first()
    if not alerte:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    alerte.traitee = True
    db.commit()
    return {"message": "Alerte marquée comme traitée"}

