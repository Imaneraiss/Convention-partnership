from sqlalchemy.orm import Session
from fastapi import Request
from app.models.historique import Historique
from app.schemas.historique import HistoriqueCreate
from datetime import datetime, date
import json
from uuid import UUID  


class HistoriqueService:
    def __init__(self, db: Session):
        self.db = db
    
    def _normalize_action(self, action: str) -> str:
        """Normaliser le nom de l'action en minuscules"""
        if not action:
            return "autre"
        
        # ✅ Mapping des actions
        action_map = {
            'CREATION_CONVENTION': 'creation',
            'CREATION_COMITE': 'creation',
            'CREATION_BUDGET': 'creation',
            'CREATION_ALERTE': 'creation',
            'CREATION_PARTENAIRE': 'creation',
            'MODIFICATION_CONVENTION': 'modification',
            'MODIFICATION_COMITE': 'modification',
            'MODIFICATION_BUDGET': 'modification',
            'MODIFICATION_ALERTE': 'modification',
            'MODIFICATION_PARTENAIRE': 'modification',
            'UPLOAD_FICHIER': 'upload',
            'UPLOAD_PV': 'upload',
            'SUPPRESSION_CONVENTION': 'suppression',
            'SUPPRESSION_COMITE': 'suppression',
            'SUPPRESSION_BUDGET': 'suppression',
            'SUPPRESSION_ALERTE': 'suppression',
            'SUPPRESSION_FICHIER': 'suppression',
            'SUPPRESSION_PARTENAIRE': 'suppression',
        }
        
        # ✅ Normaliser
        normalized = action_map.get(action.upper(), action.lower())
        return normalized
    
    def log_action(
        self,
        user_id: str,
        action: str,
        description: str = None,
        details: dict = None,
        convention_id: str = None,
        request: Request = None,
        statut: str = "success"
    ):  
        try:
            # ✅ Normaliser l'action (sans log pour éviter la pollution)
            normalized_action = self._normalize_action(action)
            
            # ✅ Convertir les détails en JSON
            details_json = None
            if details:
                def convert_to_serializable(obj):
                    if isinstance(obj, datetime):
                        return obj.isoformat()
                    elif isinstance(obj, date):
                        return obj.isoformat()
                    elif isinstance(obj, UUID):
                        return str(obj)
                    elif isinstance(obj, list):
                        return [convert_to_serializable(item) for item in obj]
                    elif isinstance(obj, dict):
                        return {k: convert_to_serializable(v) for k, v in obj.items()}
                    elif hasattr(obj, '__dict__'):
                        return str(obj)
                    else:
                        return obj
                
                details_json = json.dumps(convert_to_serializable(details), ensure_ascii=False)
            
            historique = Historique(
                user_id=user_id,
                action=normalized_action,
                description=description,
                details=details_json,
                convention_id=convention_id,
                ip_address=request.client.host if request and request.client else None,
                user_agent=request.headers.get("user-agent") if request else None,
                statut=statut,
                date_action=datetime.utcnow()
            )
            self.db.add(historique)
            self.db.commit()
            self.db.refresh(historique)
            return historique
        except Exception as e:
            print(f"❌ Erreur log historique: {e}")
            self.db.rollback()
            return None