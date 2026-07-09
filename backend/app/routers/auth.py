from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginSchema, ChangePasswordSchema, UserResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.mot_de_passe, user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    token = create_access_token({
        "user_id": str(user.id),
        "role": user.role,
        "is_admin": user.is_admin
    })
    if user.premiere_connexion:
        return {
            "access_token": token,
            "token_type": "bearer",
            "premiere_connexion": True,
            "role": user.role
        }
    return {
        "access_token": token,
        "token_type": "bearer",
        "premiere_connexion": False,
        "role": user.role
    }

@router.post("/change-password")
def change_password(data: ChangePasswordSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.ancien_mot_de_passe, current_user.mot_de_passe):
        raise HTTPException(status_code=400, detail="Ancien mot de passe incorrect")
    current_user.mot_de_passe = hash_password(data.nouveau_mot_de_passe)
    current_user.premiere_connexion = False
    db.commit()
    return {"message": "Mot de passe changé avec succès"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user