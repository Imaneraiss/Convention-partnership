from pydantic import BaseModel
from typing import Optional, Dict, Any, Union
from datetime import datetime
from uuid import UUID

# ─── CRÉATION ───
class HistoriqueCreate(BaseModel):
    action: str  # creation, modification, suppression, upload, download, consultation
    description: Optional[str] = None
    details: Optional[Union[Dict[str, Any], str, None]] = None  # ✅ Accepter dict OU string
    convention_id: Optional[UUID] = None

# ─── RÉPONSE ───
class HistoriqueResponse(BaseModel):
    id: UUID
    action: str
    description: Optional[str] = None
    details: Optional[Union[Dict[str, Any], str, None]] = None  # ✅ Accepter dict OU string
    date_action: datetime
    user_id: UUID
    convention_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    statut: Optional[str] = None
    
    # Champs pour le frontend (jointure)
    utilisateur_nom: Optional[str] = None
    utilisateur_email: Optional[str] = None
    convention_intitule: Optional[str] = None

    class Config:
        from_attributes = True