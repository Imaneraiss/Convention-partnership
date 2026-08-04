from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date
from uuid import UUID
from app.schemas.partenaire import PartenaireResponse  # ✅ Importer le schéma Partenaire

# Schema pour créer une convention
class ConventionCreate(BaseModel):
    intitule: str
    type: str
    date_signature: date
    date_expiration: Optional[date] = None
    mode_renouvellement: Optional[str] = None
    signataire_um5: str
    signataire_um5_autre: Optional[str] = None
    avec_budget: bool = False
    validation_conseil: bool = False
    formation_continue: bool = False
    mots_cles: Optional[List[str]] = []
    articles: Optional[Dict] = {}
    articles_personnalises: Optional[List] = []

# Schema pour modifier une convention
class ConventionUpdate(BaseModel):
    intitule: Optional[str] = None
    type: Optional[str] = None
    date_signature: Optional[date] = None
    date_expiration: Optional[date] = None
    mode_renouvellement: Optional[str] = None
    signataire_um5: Optional[str] = None
    signataire_um5_autre: Optional[str] = None
    avec_budget: Optional[bool] = None
    validation_conseil: Optional[bool] = None
    formation_continue: Optional[bool] = None
    statut: Optional[str] = None
    mots_cles: Optional[List[str]] = None
    articles: Optional[Dict] = None
    articles_personnalises: Optional[List] = None

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
    signataire_um5: str
    signataire_um5_autre: Optional[str] = None
    avec_budget: bool
    validation_conseil: bool
    formation_continue: bool
    mots_cles: Optional[List[str]] = []
    articles: Optional[Dict] = {}
    articles_personnalises: Optional[List] = []  
    user_id: UUID
    partenaires: List[PartenaireResponse] = []  # ✅ AJOUTER CETTE LIGNE

    class Config:
        from_attributes = True