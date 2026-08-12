from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import json

from app.database import get_db
from app.models.historique import Historique
from app.models.user import User
from app.models.convention import Convention
from app.schemas.historique import HistoriqueCreate, HistoriqueResponse
from app.auth import get_current_user
from app.services.historique_service import HistoriqueService

router = APIRouter(prefix="/api/historique", tags=["Historique"])

# ─── GET - Tout l'historique ───
@router.get("/", response_model=List[HistoriqueResponse])
def get_historique(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    historique = db.query(Historique).order_by(
        Historique.date_action.desc()
    ).all()
    
    result = []
    for h in historique:
        user = db.query(User).filter(User.id == h.user_id).first() if h.user_id else None
        convention = db.query(Convention).filter(Convention.id == h.convention_id).first() if h.convention_id else None
        
        # ✅ Gérer details : si c'est une string JSON, la parser
        details = h.details
        if isinstance(details, str):
            try:
                details = json.loads(details)
            except (json.JSONDecodeError, TypeError):
                # Si ce n'est pas du JSON valide, garder comme string
                pass
        
        result.append({
            "id": h.id,
            "action": h.action,
            "description": h.description,
            "details": details,  # ✅ Peut être dict ou string
            "date_action": h.date_action,
            "user_id": h.user_id,
            "convention_id": h.convention_id,
            "ip_address": h.ip_address,
            "statut": h.statut,
            "utilisateur_nom": user.nom if user else "Inconnu",
            "utilisateur_email": user.email if user else "Inconnu",
            "convention_intitule": convention.intitule if convention else None
        })
    
    return result

# ─── GET - Par utilisateur ───
@router.get("/user/{user_id}", response_model=List[HistoriqueResponse])
def get_historique_by_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    historique = db.query(Historique).filter(
        Historique.user_id == user_id
    ).order_by(Historique.date_action.desc()).all()
    
    result = []
    for h in historique:
        user = db.query(User).filter(User.id == h.user_id).first() if h.user_id else None
        convention = db.query(Convention).filter(Convention.id == h.convention_id).first() if h.convention_id else None
        
        details = h.details
        if isinstance(details, str):
            try:
                details = json.loads(details)
            except (json.JSONDecodeError, TypeError):
                pass
        
        result.append({
            "id": h.id,
            "action": h.action,
            "description": h.description,
            "details": details,
            "date_action": h.date_action,
            "user_id": h.user_id,
            "convention_id": h.convention_id,
            "ip_address": h.ip_address,
            "statut": h.statut,
            "utilisateur_nom": user.nom if user else "Inconnu",
            "utilisateur_email": user.email if user else "Inconnu",
            "convention_intitule": convention.intitule if convention else None
        })
    
    return result

# ─── GET - Par convention ───
@router.get("/convention/{convention_id}", response_model=List[HistoriqueResponse])
def get_historique_by_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    historique = db.query(Historique).filter(
        Historique.convention_id == convention_id
    ).order_by(Historique.date_action.desc()).all()
    
    result = []
    for h in historique:
        user = db.query(User).filter(User.id == h.user_id).first() if h.user_id else None
        convention = db.query(Convention).filter(Convention.id == h.convention_id).first() if h.convention_id else None
        
        details = h.details
        if isinstance(details, str):
            try:
                details = json.loads(details)
            except (json.JSONDecodeError, TypeError):
                pass
        
        result.append({
            "id": h.id,
            "action": h.action,
            "description": h.description,
            "details": details,
            "date_action": h.date_action,
            "user_id": h.user_id,
            "convention_id": h.convention_id,
            "ip_address": h.ip_address,
            "statut": h.statut,
            "utilisateur_nom": user.nom if user else "Inconnu",
            "utilisateur_email": user.email if user else "Inconnu",
            "convention_intitule": convention.intitule if convention else None
        })
    
    return result

# ─── POST - Création automatique ───
@router.post("/", response_model=HistoriqueResponse)
def create_historique(
    data: HistoriqueCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # ✅ Si details est un dict, le convertir en string JSON pour le stockage
    details = data.details
    if isinstance(details, dict):
        details = json.dumps(details)
    
    historique = Historique(
        action=data.action,
        description=data.description,
        details=details,
        user_id=current_user.id,
        convention_id=data.convention_id,
        ip_address=ip_address,
        user_agent=user_agent,
        statut="success"
    )
    db.add(historique)
    db.commit()
    db.refresh(historique)
    
    # Enrichir la réponse
    user = db.query(User).filter(User.id == historique.user_id).first()
    convention = db.query(Convention).filter(Convention.id == historique.convention_id).first() if historique.convention_id else None
    
    # ✅ Retourner details comme dict si c'était un dict
    return_details = data.details if isinstance(data.details, dict) else historique.details
    
    return {
        "id": historique.id,
        "action": historique.action,
        "description": historique.description,
        "details": return_details,
        "date_action": historique.date_action,
        "user_id": historique.user_id,
        "convention_id": historique.convention_id,
        "ip_address": historique.ip_address,
        "statut": historique.statut,
        "utilisateur_nom": user.nom if user else "Inconnu",
        "utilisateur_email": user.email if user else "Inconnu",
        "convention_intitule": convention.intitule if convention else None
    }