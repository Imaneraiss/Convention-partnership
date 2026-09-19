from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError          # ⬅️ AJOUTÉ
from typing import List, Dict, Any
from uuid import UUID
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO

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


# ═══════════════════════════════════════════════════════════
# GET — Liste toutes les conventions avec les partenaires
# ═══════════════════════════════════════════════════════════
@router.get("", response_model=List[ConventionResponse])
@router.get("/", response_model=List[ConventionResponse], include_in_schema=False)
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


# ═══════════════════════════════════════════════════════════
# GET — Détail d'une convention avec les partenaires
# ═══════════════════════════════════════════════════════════
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


# ═══════════════════════════════════════════════════════════
# POST — Créer une convention numérotée (✅ CORRIGÉ)
# ═══════════════════════════════════════════════════════════
@router.post("", response_model=ConventionResponse)
@router.post("/", response_model=ConventionResponse, include_in_schema=False)
def create_convention(
    data: ConventionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annee = datetime.now().year

    # ═══════════════════════════════════════════════════════
    # GÉNÉRATION ROBUSTE DU NUMÉRO DE RÉFÉRENCE
    # ═══════════════════════════════════════════════════════
    # Récupérer TOUTES les conventions de l'année
    conventions_annee = db.query(Convention)\
        .filter(extract('year', Convention.date_signature) == annee)\
        .all()

    # Extraire les numéros et trouver le max RÉEL (numérique)
    numeros = []
    for c in conventions_annee:
        if c.numero_reference:
            try:
                num = int(c.numero_reference.split('/')[0])
                numeros.append(num)
            except (ValueError, IndexError):
                continue

    # Prochain numéro
    prochain_numero = max(numeros, default=0) + 1
    numero_reference = f"{prochain_numero:02d}/{annee}"

    print(f"🔢 Génération numéro : {numero_reference}")
    print(f"   Conventions existantes en {annee}: {sorted(numeros)}")

    # ═══════════════════════════════════════════════════════
    # VÉRIFIER UNICITÉ (au cas où le numéro serait déjà pris)
    # ═══════════════════════════════════════════════════════
    existing = db.query(Convention).filter(
        Convention.numero_reference == numero_reference
    ).first()

    tentatives = 0
    while existing and tentatives < 100:
        prochain_numero += 1
        numero_reference = f"{prochain_numero:02d}/{annee}"
        existing = db.query(Convention).filter(
            Convention.numero_reference == numero_reference
        ).first()
        tentatives += 1

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Impossible de générer un numéro unique pour {annee}"
        )

    # ═══════════════════════════════════════════════════════
    # CRÉATION
    # ═══════════════════════════════════════════════════════
    data_dict = data.model_dump()
    data_dict["user_id"] = current_user.id
    data_dict["numero_reference"] = numero_reference      # ⬅️ Assigner dans le dict

    convention = Convention(**data_dict)
    convention.statut = ConventionService.calculer_statut(convention)

    try:
        db.add(convention)
        db.commit()
        db.refresh(convention)
        print(f"✅ Convention créée avec numéro {numero_reference}")
    except IntegrityError as e:
        db.rollback()
        print(f"❌ Erreur intégrité : {e}")
        raise HTTPException(
            status_code=409,
            detail=f"Le numéro {numero_reference} existe déjà. Veuillez réessayer."
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur création : {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la création: {str(e)}"
        )

    # ✅ Enregistrer dans l'historique
    try:
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
    except Exception as e:
        print(f"⚠️ Erreur historique (non bloquant): {e}")

    return convention


# ═══════════════════════════════════════════════════════════
# PUT — Modifier une convention
# ═══════════════════════════════════════════════════════════
@router.put("/{convention_id}", response_model=ConventionResponse)
def update_convention(
    convention_id: UUID,
    data: ConventionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convention = db.query(Convention).filter(Convention.id == convention_id).first()
    if not convention:
        raise HTTPException(status_code=404, detail="Convention non trouvée")

    champs_modifies = list(data.model_dump(exclude_unset=True).keys())

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(convention, key, value)

    convention.statut = ConventionService.calculer_statut(convention)

    db.commit()
    db.refresh(convention)

    # ✅ Historique
    try:
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
    except Exception as e:
        print(f"⚠️ Erreur historique: {e}")

    return convention


# ═══════════════════════════════════════════════════════════
# DELETE — Supprimer une convention
# ═══════════════════════════════════════════════════════════
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

    intitule = convention.intitule
    numero_reference = convention.numero_reference
    print(f"🔍 Suppression de la convention: {convention_id}")

    # ✅ 1. Historique AVANT suppression
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
        convention_id=None,
        request=request
    )
    db.commit()

    # ✅ 2. Suppression
    db.delete(convention)
    db.commit()

    return {"message": "Convention supprimée avec succès"}


# ═══════════════════════════════════════════════════════════
# POST — Mettre à jour tous les statuts
# ═══════════════════════════════════════════════════════════
@router.post("/update-statuses")
def update_all_statuses(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour les statuts de toutes les conventions"""
    resultats = ConventionService.mettre_a_jour_tous_les_statuts(db)

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


# ═══════════════════════════════════════════════════════════
# POST — Exporter les conventions vers Excel
# ═══════════════════════════════════════════════════════════
@router.post("/export/excel")
def export_conventions_excel(
    data: List[Dict[str, Any]],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("=" * 50)
    print("📤 EXPORT EXCEL")
    print(f"📊 Nombre de lignes: {len(data)}")
    print("=" * 50)

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