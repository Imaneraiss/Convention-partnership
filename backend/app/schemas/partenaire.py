from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class PartenaireBase(BaseModel):
    nom: str
    type: str  # ONG, PRIVE, PUBLIC, SEMI_PUBLIC
    ville: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None

class PartenaireCreate(PartenaireBase):
    convention_id: UUID

class PartenaireUpdate(BaseModel):
    nom: Optional[str] = None
    type: Optional[str] = None
    ville: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None

class PartenaireResponse(PartenaireBase):
    id: UUID
    convention_id: UUID

    class Config:
        from_attributes = True