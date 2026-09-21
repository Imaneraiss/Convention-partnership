from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os, shutil, uuid
from datetime import datetime, timedelta
from fastapi.responses import FileResponse

from app.database import get_db
from app.models.fichier import Fichier
from app.models.user import User
from app.schemas.fichier import FichierResponse
from app.auth import get_current_user
from app.services.ocr_service import process_document
from app.models.convention import Convention
from app.models.comite import Comite
from app.services.historique_service import HistoriqueService

router = APIRouter(prefix="/api/fichiers", tags=["Fichiers"])

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


# ═══════════════════════════════════════════════════════════
# UPLOAD
# ═══════════════════════════════════════════════════════════
@router.post("/upload", response_model=FichierResponse)
def upload_fichier(
    request: Request,
    file: UploadFile = File(...),
    convention_id: Optional[UUID] = None,
    reunion_id: Optional[UUID] = None,
    budget_id: Optional[UUID] = None,
    comite_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print("=" * 50)
    print("📤 UPLOAD FICHIER")
    print(f"📄 Fichier: {file.filename}")
    print(f"📄 Type: {file.content_type}")
    print(f"🔍 convention_id reçu: {convention_id}")
    print(f"🔍 reunion_id reçu: {reunion_id}")
    print(f"🔍 budget_id reçu: {budget_id}")
    print(f"🔍 comite_id reçu: {comite_id}")
    print("=" * 50)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé")

    if comite_id:
        upload_dir = f"/app/uploads/comites/{comite_id}"
    elif budget_id:
        upload_dir = f"/app/uploads/budgets/{budget_id}"
    elif convention_id:
        upload_dir = f"/app/uploads/conventions/{convention_id}"
    else:
        raise HTTPException(status_code=400, detail="Veuillez préciser une convention, budget ou comité")

    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    fichier = Fichier(
        nom_fichier=file.filename,
        type_fichier=file.content_type,
        taille=file.size or 0,
        chemin=file_path,
        convention_id=convention_id if not (budget_id or comite_id) else None, 
        budget_id=budget_id,
        comite_id=comite_id
    )
    db.add(fichier)
    db.flush()

    type_fichier = "Convention signée"
    if comite_id:
        comite = db.query(Comite).filter(Comite.id == comite_id).first()
        if comite:
            date_str = datetime.now().strftime('%Y-%m-%d')
            new_reunion = {
                "id": f"reunion_{uuid.uuid4()}",
                "date": date_str,
                "pv": {
                    "id": str(fichier.id),
                    "nom": file.filename,
                    "titre": f"PV_{comite.type}_{date_str}",
                    "date": date_str
                }
            }
            reunions = comite.reunions or []
            reunions.append(new_reunion)
            comite.reunions = reunions
            db.add(comite)
            type_fichier = "PV de comité"
            print(f"✅ Réunion ajoutée au comité {comite_id}")
    elif budget_id:
        type_fichier = "Justificatif budget"

    if convention_id and not (budget_id or comite_id):
        convention = db.query(Convention).filter(Convention.id == convention_id).first()
        if convention:
            convention.signe = True
            db.add(convention)
            print(f"✅ Convention {convention_id} marquée comme signée")

    db.commit()
    db.refresh(fichier)

    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="upload",
        description=f"Fichier uploadé: {file.filename} ({type_fichier})",
        details={
            "fichier_nom": file.filename,
            "fichier_taille": file.size,
            "type_fichier": type_fichier,
            "fichier_id": str(fichier.id),
            "comite_id": str(comite_id) if comite_id else None,
            "budget_id": str(budget_id) if budget_id else None
        },
        convention_id=convention_id,
        request=request
    )

    return fichier


# ═══════════════════════════════════════════════════════════
# GET - Fichiers par convention
# ═══════════════════════════════════════════════════════════
@router.get("/convention/{convention_id}", response_model=List[FichierResponse])
def get_fichiers_convention(
    convention_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Fichier).filter(Fichier.convention_id == convention_id).all()


# ═══════════════════════════════════════════════════════════
# GET - Fichiers par budget
# ═══════════════════════════════════════════════════════════
@router.get("/budget/{budget_id}", response_model=List[FichierResponse])
def get_fichiers_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Fichier).filter(Fichier.budget_id == budget_id).all()


# ═══════════════════════════════════════════════════════════
# GET - Fichiers par comité
# ═══════════════════════════════════════════════════════════
@router.get("/comite/{comite_id}", response_model=List[FichierResponse])
def get_fichiers_comite(
    comite_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les fichiers d'un comité (PV, documents)"""
    return db.query(Fichier).filter(Fichier.comite_id == comite_id).all()


# ═══════════════════════════════════════════════════════════
# GET - Télécharger un fichier
# ═══════════════════════════════════════════════════════════
@router.get("/{fichier_id}")
def download_fichier(
    request: Request,
    fichier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Télécharger n'importe quel fichier par son ID"""
    fichier = db.query(Fichier).filter(Fichier.id == fichier_id).first()
    if not fichier:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    if not os.path.exists(fichier.chemin):
        raise HTTPException(status_code=404, detail="Fichier physique non trouvé")

    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="download",
        description=f"Fichier téléchargé: {fichier.nom_fichier}",
        details={
            "fichier_nom": fichier.nom_fichier,
            "fichier_id": str(fichier.id),
            "taille": fichier.taille,
            "type": fichier.type_fichier
        },
        convention_id=fichier.convention_id,
        request=request
    )

    return FileResponse(
        path=fichier.chemin,
        filename=fichier.nom_fichier,
        media_type=fichier.type_fichier or "application/octet-stream"
    )


# ═══════════════════════════════════════════════════════════
# DELETE - Supprimer un fichier
# ═══════════════════════════════════════════════════════════
@router.delete("/{fichier_id}")
def delete_fichier(
    request: Request,
    fichier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fichier = db.query(Fichier).filter(Fichier.id == fichier_id).first()
    if not fichier:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    nom_fichier = fichier.nom_fichier
    convention_id = fichier.convention_id
    chemin = fichier.chemin
    type_fichier = fichier.type_fichier

    historique_service = HistoriqueService(db)
    historique_service.log_action(
        user_id=current_user.id,
        action="suppression",
        description=f"Fichier supprimé: {nom_fichier}",
        details={
            "fichier_nom": nom_fichier,
            "fichier_id": str(fichier_id),
            "type": type_fichier,
            "taille": fichier.taille
        },
        convention_id=convention_id,
        request=request
    )

    if os.path.exists(chemin):
        os.remove(chemin)

    db.delete(fichier)
    db.commit()
    return {"message": "Fichier supprimé avec succès"}


# ═══════════════════════════════════════════════════════════
# POST - Extraction OCR + IA (✅ CORRIGÉ)
# ═══════════════════════════════════════════════════════════
@router.post("/extract")
async def extract_convention(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),                # ✅ Injecter la session
    current_user: User = Depends(get_current_user)
):
    """
    Reçoit un fichier (PDF ou image), extrait le texte via OCR,
    puis envoie à Groq API pour structurer les champs.
    """
    print("\n" + "=" * 60)
    print("🚀 ROUTE /extract APPELÉE")
    print(f"📁 Fichier: {file.filename}")
    print(f"📁 Content-Type: {file.content_type}")
    print("=" * 60)

    file_bytes = await file.read()
    print(f"📦 Taille lue: {len(file_bytes)} octets")
    print(f"📦 Magic bytes: {file_bytes[:8].hex()}")

    result = process_document(file_bytes, file.content_type)

    print(f"\n🏁 Résultat retourné: {list(result.keys()) if isinstance(result, dict) else 'non-dict'}")

    # ✅ Enregistrer dans l'historique avec la session injectée
    try:
        historique_service = HistoriqueService(db)
        historique_service.log_action(
            user_id=current_user.id,
            action="consultation",
            description=f"Extraction OCR du fichier: {file.filename}",
            details={
                "fichier_nom": file.filename,
                "type": file.content_type,
                "resultat": "success" if result and not result.get('error') else "error"
            },
            request=request
        )
        db.commit()
        print("✅ Log d'extraction enregistré")
    except Exception as e:
        print(f"❌ Erreur log extraction: {e}")
        db.rollback()

    return result