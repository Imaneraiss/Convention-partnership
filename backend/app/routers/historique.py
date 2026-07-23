from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.historique import Historique
from app.models.user import User
from app.auth import require_admin

router = APIRouter(prefix="/api/historique", tags=["Historique"])

# GET — Tout l'historique (admin only)
@router.get("/")
def get_historique(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    historique = db.query(Historique).order_by(
        Historique.date_action.desc()
    ).all()
    
    result = []
    for h in historique:
        user = db.query(User).filter(User.id == h.user_id).first()
        result.append({
            "id": str(h.id),
            "action": h.action,
            "details": h.details,
            "date_action": h.date_action,
            "convention_id": str(h.convention_id) if h.convention_id else None,
            "user_nom": user.nom if user else "Inconnu",
            "user_email": user.email if user else "Inconnu"
        })
    return result

# GET — Historique par utilisateur
@router.get("/user/{user_id}")
def get_historique_by_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    historique = db.query(Historique).filter(
        Historique.user_id == user_id
    ).order_by(Historique.date_action.desc()).all()
    return historique