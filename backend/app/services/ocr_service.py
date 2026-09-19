import pytesseract
from PIL import Image
import pdfplumber
import fitz  # PyMuPDF
import io
import os
import re
import json
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime
from dateutil.relativedelta import relativedelta

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# ─────────────────────────────────────────
# 1. EXTRACTION DU TEXTE
# ─────────────────────────────────────────

def extract_text_from_pdf_native(file_bytes: bytes) -> str:
    """Extrait le texte d'un PDF natif (texte sélectionnable)"""
    print("📄 [PDF NATIF] Début extraction via pdfplumber...")
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        print(f"📄 [PDF NATIF] Nombre de pages : {len(pdf.pages)}")
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            print(f"   → Page {i+1} : {len(page_text)} caractères")
            text += page_text
    result = text.strip()
    print(f"📄 [PDF NATIF] Total extrait : {len(result)} caractères")
    return result


def extract_text_from_pdf_scanned(file_bytes: bytes) -> str:
    """Extrait le texte d'un PDF scanné via OCR Tesseract"""
    print("🔍 [PDF SCANNÉ] Début OCR via Tesseract...")
    text = ""
    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    print(f"🔍 [PDF SCANNÉ] Nombre de pages : {len(pdf_document)}")
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        page_text = pytesseract.image_to_string(img, lang="fra+ara+eng")
        print(f"   → Page {page_num + 1} : {len(page_text)} caractères OCR")
        text += page_text + "\n"
    result = text.strip()
    print(f"🔍 [PDF SCANNÉ] Total extrait : {len(result)} caractères")
    return result


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extrait le texte d'une image via OCR Tesseract"""
    print("🖼️ [IMAGE] Début OCR via Tesseract...")
    img = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(img, lang="fra+ara+eng")
    result = text.strip()
    print(f"🖼️ [IMAGE] Total extrait : {len(result)} caractères")
    return result


def extract_text(file_bytes: bytes, content_type: str = None) -> str:
    """Fonction principale — détecte le type et extrait le texte"""

    # ═══════════════════════════════════════════════
    # 🔍 DEBUG
    # ═══════════════════════════════════════════════
    print("\n" + "=" * 60)
    print("🔍 EXTRACT_TEXT APPELÉ")
    print(f"   content_type reçu : '{content_type}'")
    print(f"   taille fichier    : {len(file_bytes)} octets")
    print(f"   magic bytes       : {file_bytes[:8].hex()}")

    # 🎯 Détection robuste par magic bytes (impossible à tromper)
    is_pdf  = file_bytes[:4] == b"%PDF"
    is_jpeg = file_bytes[:2] == b"\xff\xd8"
    is_png  = file_bytes[:8] == b"\x89PNG\r\n\x1a\n"

    print(f"   détection → PDF: {is_pdf}, JPEG: {is_jpeg}, PNG: {is_png}")
    print("=" * 60)

    # ─────────────────────────────────────────────
    # CAS PDF
    # ─────────────────────────────────────────────
    if is_pdf or content_type == "application/pdf":
        print("📄 Type détecté : PDF")
        text = extract_text_from_pdf_native(file_bytes)

        # Fallback OCR si PDF natif vide (PDF scanné)
        if not text or len(text) < 50:
            print("⚠️ PDF natif vide ou trop court → passage en OCR Tesseract")
            text = extract_text_from_pdf_scanned(file_bytes)

        return text

    # ─────────────────────────────────────────────
    # CAS IMAGE
    # ─────────────────────────────────────────────
    elif is_jpeg or is_png or content_type in ["image/jpeg", "image/png", "image/jpg"]:
        print("🖼️ Type détecté : IMAGE")
        return extract_text_from_image(file_bytes)

    # ─────────────────────────────────────────────
    # TYPE NON SUPPORTÉ
    # ─────────────────────────────────────────────
    else:
        print(f"❌ TYPE NON SUPPORTÉ : '{content_type}'")
        print(f"   magic bytes : {file_bytes[:8].hex()}")
        return ""


# ─────────────────────────────────────────
# 2. EXTRACTION DES CHAMPS VIA GROQ API
# ─────────────────────────────────────────

def extract_fields_with_groq(text: str) -> dict:
    """Envoie le texte à Groq API et retourne les champs structurés"""

    print(f"\n🤖 GROQ API — {len(text)} caractères à analyser")

    # ⚠️ Tronquer si trop long (limite de tokens)
    MAX_CHARS = 25000
    if len(text) > MAX_CHARS:
        print(f"⚠️ Texte tronqué : {len(text)} → {MAX_CHARS} caractères")
        text = text[:MAX_CHARS]

    prompt = f"""
Tu es un assistant spécialisé dans l'analyse de conventions de partenariat universitaires.

Voici le texte extrait d'une convention de partenariat :

{text}

Extrais et retourne UNIQUEMENT un objet JSON valide avec ces champs :

================================================================
1. IDENTIFICATION
================================================================
- "intitule": "titre complet de la convention"
- "type": "Convention cadre / Convention spécifique / Mémorandum / Avenant / Contrat / Entente"
- "mode_renouvellement": "Tacitement / Par avenant / Concertation des parties / Non renouvelable / etc."

================================================================
2. DATES ET DURÉE
================================================================
- "date_signature": "YYYY-MM-DD ou null"
- "date_expiration": "YYYY-MM-DD ou null" (si explicitement mentionnée)
- "duree_annees": nombre d'années de la convention (ex: 1, 2, 3, 5)

================================================================
3. SIGNATAIRE UM5
================================================================
- "signataire_um5": "Présidence UM5" ou le nom d'un établissement (FLSH, FMD, ENS, etc.)
- "signataire_um5_autre": si le signataire n'est pas dans la liste standard, mets son nom ici

================================================================
4. PARTENAIRES
================================================================
- "partenaires": [
    {{
        "nom": "nom du partenaire",
        "type": "PUBLIC / PRIVE / ASSOCIATION / ONG / SEMI_PUBLIC",
        "ville": "ville du partenaire",
        "region": "région du partenaire",
        "pays": "pays du partenaire",
        "signataire": "nom du signataire pour ce partenaire"
    }}
  ]

================================================================
5. OPTIONS (boolean)
================================================================
- "avec_budget": true ou false
- "validation_conseil": true ou false
- "formation_continue": true ou false

================================================================
6. MOTS-CLÉS
================================================================
- "mots_cles": ["mot1", "mot2", "mot3", ...]

================================================================
7. ARTICLES DE LA CONVENTION
================================================================
Extrais le contenu de CHACUN des articles suivants s'ils sont présents :
- "objet": "Objet de la convention"
- "objectif": "Objectifs visés par la convention"
- "engagement_um5": "Engagements de l'UM5"
- "engagement_partenaire": "Engagements du partenaire"
- "engagement_commun": "Engagements communs"
- "principaux_domaines": "Principaux domaines de coopération"
- "communication": "Modalités de communication"
- "reglement_litiges": "Règlement des litiges"
- "forces_majeurs": "Cas de force majeure"
- "modification_resiliation": "Modification et résiliation"
- "confidentialite": "Clauses de confidentialité"
- "protection_donnees": "Protection des données personnelles"
- "propriete_intellectuelle": "Propriété intellectuelle"

================================================================
8. ARTICLES PERSONNALISÉS
================================================================
Si tu trouves d'autres articles avec des TITRES DIFFÉRENTS dans le document
(ex: "Dispositions particulières", "Clause sociale", "Durée", "Signature", etc.),
extrais-les dans un objet "autres_articles" avec leur titre comme clé.

================================================================
9. COMITÉS (avec leurs tâches)
================================================================
Extrais les comités mentionnés dans la convention. Chaque comité doit contenir :
- "type": "PILOTAGE" / "SUIVI" / "TECHNIQUE" / "SCIENTIFIQUE"
- "frequence": "Hebdomadaire" / "Mensuelle" / "Bimestrielle" / "Trimestrielle" / "Semestrielle" / "Annuelle"
- "membres": ["nom1", "nom2", ...]
- "taches": ["tâche1", "tâche2", ...]

Exemple: "comites": [
  {{
    "type": "PILOTAGE",
    "frequence": "Mensuelle",
    "membres": ["Dr. Ahmed", "Pr. Fatima"],
    "taches": [
      "Valider les rapports d'avancement",
      "Décider des orientations stratégiques"
    ]
  }}
]

================================================================
10. BUDGET
================================================================
Extrais les informations budgétaires si présentes :
- "budget": {{
    "modalitePaiement": "modalités de paiement (ex: Versement annuel en 2 tranches)",
    "devise": "MAD / EUR / USD",
    "montantTotal": nombre (en devise),
    "montantRecu": nombre (en devise),
    "montantDepense": nombre (en devise),
    "commentaire": "commentaire sur le budget"
  }}

================================================================
11. STATUT
================================================================
- "statut": "EN_COURS" par défaut, ou déduit de la date d'expiration

================================================================
IMPORTANT:
- Si un champ n'est pas présent dans le document, mets-le à null ou [] pour les listes
- Pour "partenaires", extrais tous les partenaires mentionnés
- Pour "comites", extrais tous les comités mentionnés
- Le JSON doit être valide et bien formé

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.
"""

    try:
        print("📡 Envoi requête à Groq...")
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "Tu réponds TOUJOURS en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=3000,
            timeout=60.0
        )

        content = response.choices[0].message.content.strip()
        print(f"✅ Réponse Groq reçue ({len(content)} caractères)")
        print(f"   Aperçu : {content[:300]}...")

        # 🔧 Nettoyage robuste du JSON
        content = re.sub(r"```json\s*", "", content)
        content = re.sub(r"```", "", content).strip()

        # 🔧 Extraire juste l'objet JSON si Groq ajoute du texte
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            content = match.group(0)

        parsed = json.loads(content)
        print("✅ JSON parsé avec succès")
         # 🔧 APLATIR
        parsed = flatten_groq_response(parsed)
        print(f"🔍 Clés après aplatissement: {list(parsed.keys())}")

        return parsed

    except json.JSONDecodeError as e:
        print(f"❌ JSON INVALIDE : {e}")
        print(f"   Contenu problématique : {content[:500]}")
        return {
            "error": f"JSON invalide retourné par l'IA : {e}",
            "message": "Veuillez remplir manuellement"
        }

    except Exception as e:
        print(f"❌ Erreur Groq : {type(e).__name__} - {e}")
        return {
            "error": str(e),
            "message": "Extraction IA indisponible — veuillez remplir manuellement"
        }


# ─────────────────────────────────────────
# 3. CALCUL DE LA DATE D'EXPIRATION
# ─────────────────────────────────────────
def flatten_groq_response(data: dict) -> dict:
    """Aplatit une réponse Groq imbriquée en structure plate"""
    flat = {}
    for key, value in data.items():
        if isinstance(value, dict):
            print(f"🔧 Aplatissement section '{key}' → {list(value.keys())}")
            flat.update(value)
        else:
            flat[key] = value
    return flat
def calculer_date_expiration(date_signature: str, duree_annees: int) -> str:
    """
    Calcule la date d'expiration à partir de la date de signature et de la durée
    """
    if not date_signature or not duree_annees:
        return None

    try:
        date_sig = datetime.strptime(date_signature, "%Y-%m-%d").date()
        date_exp = date_sig + relativedelta(years=duree_annees)
        # Soustraire 1 jour pour que l'expiration soit la veille de la date anniversaire
        date_exp = date_exp - relativedelta(days=1)
        return date_exp.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"⚠️ Erreur calcul date expiration: {e}")
        return None


# ─────────────────────────────────────────
# 4. FONCTION PRINCIPALE
# ─────────────────────────────────────────

def process_document(file_bytes: bytes, content_type: str) -> dict:
    """Fonction principale — extrait le texte puis les champs"""

    print("\n" + "🚀" * 30)
    print("🚀 PROCESS_DOCUMENT DÉMARRÉ")
    print("🚀" * 30)

    # ─── Étape 1 : Extraction du texte ───
    print("\n📌 ÉTAPE 1 : Extraction du texte")
    text = extract_text(file_bytes, content_type)

    if not text:
        print("❌ ÉTAPE 1 ÉCHOUÉE : aucun texte extrait")
        return {
            "error": "Impossible d'extraire le texte du document",
            "message": "Veuillez remplir la fiche manuellement",
            "debug": {
                "content_type_recu": content_type,
                "taille_fichier": len(file_bytes),
                "magic_bytes": file_bytes[:8].hex()
            }
        }

    print(f"✅ ÉTAPE 1 RÉUSSIE : {len(text)} caractères extraits")
    print(f"   Aperçu : {text[:200]}...")

    # ─── Étape 2 : Extraction des champs via Groq ───
    print("\n📌 ÉTAPE 2 : Extraction des champs via Groq")
    fields = extract_fields_with_groq(text)

    if "error" in fields:
        print(f"❌ ÉTAPE 2 ÉCHOUÉE : {fields['error']}")
        return fields

    print("✅ ÉTAPE 2 RÉUSSIE")

    # ─── Étape 3 : Calcul de la date d'expiration ───
    date_signature = fields.get("date_signature")
    date_expiration = fields.get("date_expiration")
    duree_annees = fields.get("duree_annees")

    if not date_expiration and date_signature and duree_annees:
        date_expiration = calculer_date_expiration(date_signature, duree_annees)
        print(f"📅 Date d'expiration calculée : {date_expiration}")

    # ─── Étape 4 : Construction de la réponse structurée ───
    comites = fields.get("comites", [])
    if comites:
        print(f"📋 Comités extraits : {len(comites)}")
        for c in comites:
            taches = c.get('taches', [])
            print(f"   - {c.get('type')} - {len(taches)} tâches")
            for t in taches:
                print(f"      • {t}")

    budget = fields.get("budget")
    if budget:
        print(f"💰 Budget extrait : {budget.get('montantTotal', 0)} {budget.get('devise', 'MAD')}")

    result = {
        # Identification
        "intitule": fields.get("intitule", ""),
        "type": fields.get("type", ""),
        "mode_renouvellement": fields.get("mode_renouvellement", ""),

        # Dates
        "date_signature": date_signature,
        "date_expiration": date_expiration,
        "duree_annees": duree_annees,

        # Signataire UM5
        "signataire_um5": fields.get("signataire_um5", ""),
        "signataire_um5_autre": fields.get("signataire_um5_autre", ""),
        "signataire_partenaire": fields.get("signataire_partenaire", ""),
        "signataire_partenaire_autre": fields.get("signataire_partenaire_autre", ""),

        # Partenaires
        "partenaires": fields.get("partenaires", []),

        # Options
        "avec_budget": fields.get("avec_budget", False),
        "validation_conseil": fields.get("validation_conseil", False),
        "formation_continue": fields.get("formation_continue", False),

        # Mots-clés
        "mots_cles": fields.get("mots_cles", []),

        # Articles
        "articles": {
            "objet": fields.get("objet", ""),
            "objectif": fields.get("objectif", ""),
            "engagement_um5": fields.get("engagement_um5", ""),
            "engagement_partenaire": fields.get("engagement_partenaire", ""),
            "engagement_commun": fields.get("engagement_commun", ""),
            "principaux_domaines": fields.get("principaux_domaines", ""),
            "communication": fields.get("communication", ""),
            "reglement_litiges": fields.get("reglement_litiges", ""),
            "forces_majeurs": fields.get("forces_majeurs", ""),
            "modification_resiliation": fields.get("modification_resiliation", ""),
            "confidentialite": fields.get("confidentialite", ""),
            "protection_donnees": fields.get("protection_donnees", ""),
            "propriete_intellectuelle": fields.get("propriete_intellectuelle", ""),
            **(fields.get("autres_articles", {}))
        },

        # Comités
        "comites": comites,

        # Budget
        "budget": budget,

        # Statut
        "statut": fields.get("statut", "EN_COURS"),

        # Texte brut pour aperçu
        "texte_brut": text[:500]
    }

    print("\n🏁 PROCESS_DOCUMENT TERMINÉ AVEC SUCCÈS")
    print("🏁" * 30 + "\n")

    return result