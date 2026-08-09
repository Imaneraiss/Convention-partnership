from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.comite import Comite 
from app.models.user import User
from app.schemas.comite import ComiteCreate, ComiteUpdate, ComiteResponse, MembreUM5, MembrePartenaire
from app.auth import get_current_user

router = APIRouter(prefix="/api/comites", tags=["Comités"])

# ✅ GET - Liste de tous les comités
@router.get("/", response_model=List[ComiteResponse])
def get_comites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Comite).all()

# ✅ GET - Un comité par ID
@router.get("/{comite_id}", response_model=ComiteResponse)
def get_comite(comite_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    return comite

# ✅ GET - Comités par convention
@router.get("/convention/{convention_id}", response_model=List[ComiteResponse])
def get_comites_by_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comites = db.query(Comite).filter(Comite.convention_id == convention_id).all()
    return comites

# ✅ POST - Créer un comité (AVEC reunions)
@router.post("/", response_model=ComiteResponse)
def create_comite(data: ComiteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Création du comité avec tous les champs
    comite = Comite(
        type=data.type,
        frequence=data.frequence,
        convention_id=data.convention_id,
        taches=data.taches or [],
        reunions=[r.model_dump() if hasattr(r, 'model_dump') else r for r in (data.reunions or [])],  # ✅ AJOUTÉ
        date_debut=data.date_debut,
        prochaine_reunion=data.prochaine_reunion,
        membres_um5=[m.model_dump() for m in data.membres_um5],
        membres_partenaires=[m.model_dump() for m in data.membres_partenaires]
    )
    
    db.add(comite)
    db.commit()
    db.refresh(comite)
    return comite

# ✅ PUT - Mettre à jour un comité (AVEC reunions)
@router.put("/{comite_id}", response_model=ComiteResponse)
def update_comite(
    comite_id: UUID, 
    data: ComiteUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # ✅ AJOUTER CE LOG POUR VOIR CE QUI EST ENVOYÉ
    print("📥 Données reçues pour le PUT:", data.model_dump(exclude_unset=True))
    print("🔍 Comité ID:", comite_id)
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # Mise à jour des champs
    update_data = data.model_dump(exclude_unset=True)
    
    # Traitement spécial pour les membres (conversion en dict pour JSON)
    if 'membres_um5' in update_data:
        update_data['membres_um5'] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in update_data['membres_um5']]
    if 'membres_partenaires' in update_data:
        update_data['membres_partenaires'] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in update_data['membres_partenaires']]
    
    # ✅ Traitement spécial pour les réunions (conversion en dict pour JSON)
    if 'reunions' in update_data:
        update_data['reunions'] = [
            r.model_dump() if hasattr(r, 'model_dump') else r 
            for r in (update_data['reunions'] or [])
        ]
    
    for key, value in update_data.items():
        setattr(comite, key, value)
    
    db.commit()
    db.refresh(comite)
    return comite

# ✅ DELETE - Supprimer un comité
@router.delete("/{comite_id}")
def delete_comite(
    comite_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    db.delete(comite)
    db.commit()
    return {"message": "Comité supprimé avec succès"}

# ============================================
# 🆕 ROUTES POUR GÉRER LES MEMBRES
# ============================================

# ✅ POST - Ajouter un membre UM5
@router.post("/{comite_id}/membres-um5", response_model=ComiteResponse)
def ajouter_membre_um5(
    comite_id: UUID,
    membre: MembreUM5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    comite.membres_um5.append(membre.model_dump())
    db.commit()
    db.refresh(comite)
    return comite

# ✅ DELETE - Supprimer un membre UM5
@router.delete("/{comite_id}/membres-um5/{membre_id}", response_model=ComiteResponse)
def supprimer_membre_um5(
    comite_id: UUID,
    membre_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    comite.membres_um5 = [m for m in comite.membres_um5 if m.get('id') != membre_id]
    db.commit()
    db.refresh(comite)
    return comite

# ✅ PUT - Modifier un membre UM5
@router.put("/{comite_id}/membres-um5/{membre_id}", response_model=ComiteResponse)
def modifier_membre_um5(
    comite_id: UUID,
    membre_id: str,
    membre: MembreUM5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    for i, m in enumerate(comite.membres_um5):
        if m.get('id') == membre_id:
            comite.membres_um5[i] = membre.model_dump()
            db.commit()
            db.refresh(comite)
            return comite
    
    raise HTTPException(status_code=404, detail="Membre UM5 non trouvé")

# ✅ POST - Ajouter un membre partenaire
@router.post("/{comite_id}/membres-partenaires", response_model=ComiteResponse)
def ajouter_membre_partenaire(
    comite_id: UUID,
    membre: MembrePartenaire,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    comite.membres_partenaires.append(membre.model_dump())
    db.commit()
    db.refresh(comite)
    return comite

# ✅ DELETE - Supprimer un membre partenaire
@router.delete("/{comite_id}/membres-partenaires/{membre_id}", response_model=ComiteResponse)
def supprimer_membre_partenaire(
    comite_id: UUID,
    membre_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    comite.membres_partenaires = [m for m in comite.membres_partenaires if m.get('id') != membre_id]
    db.commit()
    db.refresh(comite)
    return comite

# ✅ PUT - Modifier un membre partenaire
@router.put("/{comite_id}/membres-partenaires/{membre_id}", response_model=ComiteResponse)
def modifier_membre_partenaire(
    comite_id: UUID,
    membre_id: str,
    membre: MembrePartenaire,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    for i, m in enumerate(comite.membres_partenaires):
        if m.get('id') == membre_id:
            comite.membres_partenaires[i] = membre.model_dump()
            db.commit()
            db.refresh(comite)
            return comite
    
    raise HTTPException(status_code=404, detail="Membre partenaire non trouvé")

# ============================================
# 🆕 ROUTE POUR AJOUTER UNE RÉUNION À UN COMITÉ
# ============================================

# ✅ POST - Ajouter une réunion/PV à un comité
@router.post("/{comite_id}/reunions", response_model=ComiteResponse)
def ajouter_reunion(
    comite_id: UUID,
    reunion: dict,  # Accepte un dict avec id, date, pv
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # Ajouter la réunion à la liste
    reunions = comite.reunions or []
    reunions.append(reunion)
    comite.reunions = reunions
    
    db.commit()
    db.refresh(comite)
    return comite

# ✅ DELETE - Supprimer une réunion d'un comité
@router.delete("/{comite_id}/reunions/{reunion_id}", response_model=ComiteResponse)
def supprimer_reunion(
    comite_id: UUID,
    reunion_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # Filtrer pour supprimer la réunion
    comite.reunions = [r for r in (comite.reunions or []) if r.get('id') != reunion_id]
    
    db.commit()
    db.refresh(comite)
    return comite