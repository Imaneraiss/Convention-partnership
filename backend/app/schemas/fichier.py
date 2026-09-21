from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

# Schema pour retourner un fichier au frontend
class FichierResponse(BaseModel):
    id: UUID
    nom_fichier: str
    type_fichier: Optional[str] = None
    taille: Optional[int] = None  # ✅ AJOUTER ce champ
    chemin: str
    uploaded_at: datetime
    convention_id: Optional[UUID] = None
    budget_id: Optional[UUID] = None
    comite_id: Optional[UUID] = None

    class Config:
        from_attributes = True