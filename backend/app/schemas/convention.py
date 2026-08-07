from pydantic import BaseModel
from typing import Optional, List, Dict
from uuid import UUID
from datetime import date
from app.schemas.partenaire import PartenaireResponse


class ConventionBase(BaseModel):
    intitule: str
    type: str
    date_signature: date
    date_expiration: Optional[date] = None
    duree_annees: Optional[int] = None  # 🆕 NOUVEAU
    mode_renouvellement: Optional[str] = None
    signataire_um5: str
    signataire_um5_autre: Optional[str] = None
    signataire_partenaire: Optional[str] = None
    signataire_partenaire_autre: Optional[str] = None
    avec_budget: bool = False
    validation_conseil: bool = False
    formation_continue: bool = False
    expiree_manuellement: bool = False  # ✅ AJOUTER
    mots_cles: List[str] = []
    articles: Dict = {}
    articles_personnalises: List[Dict] = []
    statut: str = "EN_COURS"
    signe: bool = False

class ConventionCreate(ConventionBase):
    pass

class ConventionUpdate(BaseModel):
    intitule: Optional[str] = None
    type: Optional[str] = None
    date_signature: Optional[date] = None
    date_expiration: Optional[date] = None
    duree_annees: Optional[int] = None  # 🆕 NOUVEAU
    mode_renouvellement: Optional[str] = None
    signataire_um5: Optional[str] = None
    signataire_um5_autre: Optional[str] = None
    signataire_partenaire: Optional[str] = None
    signataire_partenaire_autre: Optional[str] = None
    avec_budget: Optional[bool] = None
    validation_conseil: Optional[bool] = None
    formation_continue: Optional[bool] = None
    expiree_manuellement: Optional[bool] = None  # ✅ AJOUTER
    mots_cles: Optional[List[str]] = None
    articles: Optional[Dict] = None
    articles_personnalises: Optional[List[Dict]] = None
    statut: Optional[str] = None
    signe: Optional[bool] = None

class ConventionResponse(ConventionBase):
    id: UUID
    numero_reference: str
    user_id: UUID
    duree_annees: Optional[int] = None  
    partenaires: List[PartenaireResponse] = []  
    expiree_manuellement: bool = False
    signe: bool = False  
    
    class Config:
        from_attributes = True