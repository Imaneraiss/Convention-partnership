from pydantic import BaseModel
from typing import Optional
from datetime import date
from uuid import UUID

# Schema pour créer une convention
class ConventionCreate(BaseModel):
    intitule: str
    type: str
    date_signature: date
    date_expiration: Optional[date] = None
    mode_renouvellement: Optional[str] = None
    avec_budget: bool = False
    validation_conseil: bool = False
    formation_continue: bool = False

# Schema pour modifier une convention
class ConventionUpdate(BaseModel):
    intitule: Optional[str] = None
    type: Optional[str] = None
    date_signature: Optional[date] = None
    date_expiration: Optional[date] = None
    mode_renouvellement: Optional[str] = None
    avec_budget: Optional[bool] = None
    validation_conseil: Optional[bool] = None
    formation_continue: Optional[bool] = None
    statut: Optional[str] = None

# Schema pour retourner une convention au frontend
class ConventionResponse(BaseModel):
    id: UUID
    numero_reference: str
    intitule: str
    type: str
    date_signature: date
    date_expiration: Optional[date] = None
    statut: str
    mode_renouvellement: Optional[str] = None
    avec_budget: bool
    validation_conseil: bool
    formation_continue: bool

    class Config:
        from_attributes = True