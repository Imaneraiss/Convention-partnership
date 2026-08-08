from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID

# Schema pour créer un comité
class ComiteCreate(BaseModel):
    type: str  # PILOTAGE, SUIVI, TECHNIQUE, SCIENTIFIQUE
    frequence: Optional[str] = None
    convention_id: UUID
    destinataires_internes: List[UUID] = []  # liste des user_id
    destinataires_externes: List[EmailStr] = []  # liste des emails externes
    taches: List[str] = []  # ✅ AJOUTER : liste des tâches du comité

# Schema pour modifier un comité
class ComiteUpdate(BaseModel):
    type: Optional[str] = None
    frequence: Optional[str] = None
    destinataires_internes: Optional[List[UUID]] = None
    destinataires_externes: Optional[List[EmailStr]] = None
    taches: Optional[List[str]] = None  # ✅ AJOUTER : liste des tâches du comité

# Schema pour retourner un comité au frontend
class ComiteResponse(BaseModel):
    id: UUID
    type: str
    frequence: Optional[str] = None
    convention_id: UUID
    taches: List[str] = []  # ✅ AJOUTER : liste des tâches du comité

    class Config:
        from_attributes = True

# Schema pour les membres externes
class DestinataireExterneCreate(BaseModel):
    email: EmailStr
    comite_id: UUID

class DestinataireExterneResponse(BaseModel):
    id: UUID
    email: str
    comite_id: UUID

    class Config:
        from_attributes = True