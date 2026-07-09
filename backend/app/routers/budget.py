from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/budgets", tags=["Budget"])

@router.get("/{convention_id}", response_model=BudgetResponse)
def get_budget(convention_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.convention_id == convention_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    return budget

@router.post("/", response_model=BudgetResponse)
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("CHARGE"))):
    budget = Budget(**data.model_dump())
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: UUID, data: BudgetUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("CHARGE", "SG"))):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget non trouvé")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)
    db.commit()
    db.refresh(budget)
    return budget