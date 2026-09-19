from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.schemas.user import ChangePasswordSchema, UserCreate, UserUpdate, UserResponse
from app.auth import get_current_user, hash_password, require_admin

router = APIRouter(prefix="/api/users", tags=["Utilisateurs"])


# ═══════════════════════════════════════════════════════════
# GET — Liste tous les utilisateurs (✅ CORRIGÉ 307)
# ═══════════════════════════════════════════════════════════
@router.get("", response_model=List[UserResponse])
@router.get("/", response_model=List[UserResponse], include_in_schema=False)
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).all()


# ═══════════════════════════════════════════════════════════
# GET — Détail d'un utilisateur
# ═══════════════════════════════════════════════════════════
@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur non trouvé"
        )
    return user


# ═══════════════════════════════════════════════════════════
# POST — Créer un utilisateur (✅ CORRIGÉ 307)
# ═══════════════════════════════════════════════════════════
@router.post("", response_model=UserResponse)
@router.post("/", response_model=UserResponse, include_in_schema=False)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # ✅ Créer l'utilisateur avec TOUS les champs
    user = User(
        nom=data.nom,
        prenom=data.prenom,                        # ⬅️ AJOUTÉ
        email=data.email,
        mot_de_passe=hash_password(data.mot_de_passe),
        role=data.role,
        is_admin=data.is_admin,
        telephone=data.telephone,                  # ⬅️ AJOUTÉ
        actif=data.actif,                          # ⬅️ AJOUTÉ
        premiere_connexion=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ═══════════════════════════════════════════════════════════
# PUT — Modifier un utilisateur
# ═══════════════════════════════════════════════════════════
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # ✅ Mettre à jour UNIQUEMENT les champs fournis
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

# ═══════════════════════════════════════════════════════════
# PUT — Changer le mot de passe d'un utilisateur
# ═══════════════════════════════════════════════════════════
@router.put("/{user_id}/password")
def update_password(
    user_id: UUID,
    data: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Utilisateur non trouvé"
        )

    user.mot_de_passe = hash_password(data.nouveau_mot_de_passe)
    user.premiere_connexion = False

    db.commit()
    db.refresh(user)

    return {
        "message": "Mot de passe modifié avec succès"
    }


# ═══════════════════════════════════════════════════════════
# DELETE — Supprimer un utilisateur
# ═══════════════════════════════════════════════════════════
@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}