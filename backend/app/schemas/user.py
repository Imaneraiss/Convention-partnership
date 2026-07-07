from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

# Schema pour créer un compte (admin)
class UserCreate(BaseModel):
    nom: str
    email: EmailStr
    mot_de_passe: str
    role: str  # CHARGE, SG, PRESIDENT
    is_admin: bool = False

# Schema pour modifier un compte
class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None

# Schema pour retourner un utilisateur au frontend
class UserResponse(BaseModel):
    id: UUID
    nom: str
    email: str
    role: str
    is_admin: bool
    premiere_connexion: bool

    class Config:
        from_attributes = True

# Schema pour le login
class LoginSchema(BaseModel):
    email: EmailStr
    mot_de_passe: str

# Schema pour changer le mot de passe
class ChangePasswordSchema(BaseModel):
    ancien_mot_de_passe: str
    nouveau_mot_de_passe: str