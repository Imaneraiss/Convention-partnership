from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Union
from datetime import date
from uuid import UUID, uuid4

# ✅ Schéma pour un PV
class PV(BaseModel):
    id: Optional[str] = None
    nom: str
    titre: str
    date: str
    
    class Config:
        from_attributes = True

# ✅ Schéma pour une réunion
class Reunion(BaseModel):
    id: Union[str, int] 
    date: str
    pv: Optional[PV] = None
    
    class Config:
        from_attributes = True

# ✅ Schéma pour un membre UM5
class MembreUM5(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()))
    nom: str
    email: Optional[str] = ''              # ← EmailStr → str, optionnel
    etablissement: Optional[str] = ''  
    
    class Config:
        from_attributes = True

# ✅ Schéma pour un membre partenaire
class MembrePartenaire(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()))
    nom: str
    email: Optional[str] = ''              # ← EmailStr → str, optionnel
    organisme: Optional[str] = ''    
    
    class Config:
        from_attributes = True

# ✅ Schema pour créer un comité
class ComiteCreate(BaseModel):
    type: str
    frequence: Optional[str] = None
    convention_id: UUID
    taches: List[str] = []
    reunions: List[Reunion] = []
    date_debut: Optional[date] = None
    prochaine_reunion: Optional[date] = None
    membres_um5: List[MembreUM5] = []
    membres_partenaires: List[MembrePartenaire] = []

# ✅ Schema pour modifier un comité - AVEC reunions (Any pour flexibilité)
class ComiteUpdate(BaseModel):
    type: Optional[str] = None
    frequence: Optional[str] = None
    taches: Optional[List[str]] = None
    reunions: Optional[Any] = None  # ✅ Utiliser Any pour accepter tout format
    date_debut: Optional[date] = None
    prochaine_reunion: Optional[date] = None
    membres_um5: Optional[List[MembreUM5]] = None
    membres_partenaires: Optional[List[MembrePartenaire]] = None

# ✅ Schema pour retourner un comité
class ComiteResponse(BaseModel):
    id: UUID
    type: str
    frequence: Optional[str] = None
    convention_id: UUID
    taches: List[str] = []
    reunions: List[Reunion] = []
    date_debut: Optional[date] = None
    prochaine_reunion: Optional[date] = None
    membres_um5: List[MembreUM5] = []
    membres_partenaires: List[MembrePartenaire] = []

    class Config:
        from_attributes = True