from pydantic import BaseModel
from typing import Optional
from uuid import UUID

# Schema pour créer un budget
class BudgetCreate(BaseModel):
    montant: Optional[float] = None
    modalites_paiement: Optional[str] = None
    budget_recu: Optional[str] = None  # OUI, NON, PARTIELLEMENT
    montant_depense: float = 0.0
    reste_a_payer: float = 0.0
    commentaire: Optional[str] = None
    convention_id: UUID

# Schema pour modifier un budget (SG)
class BudgetUpdate(BaseModel):
    montant: Optional[float] = None
    modalites_paiement: Optional[str] = None
    budget_recu: Optional[str] = None
    montant_depense: Optional[float] = None
    reste_a_payer: Optional[float] = None
    commentaire: Optional[str] = None

# Schema pour retourner un budget au frontend
class BudgetResponse(BaseModel):
    id: UUID
    montant: Optional[float] = None
    modalites_paiement: Optional[str] = None
    budget_recu: Optional[str] = None
    montant_depense: float
    reste_a_payer: float
    commentaire: Optional[str] = None
    convention_id: UUID

    class Config:
        from_attributes = True