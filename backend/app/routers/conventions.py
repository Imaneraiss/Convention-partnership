from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload 
from typing import List
from uuid import UUID
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO

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

#   GET — Liste toutes les conventions avec les partenaires
@router.get("/", response_model=List[ConventionResponse])
def get_conventions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ✅ Charger les partenaires avec joinedload
    conventions = db.query(Convention).options(
        joinedload(Convention.partenaires)
    ).all()
    
    # ✅ Mettre à jour les statuts
    for convention in conventions:
        nouveau_statut = ConventionService.calculer_statut(convention)  # ✅ Correction
        if convention.statut != nouveau_statut:
            convention.statut = nouveau_statut
    
    db.commit()
    return conventions

#   GET — Détail d'une convention avec les partenaires
@router.get("/{convention_id}", response_model=ConventionResponse)
def get_convention(convention_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convention = db.query(Convention).options(
        joinedload(Convention.partenaires)
    ).filter(Convention.id == convention_id).first()
    
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")

    # ✅ Mettre à jour le statut
    nouveau_statut = ConventionService.calculer_statut(convention)  # ✅ Correction
    if convention.statut != nouveau_statut:
        convention.statut = nouveau_statut
        db.commit()

    return convention

#   POST — Créer une convention numérotée
@router.post("/", response_model=ConventionResponse)
def create_convention(
    data: ConventionCreate,
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
    
    # ✅ Calculer le statut automatiquement
    convention.statut = ConventionService.calculer_statut(convention)  # ✅ Correction
    
    db.add(convention)
    db.commit()
    db.refresh(convention)
    return convention

#   PUT — Modifier une convention
@router.put("/{convention_id}", response_model=ConventionResponse)
def update_convention(
    convention_id: UUID,
    data: ConventionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(convention, key, value)

    # ✅ Recalculer le statut après modification
    convention.statut = ConventionService.calculer_statut(convention)  # ✅ Correction
    
    db.commit()
    db.refresh(convention)
    return convention

#   DELETE — Supprimer une convention
@router.delete("/{convention_id}")
def delete_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")
    
    db.delete(convention)
    db.commit()
    return {"message": "Convention supprimée avec succès"}

#   POST — Mettre à jour tous les statuts
@router.post("/update-statuses")
def update_all_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Met à jour les statuts de toutes les conventions
    """
    from app.services.convention_service import ConventionService
    resultats = ConventionService.mettre_a_jour_tous_les_statuts(db)
    return resultats

#   GET — Exporter les conventions vers Excel
@router.get("/export/{format}")
def export_conventions(
    format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if format != "excel":
        raise HTTPException(status_code=400, detail="Format non supporté. Utilisez 'excel'.")
    
    conventions = db.query(Convention).options(
        joinedload(Convention.partenaires)
    ).all()
    
    data = []
    for c in conventions:
        row = {
            # === IDENTIFICATION ===
            "N°": c.numero_reference,
            "Intitulé": c.intitule,
            "Type": c.type,
            "Statut": c.statut,
            
            # === DATES ===
            "Date signature": c.date_signature.strftime("%d/%m/%Y") if c.date_signature else "",
            "Date expiration": c.date_expiration.strftime("%d/%m/%Y") if c.date_expiration else "",
            
            # === SIGNATAIRES ===
            "Signature UM5": c.signataire_um5,
            "Autre signature UM5": c.signataire_um5_autre or "",
            "Signature partenaire": c.signataire_partenaire or "",
            
            # === PARTENAIRES ===
            "Partenaire(s)": ", ".join([p.nom for p in c.partenaires]) if c.partenaires else "",
        }
        data.append(row)
    
    df = pd.DataFrame(data)
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Conventions', index=False)
        
        # Ajuster la largeur des colonnes
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