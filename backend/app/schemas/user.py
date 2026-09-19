from pydantic import AliasChoices, BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID


# ═══════════════════════════════════════════════════════════
# Créer un utilisateur
# ═══════════════════════════════════════════════════════════
class UserCreate(BaseModel):
    nom: str
    prenom: Optional[str] = None             # ⬅️ AJOUTÉ
    email: EmailStr
    mot_de_passe: str = Field(..., validation_alias=AliasChoices('mot_de_passe', 'password'))
    role: str = "charge_partenariat"
    is_admin: bool = False
    telephone: Optional[str] = None          # ⬅️ AJOUTÉ
    actif: Optional[bool] = True             # ⬅️ AJOUTÉ

    class Config:
        populate_by_name = True


# ═══════════════════════════════════════════════════════════
# Modifier un utilisateur
# ═══════════════════════════════════════════════════════════
class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None             # ⬅️ AJOUTÉ
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    telephone: Optional[str] = None          # ⬅️ AJOUTÉ
    actif: Optional[bool] = None             # ⬅️ AJOUTÉ


# ═══════════════════════════════════════════════════════════
# Retour d'un utilisateur
# ═══════════════════════════════════════════════════════════
class UserResponse(BaseModel):
    id: UUID
    nom: str
    prenom: Optional[str] = None             # ⬅️ AJOUTÉ
    email: str
    role: str
    is_admin: bool
    premiere_connexion: bool
    telephone: Optional[str] = None          # ⬅️ AJOUTÉ
    actif: Optional[bool] = True             # ⬅️ AJOUTÉ

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
# Login
# ═══════════════════════════════════════════════════════════
class LoginSchema(BaseModel):
    email: EmailStr
    mot_de_passe: str


# ═══════════════════════════════════════════════════════════
# Changer mot de passe
# ═══════════════════════════════════════════════════════════
class ChangePasswordSchema(BaseModel):
    ancien_mot_de_passe: str
    nouveau_mot_de_passe: str