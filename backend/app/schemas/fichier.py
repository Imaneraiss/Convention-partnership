from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

# Schema pour retourner un fichier au frontend
class FichierResponse(BaseModel):
    id: UUID
    nom_fichier: str
    type_fichier: Optional[str] = None
    chemin: str
    uploaded_at: datetime
    convention_id: Optional[UUID] = None
    reunion_id: Optional[UUID] = None
    budget_id: Optional[UUID] = None

    class Config:
        from_attributes = True
        