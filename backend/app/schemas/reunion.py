from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date

# Schema pour créer une réunion
class ReunionCreate(BaseModel):
    date_reunion: date
    decisions: Optional[str] = None
    comite_id: UUID

# Schema pour modifier une réunion
class ReunionUpdate(BaseModel):
    date_reunion: Optional[date] = None
    decisions: Optional[str] = None

# Schema pour retourner une réunion au frontend
class ReunionResponse(BaseModel):
    id: UUID
    date_reunion: date
    decisions: Optional[str] = None
    comite_id: UUID

    class Config:
        from_attributes = True