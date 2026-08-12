from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.auth import get_current_user, require_role
from app.services.historique_service import HistoriqueService

router = APIRouter(prefix="/api/budgets", tags=["Budget"])

# ✅ GET - Récupérer le budget d'une convention
@router.get("/{convention_id}", response_model=BudgetResponse)
def get_budget(
    convention_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    budget = db.query(Budget).filter(Budget.convention_id == convention_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    return budget

# ✅ POST - Créer un budget
@router.post("/", response_model=BudgetResponse)
def create_budget(
    data: BudgetCreate,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("CHARGE"))
):
    budget = Budget(**data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="creation",
        description=f"Budget créé: {budget.montant} {budget.devise}",
        details={
            "montant": budget.montant,
            "devise": budget.devise,
            "modalites_paiement": budget.modalites_paiement,
            "budget_recu": budget.budget_recu
        },
        convention_id=budget.convention_id,
        request=request
    )
    
    return budget

# ✅ PUT - Mettre à jour un budget
@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: UUID, 
    data: BudgetUpdate,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("CHARGE", "SG"))
):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    
    # ✅ Récupérer les anciennes valeurs pour le log
    anciennes_valeurs = {
        "montant": budget.montant,
        "devise": budget.devise,
        "modalites_paiement": budget.modalites_paiement,
        "budget_recu": budget.budget_recu,
        "montant_depense": budget.montant_depense
    }
    
    # Mise à jour
    champs_modifies = list(data.model_dump(exclude_unset=True).keys())
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)
    
    db.commit()
    db.refresh(budget)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="modification",
        description=f"Budget modifié: {budget.montant} {budget.devise}",
        details={
            "champs_modifies": champs_modifies,
            "anciennes_valeurs": anciennes_valeurs,
            "nouvelles_valeurs": {
                "montant": budget.montant,
                "devise": budget.devise,
                "modalites_paiement": budget.modalites_paiement,
                "budget_recu": budget.budget_recu,
                "montant_depense": budget.montant_depense
            }
        },
        convention_id=budget.convention_id,
        request=request
    )
    
    return budget

# ✅ DELETE - Supprimer un budget
@router.delete("/{budget_id}")
def delete_budget(
    budget_id: UUID,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("CHARGE"))
):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    
    # ✅ Récupérer les infos avant suppression
    montant = budget.montant
    devise = budget.devise
    convention_id = budget.convention_id
    
    # ✅ Enregistrer dans l'historique AVANT la suppression
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="suppression",
        description=f"Budget supprimé: {montant} {devise}",
        details={
            "montant": montant,
            "devise": devise,
            "modalites_paiement": budget.modalites_paiement,
            "budget_recu": budget.budget_recu
        },
        convention_id=convention_id,
        request=request
    )
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget supprimé avec succès"}