from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.models.alerte import Alerte
from app.models.user import User
from app.models.convention import Convention
from app.models.comite import Comite
from app.models.reunion import Reunion
from app.schemas.alerte import AlerteCreate, AlerteUpdate, AlerteResponse
from app.auth import get_current_user, require_role
from app.services.email_service import EmailService

router = APIRouter(prefix="/api/alertes", tags=["Alertes"])

# ============================================
# ROUTES EXISTANTES (CRUD)
# ============================================

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

# ============================================
# NOUVELLES ROUTES (ALERTES AUTOMATIQUES)
# ============================================

@router.post("/check-expiration")
async def check_expiration_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CHARGE"))
):
    """Vérifier et envoyer les alertes d'expiration (T-3, T-2, T-1)"""
    email_service = EmailService()
    today = datetime.now().date()
    
    conventions = db.query(Convention).filter(
        Convention.date_expiration.isnot(None)
    ).all()
    
    alerts_sent = []
    
    for convention in conventions:
        if convention.date_expiration:
            diff = (convention.date_expiration - today).days
            
            rappel_type = None
            if 0 <= diff <= 30:
                rappel_type = "T-1"
            elif 31 <= diff <= 60:
                rappel_type = "T-2"
            elif 61 <= diff <= 90:
                rappel_type = "T-3"
            
            if rappel_type:
                existing = db.query(Alerte).filter(
                    Alerte.convention_id == convention.id,
                    Alerte.objet.like(f"%{rappel_type}%")
                ).first()
                
                if not existing:
                    comites = db.query(Comite).filter(
                        Comite.convention_id == convention.id
                    ).all()
                    
                    if comites:
                        success = email_service.send_expiration_alert(
                            convention, comites, rappel_type
                        )
                        
                        alerte = Alerte(
                            convention_id=convention.id,
                            type_alerte="FIN_CONVENTION",
                            objet=f"{rappel_type} avant expiration - {convention.intitule}",
                            date_declenchement=datetime.now(),
                            envoyee=success,
                            traitee=success
                        )
                        db.add(alerte)
                        alerts_sent.append({
                            "convention_id": str(convention.id),
                            "convention": convention.intitule,
                            "rappel": rappel_type,
                            "success": success
                        })
    
    db.commit()
    return {
        "message": "Vérification des expirations terminée",
        "alertes_envoyees": alerts_sent
    }


@router.post("/check-reunions")
async def check_reunion_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CHARGE"))
):
    """Vérifier et envoyer les alertes de réunion (J-7)"""
    email_service = EmailService()
    today = datetime.now().date()
    alert_date = today + timedelta(days=7)
    
    reunions = db.query(Reunion).filter(
        Reunion.date_reunion >= today,
        Reunion.date_reunion <= alert_date
    ).all()
    
    alerts_sent = []
    
    for reunion in reunions:
        existing = db.query(Alerte).filter(
            Alerte.reunion_id == reunion.id,
            Alerte.type_alerte == "REUNION_COMITE"
        ).first()
        
        if not existing:
            comite = db.query(Comite).filter(
                Comite.id == reunion.comite_id
            ).first()
            
            convention = db.query(Convention).filter(
                Convention.id == comite.convention_id
            ).first()
            
            if comite and convention:
                success = email_service.send_reunion_alert(comite, reunion, convention)
                
                alerte = Alerte(
                    convention_id=convention.id,
                    type_alerte="REUNION_COMITE",
                    objet=f"Réunion du comité {comite.nom} - {reunion.date_reunion}",
                    date_declenchement=datetime.now(),
                    envoyee=success,
                    traitee=success
                )
                db.add(alerte)
                alerts_sent.append({
                    "reunion_id": str(reunion.id),
                    "comite": comite.nom,
                    "date_reunion": str(reunion.date_reunion),
                    "success": success
                })
    
    db.commit()
    return {
        "message": "Vérification des réunions terminée",
        "alertes_envoyees": alerts_sent
    }


@router.post("/manuelle")
async def send_manual_alert(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CHARGE"))
):
    """
    Envoyer une alerte manuelle personnalisée
    """
    email_service = EmailService()
    
    emails = data.get("emails", [])
    sujet = data.get("sujet", "")
    corps = data.get("corps", "")
    convention_id = data.get("convention_id")
    
    if not emails:
        raise HTTPException(status_code=400, detail="Au moins un email est requis")
    if not sujet or not corps:
        raise HTTPException(status_code=400, detail="Sujet et corps sont requis")
    
    success = email_service.send_manual_alert(emails, sujet, corps)
    
    if convention_id:
        alerte = Alerte(
            convention_id=convention_id,
            type_alerte="MANUELLE",
            objet=sujet,
            date_declenchement=datetime.now(),
            envoyee=success,
            traitee=success
        )
        db.add(alerte)
        db.commit()
    
    return {
        "message": "Alerte manuelle envoyée" if success else "Erreur lors de l'envoi",
        "success": success
    }


@router.get("/stats")
async def get_alertes_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Statistiques des alertes"""
    total = db.query(Alerte).count()
    envoyees = db.query(Alerte).filter(Alerte.envoyee == True).count()
    non_envoyees = db.query(Alerte).filter(Alerte.envoyee == False).count()
    traitees = db.query(Alerte).filter(Alerte.traitee == True).count()
    
    return {
        "total": total,
        "envoyees": envoyees,
        "non_envoyees": non_envoyees,
        "traitees": traitees,
        "en_attente": total - traitees
    }