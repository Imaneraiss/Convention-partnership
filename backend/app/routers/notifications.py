from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.convention import Convention
from app.models.user import User
from app.auth import get_current_user
from app.services.email_service import EmailService

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.post("/sg-update/{convention_id}")
def notify_sg_update(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Notifie les chargés qu'un SG a modifié une convention (budget/justificatif)."""
    

    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    
    try:
        email_service = EmailService()
        success = email_service.send_sg_update_notification(
            convention=convention,
            sg_user=current_user
        )
        return {
            "success": success,
            "message": "Notification envoyée aux chargés" if success else "Aucun destinataire",
            "convention": convention.intitule
        }
    except Exception as e:
        print(f"❌ Erreur notification SG: {e}")
        return {"success": False, "message": f"Erreur: {str(e)}"}