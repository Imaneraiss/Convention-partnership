from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date

# Schema pour créer une alerte manuelle
class AlerteCreate(BaseModel):
    date_declenchement: date
    objet: str
    convention_id: Optional[UUID] = None
    destinataires: List[UUID] = []  # liste des user_id

# Schema pour modifier une alerte manuelle
class AlerteUpdate(BaseModel):
    date_declenchement: Optional[date] = None
    objet: Optional[str] = None
    destinataires: Optional[List[UUID]] = None

# Schema pour marquer une alerte comme traitée
class AlerteTraitee(BaseModel):
    traitee: bool = True

# Schema pour retourner une alerte au frontend
class AlerteResponse(BaseModel):
    id: UUID
    type_alerte: str
    date_declenchement: date
    objet: Optional[str] = None
    envoyee: bool
    traitee: bool
    convention_id: Optional[UUID] = None
    comite_id: Optional[UUID] = None  
    created_by: Optional[UUID] = None 
    class Config:
        from_attributes = True