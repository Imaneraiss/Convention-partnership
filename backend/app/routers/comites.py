from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.comite import Comite 
from app.models.user import User
from app.schemas.comite import ComiteCreate, ComiteUpdate, ComiteResponse, MembreUM5, MembrePartenaire
from app.auth import get_current_user
from app.services.historique_service import HistoriqueService

router = APIRouter(prefix="/api/comites", tags=["Comités"])

# ✅ GET - Liste de tous les comités
@router.get("/", response_model=List[ComiteResponse])
def get_comites(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return db.query(Comite).all()

# ✅ GET - Un comité par ID
@router.get("/{comite_id}", response_model=ComiteResponse)
def get_comite(
    comite_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
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
def create_comite(
    data: ComiteCreate,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Création du comité avec tous les champs
    comite = Comite(
        type=data.type,
        frequence=data.frequence,
        convention_id=data.convention_id,
        taches=data.taches or [],
        reunions=[r.model_dump() if hasattr(r, 'model_dump') else r for r in (data.reunions or [])],
        date_debut=data.date_debut,
        prochaine_reunion=data.prochaine_reunion,
        membres_um5=[m.model_dump() for m in data.membres_um5],
        membres_partenaires=[m.model_dump() for m in data.membres_partenaires]
    )
    
    db.add(comite)
    db.commit()
    db.refresh(comite)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="creation",
        description=f"Comité créé: {comite.type}",
        details={
            "type": comite.type,
            "frequence": comite.frequence,
            "convention_id": str(comite.convention_id)
        },
        convention_id=comite.convention_id,
        request=request
    )
    
    return comite

# ✅ PUT - Mettre à jour un comité (AVEC reunions)
@router.put("/{comite_id}", response_model=ComiteResponse)
def update_comite(
    comite_id: UUID, 
    data: ComiteUpdate,
    request: Request,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # ✅ Récupérer les anciennes valeurs AVANT la modification
    anciennes_valeurs = {}
    update_data = data.model_dump(exclude_unset=True)
    champs_modifies = list(update_data.keys())
    
    for key in champs_modifies:
        if hasattr(comite, key):
            value = getattr(comite, key)
            # ✅ Convertir en format JSON-friendly
            if isinstance(value, datetime):
                anciennes_valeurs[key] = value.isoformat()
            elif isinstance(value, UUID):
                anciennes_valeurs[key] = str(value)
            elif isinstance(value, list):
                anciennes_valeurs[key] = value
            else:
                anciennes_valeurs[key] = value
    
    # Appliquer les modifications
    for key, value in update_data.items():
        if key == 'membres_um5':
            update_data[key] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in value]
        elif key == 'membres_partenaires':
            update_data[key] = [m.model_dump() if hasattr(m, 'model_dump') else m for m in value]
        elif key == 'reunions':
            update_data[key] = [r.model_dump() if hasattr(r, 'model_dump') else r for r in (value or [])]
        else:
            setattr(comite, key, value)
    
    db.commit()
    db.refresh(comite)
    
    # ✅ Récupérer les nouvelles valeurs APRÈS la modification
    nouvelles_valeurs = {}
    for key in champs_modifies:
        if hasattr(comite, key):
            value = getattr(comite, key)
            if isinstance(value, datetime):
                nouvelles_valeurs[key] = value.isoformat()
            elif isinstance(value, UUID):
                nouvelles_valeurs[key] = str(value)
            elif isinstance(value, list):
                nouvelles_valeurs[key] = value
            else:
                nouvelles_valeurs[key] = value
    
    # ✅ Enregistrer dans l'historique avec des données propres
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="modification",
        description=f"Comité {comite.type} modifié",
        details={
            "champs_modifies": champs_modifies,
            "anciennes_valeurs": anciennes_valeurs,
            "nouvelles_valeurs": nouvelles_valeurs
        },
        convention_id=comite.convention_id,
        request=request
    )
    
    return comite





# ✅ DELETE - Supprimer un membre UM5
@router.delete("/{comite_id}/membres-um5/{membre_id}", response_model=ComiteResponse)
def supprimer_membre_um5(
    comite_id: UUID,
    membre_id: str,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # ✅ Récupérer le membre avant suppression
    membre_supprime = None
    for m in comite.membres_um5:
        if m.get('id') == membre_id:
            membre_supprime = m
            break
    
    comite.membres_um5 = [m for m in comite.membres_um5 if m.get('id') != membre_id]
    db.commit()
    db.refresh(comite)

    # ✅ Enregistrer dans l'historique
    if membre_supprime:
        historique_service = HistoriqueService(db)
        historique_service.log_action(
            user_id=current_user.id,
            action="modification",
            description=f"Membre UM5 supprimé du comité {comite.type}: {membre_supprime.get('nom')}",
            details={
                "nom": membre_supprime.get('nom'),
                "email": membre_supprime.get('email'),
                "etablissement": membre_supprime.get('etablissement'),
                "comite_type": comite.type
            },
            convention_id=comite.convention_id,
            request=request
        )
    
    return comite

# ✅ PUT - Modifier un membre UM5
@router.put("/{comite_id}/membres-um5/{membre_id}", response_model=ComiteResponse)
def modifier_membre_um5(
    comite_id: UUID,
    membre_id: str,
    membre: MembreUM5,
    request: Request,  # ✅ Ajouté pour l'historique
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
            
            # ✅ Enregistrer dans l'historique
            historique_service = HistoriqueService(db)
            historique_service.log_action(
                user_id=current_user.id,
                action="modification",
                description=f"Membre UM5 modifié dans le comité {comite.type}",
                details={
                    "ancien": m,
                    "nouveau": membre.model_dump(),
                    "comite_type": comite.type
                },
                convention_id=comite.convention_id,
                request=request
            )
            
            return comite
    
    raise HTTPException(status_code=404, detail="Membre UM5 non trouvé")

# ✅ POST - Ajouter un membre partenaire
@router.post("/{comite_id}/membres-partenaires", response_model=ComiteResponse)
def ajouter_membre_partenaire(
    comite_id: UUID,
    membre: MembrePartenaire,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    comite.membres_partenaires.append(membre.model_dump())
    db.commit()
    db.refresh(comite)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="modification",
        description=f"Membre partenaire ajouté au comité {comite.type}: {membre.nom}",
        details={
            "nom": membre.nom,
            "email": membre.email,
            "organisme": membre.organisme,
            "comite_type": comite.type
        },
        convention_id=comite.convention_id,
        request=request
    )
    
    return comite

# ✅ DELETE - Supprimer un membre partenaire
@router.delete("/{comite_id}/membres-partenaires/{membre_id}", response_model=ComiteResponse)
def supprimer_membre_partenaire(
    comite_id: UUID,
    membre_id: str,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # ✅ Récupérer le membre avant suppression
    membre_supprime = None
    for m in comite.membres_partenaires:
        if m.get('id') == membre_id:
            membre_supprime = m
            break
    
    comite.membres_partenaires = [m for m in comite.membres_partenaires if m.get('id') != membre_id]
    db.commit()
    db.refresh(comite)

    # ✅ Enregistrer dans l'historique
    if membre_supprime:
        historique_service = HistoriqueService(db)
        historique_service.log_action(
            user_id=current_user.id,
            action="modification",
            description=f"Membre partenaire supprimé du comité {comite.type}: {membre_supprime.get('nom')}",
            details={
                "nom": membre_supprime.get('nom'),
                "email": membre_supprime.get('email'),
                "organisme": membre_supprime.get('organisme'),
                "comite_type": comite.type
            },
            convention_id=comite.convention_id,
            request=request
        )
    
    return comite

# ✅ PUT - Modifier un membre partenaire
@router.put("/{comite_id}/membres-partenaires/{membre_id}", response_model=ComiteResponse)
def modifier_membre_partenaire(
    comite_id: UUID,
    membre_id: str,
    membre: MembrePartenaire,
    request: Request,  # ✅ Ajouté pour l'historique
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
            
            # ✅ Enregistrer dans l'historique
            historique_service = HistoriqueService(db)
            historique_service.log_action(
                user_id=current_user.id,
                action="modification",
                description=f"Membre partenaire modifié dans le comité {comite.type}",
                details={
                    "ancien": m,
                    "nouveau": membre.model_dump(),
                    "comite_type": comite.type
                },
                convention_id=comite.convention_id,
                request=request
            )
            
            return comite
    
    raise HTTPException(status_code=404, detail="Membre partenaire non trouvé")

# ============================================
# ROUTES POUR GÉRER LES RÉUNIONS
# ============================================

# ✅ POST - Ajouter une réunion/PV à un comité
@router.post("/{comite_id}/reunions", response_model=ComiteResponse)
def ajouter_reunion(
    comite_id: UUID,
    reunion: dict,
    request: Request,  # ✅ Ajouté pour l'historique
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

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="upload",
        description=f"PV ajouté au comité {comite.type}",
        details={
            "reunion_id": reunion.get('id'),
            "date": reunion.get('date'),
            "pv_nom": reunion.get('pv', {}).get('nom'),
            "comite_type": comite.type
        },
        convention_id=comite.convention_id,
        request=request
    )
    
    return comite

# ✅ DELETE - Supprimer une réunion d'un comité
@router.delete("/{comite_id}/reunions/{reunion_id}", response_model=ComiteResponse)
def supprimer_reunion(
    comite_id: UUID,
    reunion_id: str,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comite = db.query(Comite).filter(Comite.id == comite_id).first()
    if not comite:
        raise HTTPException(status_code=404, detail="Comité non trouvé")
    
    # ✅ Récupérer la réunion avant suppression
    reunion_supprimee = None
    for r in (comite.reunions or []):
        if r.get('id') == reunion_id:
            reunion_supprimee = r
            break
    
    # Filtrer pour supprimer la réunion
    comite.reunions = [r for r in (comite.reunions or []) if r.get('id') != reunion_id]
    
    db.commit()
    db.refresh(comite)

    # ✅ Enregistrer dans l'historique
    if reunion_supprimee:
        historique_service = HistoriqueService(db)
        historique_service.log_action(
            user_id=current_user.id,
            action="suppression",
            description=f"PV supprimé du comité {comite.type}",
            details={
                "reunion_id": reunion_id,
                "date": reunion_supprimee.get('date'),
                "pv_nom": reunion_supprimee.get('pv', {}).get('nom'),
                "comite_type": comite.type
            },
            convention_id=comite.convention_id,
            request=request
        )
    
    return comite