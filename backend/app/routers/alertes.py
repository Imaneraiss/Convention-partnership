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
# from app.models.reunion import Reunion  # ❌ SUPPRIMER
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
# ALERTES AUTOMATIQUES - VERSION CORRIGÉE
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
    """
    Vérifier et envoyer les alertes de réunion (J-7)
    ✅ VERSION CORRIGÉE - Utilise les réunions stockées dans Comite.reunions (JSON)
    """
    email_service = EmailService()
    today = datetime.now().date()
    alert_date = today + timedelta(days=7)
    
    # ✅ Récupérer tous les comités avec leurs réunions (stockées dans le JSON reunions)
    comites = db.query(Comite).all()
    
    alerts_sent = []
    
    for comite in comites:
        # ✅ Extraire les réunions du champ JSON
        reunions = comite.reunions or []
        
        for reunion in reunions:
            try:
                # ✅ Convertir la date de la réunion (format: 'YYYY-MM-DD')
                reunion_date = datetime.strptime(reunion.get('date', ''), '%Y-%m-%d').date()
                
                # ✅ Vérifier si la réunion est dans la fenêtre J-7
                if today <= reunion_date <= alert_date:
                    # ✅ Vérifier si une alerte existe déjà
                    existing = db.query(Alerte).filter(
                        Alerte.convention_id == comite.convention_id,
                        Alerte.objet.like(f"%Réunion du comité {comite.type}%"),
                        Alerte.type_alerte == "REUNION_COMITE"
                    ).first()
                    
                    if not existing:
                        # ✅ Récupérer la convention
                        convention = db.query(Convention).filter(
                            Convention.id == comite.convention_id
                        ).first()
                        
                        if convention:
                            # ✅ Envoyer l'alerte
                            success = email_service.send_reunion_alert(comite, reunion, convention)
                            
                            # ✅ Créer l'alerte en base
                            alerte = Alerte(
                                convention_id=convention.id,
                                type_alerte="REUNION_COMITE",
                                objet=f"Réunion du comité {comite.type} - {reunion_date}",
                                date_declenchement=datetime.now(),
                                envoyee=success,
                                traitee=success
                            )
                            db.add(alerte)
                            alerts_sent.append({
                                "comite_id": str(comite.id),
                                "comite": comite.type,
                                "date_reunion": str(reunion_date),
                                "success": success
                            })
            except (ValueError, TypeError):
                # ✅ Ignorer les réunions avec des dates invalides
                continue
    
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