from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import LoginSchema, ChangePasswordSchema, UserResponse
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime, timedelta  # ✅ AJOUTER
import secrets  # ✅ AJOUTER
from app.services.email_service import EmailService  # ✅ AJOUTER


router = APIRouter(prefix="/api/auth", tags=["Authentification"])

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
            "role": user.role,
            "is_admin": user.is_admin
        }
    return {
        "access_token": token,
        "token_type": "bearer",
        "premiere_connexion": False,
        "role": user.role,
        "is_admin": user.is_admin
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


@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return {"message": "Si cet email existe, un lien de réinitialisation vous a été envoyé"}
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    
    email_service = EmailService()
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    
    email_service.send_email(
        to_emails=[email],
        subject="🔐 Réinitialisation de votre mot de passe",
        html_content=f"""
        <h2>Réinitialisation du mot de passe</h2>
        <p>Bonjour {user.nom},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous :</p>
        <p><a href="{reset_link}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien est valable <strong>24 heures</strong>.</p>
        """
    )
    
    return {"message": "Un lien de réinitialisation vous a été envoyé"}

# ✅ NOUVEAU - Réinitialiser le mot de passe
@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.reset_token == token,
        User.reset_token_expires > datetime.utcnow()
    ).first()
    
    if not user:
        raise HTTPException(400, "Lien invalide ou expiré")
    
    user.mot_de_passe = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Mot de passe réinitialisé avec succès"}
