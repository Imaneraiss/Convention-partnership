from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID

# Schema pour créer un comité
class ComiteCreate(BaseModel):
    type: str  # PILOTAGE, SUIVI, TECHNIQUE
    frequence: Optional[str] = None
    convention_id: UUID
    destinataires_internes: List[UUID] = []  # liste des user_id
    destinataires_externes: List[EmailStr] = []  # liste des emails externes

# Schema pour modifier un comité
class ComiteUpdate(BaseModel):
    type: Optional[str] = None
    frequence: Optional[str] = None
    destinataires_internes: Optional[List[UUID]] = None
    destinataires_externes: Optional[List[EmailStr]] = None

# Schema pour retourner un comité au frontend
class ComiteResponse(BaseModel):
    id: UUID
    type: str
    frequence: Optional[str] = None
    convention_id: UUID

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