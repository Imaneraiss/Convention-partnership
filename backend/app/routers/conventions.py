from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload 
from typing import List
from uuid import UUID
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO
from typing import List, Dict, Any  

from app.services.historique_service import HistoriqueService
from app.database import get_db
from app.models.convention import Convention
from app.models.user import User
from app.schemas.convention import ConventionCreate, ConventionUpdate, ConventionResponse
from app.auth import get_current_user
from app.services.convention_service import ConventionService

router = APIRouter(
    prefix="/api/conventions",
    tags=["Conventions"]
)

# ─── GET — Liste toutes les conventions avec les partenaires ───
@router.get("/", response_model=List[ConventionResponse])
def get_conventions(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    conventions = db.query(Convention).options(
        joinedload(Convention.partenaires)
    ).all()
    
    for convention in conventions:
        nouveau_statut = ConventionService.calculer_statut(convention)
        if convention.statut != nouveau_statut:
            convention.statut = nouveau_statut
    
    db.commit()
    return conventions

# ─── GET — Détail d'une convention avec les partenaires ───
@router.get("/{convention_id}", response_model=ConventionResponse)
def get_convention(
    convention_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).options(
        joinedload(Convention.partenaires)
    ).filter(Convention.id == convention_id).first()
    
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")

    nouveau_statut = ConventionService.calculer_statut(convention)
    if convention.statut != nouveau_statut:
        convention.statut = nouveau_statut
        db.commit()

    return convention

# ─── POST — Créer une convention numérotée ───
@router.post("/", response_model=ConventionResponse)
def create_convention(
    data: ConventionCreate,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annee = datetime.now().year
    derniere = db.query(Convention)\
        .filter(extract('year', Convention.date_signature) == annee)\
        .order_by(Convention.numero_reference.desc())\
        .first()
    numero = 1 if not derniere else int(derniere.numero_reference.split('/')[0]) + 1

    data_dict = data.model_dump()
    data_dict["user_id"] = current_user.id
    
    convention = Convention(**data_dict)
    convention.numero_reference = f"{numero:02d}/{annee}"
    
    # Calculer le statut automatiquement
    convention.statut = ConventionService.calculer_statut(convention)
    
    db.add(convention)
    db.commit()
    db.refresh(convention)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="creation",
        description=f"Convention créée: {convention.intitule}",
        details={
            "intitule": convention.intitule,
            "type": convention.type,
            "numero_reference": convention.numero_reference,
            "date_signature": str(convention.date_signature) if convention.date_signature else None
        },
        convention_id=convention.id,
        request=request
    )
    
    return convention

# ─── PUT — Modifier une convention ───
@router.put("/{convention_id}", response_model=ConventionResponse)
def update_convention(
    convention_id: UUID,
    data: ConventionUpdate,
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    
    # ✅ Récupérer les champs modifiés avant la mise à jour
    champs_modifies = list(data.model_dump(exclude_unset=True).keys())
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(convention, key, value)

    # Recalculer le statut après modification
    convention.statut = ConventionService.calculer_statut(convention)
    
    db.commit()
    db.refresh(convention)

    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="modification",
        description=f"Infos générales modifiées",
        details={
            "champs_modifies": champs_modifies,
            "intitule": convention.intitule,
            "numero_reference": convention.numero_reference
        },
        convention_id=convention.id,
        request=request
    )
    
    return convention

# ─── DELETE — Supprimer une convention ───
@router.delete("/{convention_id}")
def delete_convention(
    convention_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    
    # ✅ Récupérer les infos avant suppression
    intitule = convention.intitule
    numero_reference = convention.numero_reference
    print(f"🔍 Suppression de la convention: {convention_id}")
    print(f"🔍 Enregistrement dans l'historique...")
    # ✅ 1. Enregistrer dans l'historique et COMMIT
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="suppression",
        description=f"Convention supprimée: {intitule}",
        details={
            "intitule": intitule,
            "numero_reference": numero_reference,
            "type": convention.type
        },
        convention_id=convention_id,
        request=request
    )
    
    # ✅ 2. FORCER LE COMMIT de l'historique avant la suppression
    db.commit()  # ← AJOUTER CETTE LIGNE
    
    # ✅ 3. Supprimer la convention
    db.delete(convention)
    db.commit()  # ← Deuxième commit
    
    return {"message": "Convention supprimée avec succès"}
# ─── POST — Mettre à jour tous les statuts ───
@router.post("/update-statuses")
def update_all_statuses(
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Met à jour les statuts de toutes les conventions
    """
    from app.services.convention_service import ConventionService
    resultats = ConventionService.mettre_a_jour_tous_les_statuts(db)
    
    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="traitement",
        description="Mise à jour des statuts de toutes les conventions",
        details={
            "conventions_mises_a_jour": resultats.get("mis_a_jour", 0),
            "conventions_verifiees": resultats.get("total", 0)
        },
        request=request
    )
    
    return resultats

# ─── POST — Exporter les conventions vers Excel ───
@router.post("/export/excel")
def export_conventions_excel(
    data: List[Dict[str, Any]],
    request: Request,  # ✅ Ajouté pour l'historique
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("=" * 50)
    print("📤 EXPORT EXCEL")
    print(f"📊 Nombre de lignes: {len(data)}")
    print("=" * 50)
    
    # ✅ Enregistrer dans l'historique
    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="download",
        description=f"Export Excel: {len(data)} conventions",
        details={
            "nombre_conventions": len(data),
            "colonnes": list(data[0].keys()) if data else []
        },
        request=request
    )
    
    df = pd.DataFrame(data)
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Conventions', index=False)
        
        worksheet = writer.sheets['Conventions']
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=conventions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        }
    )