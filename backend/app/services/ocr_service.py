import pytesseract
from PIL import Image
import pdfplumber
import fitz  # PyMuPDF
import io
import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# ─────────────────────────────────────────
# 1. EXTRACTION DU TEXTE
# ─────────────────────────────────────────

def extract_text_from_pdf_native(file_bytes: bytes) -> str:
    """Extrait le texte d'un PDF natif (texte sélectionnable)"""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text.strip()

def extract_text_from_pdf_scanned(file_bytes: bytes) -> str:
    """Extrait le texte d'un PDF scanné via OCR Tesseract"""
    text = ""
    pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        text += pytesseract.image_to_string(img, lang="fra+ara+eng") + "\n"
    return text.strip()

def extract_text_from_image(file_bytes: bytes) -> str:
    """Extrait le texte d'une image via OCR Tesseract"""
    img = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(img, lang="fra+ara+eng")
    return text.strip()

def extract_text(file_bytes: bytes, content_type: str) -> str:
    """Fonction principale — détecte le type et extrait le texte"""
    
    if content_type == "application/pdf":
        text = extract_text_from_pdf_native(file_bytes)
        if not text or len(text) < 50:
            text = extract_text_from_pdf_scanned(file_bytes)
        return text
    
    elif content_type in ["image/jpeg", "image/png", "image/jpg"]:
        return extract_text_from_image(file_bytes)
    
    else:
        return ""

# ─────────────────────────────────────────
# 2. EXTRACTION DES CHAMPS VIA GROQ API
# ─────────────────────────────────────────

def extract_fields_with_groq(text: str) -> dict:
    """Envoie le texte à Groq API et retourne les champs structurés"""
    
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
2. DATES
================================================================
- "date_signature": "YYYY-MM-DD ou null"
- "date_expiration": "YYYY-MM-DD ou null"

================================================================
3. SIGNATAIRE UM5
================================================================
- "signataire_um5": "Présidence UM5" ou le nom d'un établissement (FLSH, FMD, ENS, etc.)
- "signataire_um5_autre": si le signataire n'est pas dans la liste standard, mets son nom ici

================================================================
4. PARTENAIRES (peut y en avoir plusieurs)
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
Exemple: "autres_articles": {{"Dispositions particulières": "contenu...", "Clause sociale": "contenu..."}}

================================================================
9. STATUT
================================================================
- "statut": "EN_COURS" par défaut, ou déduit de la date d'expiration

================================================================
IMPORTANT:
- Si un champ n'est pas présent dans le document, mets-le à null ou [] pour les listes
- Pour "partenaires", extrais tous les partenaires mentionnés
- Pour "autres_articles", ne mets que les articles qui ont un titre différent de ceux déjà listés
- Le JSON doit être valide et bien formé

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.
"""
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=2000  # Augmenté pour les articles
        )
        
        content = response.choices[0].message.content.strip()
        
        # Nettoie le JSON si Groq ajoute des backticks
        content = content.replace("```json", "").replace("```", "").strip()
        print("🔍 Réponse Groq brute:", content)
        print("🔍 JSON parsé:", json.loads(content))
        return json.loads(content)
    
    except Exception as e:
        return {
            "error": str(e),
            "message": "Extraction IA indisponible — veuillez remplir manuellement"
        }

# ─────────────────────────────────────────
# 3. FONCTION PRINCIPALE
# ─────────────────────────────────────────

def process_document(file_bytes: bytes, content_type: str) -> dict:
    """Fonction principale — extrait le texte puis les champs"""
    
    # Étape 1 — Extrait le texte
    text = extract_text(file_bytes, content_type)
    
    if not text:
        return {
            "error": "Impossible d'extraire le texte du document",
            "message": "Veuillez remplir la fiche manuellement"
        }
    
    # Étape 2 — Extrait les champs via Groq
    fields = extract_fields_with_groq(text)
    
    # Si erreur, retourne l'erreur
    if "error" in fields:
        return fields
    
    # Construction de la réponse structurée
    result = {
        # Identification
        "intitule": fields.get("intitule", ""),
        "type": fields.get("type", ""),
        "mode_renouvellement": fields.get("mode_renouvellement", ""),
        
        # Dates
        "date_signature": fields.get("date_signature", ""),
        "date_expiration": fields.get("date_expiration", ""),
        
        # Signataire UM5
        "signataire_um5": fields.get("signataire_um5", ""),
        "signataire_um5_autre": fields.get("signataire_um5_autre", ""),
        
        # Partenaires (avec signataire)
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
            # Articles personnalisés
            **(fields.get("autres_articles", {}))
        },
        
        # Statut
        "statut": fields.get("statut", "EN_COURS"),
        
        # Texte brut pour aperçu
        "texte_brut": text[:500]
    }
    
    return result