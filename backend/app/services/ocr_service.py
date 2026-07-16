import pytesseract
from PIL import Image
import pdfplumber
import fitz  # PyMuPDF
import io
import os
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
        # Convertit la page en image
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # zoom x2 pour meilleure qualité
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        # OCR sur l'image
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
        # Essaie d'abord l'extraction native
        text = extract_text_from_pdf_native(file_bytes)
        
        # Si texte vide → PDF scanné → utilise OCR
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
{{
    "intitule": "titre complet de la convention",
    "type": "Convention cadre / Convention spécifique / Mémorandum / Avenant / Contrat",
    "partenaire_nom": "nom du partenaire",
    "partenaire_type": "PUBLIC / PRIVE / ONG / SEMI_PUBLIC",
    "partenaire_ville": "ville du partenaire",
    "partenaire_pays": "pays du partenaire",
    "date_signature": "YYYY-MM-DD ou null",
    "date_expiration": "YYYY-MM-DD ou null",
    "mode_renouvellement": "mode de renouvellement ou null",
    "objet": "objet et description de la convention",
    "engagement_universite": "engagements de l'université",
    "engagement_partenaire": "engagements du partenaire",
    "avec_budget": true ou false,
    "mots_cles": ["mot1", "mot2", "mot3"]
}}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.
"""
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )
        
        import json
        content = response.choices[0].message.content.strip()
        
        # Nettoie le JSON si Groq ajoute des backticks
        content = content.replace("```json", "").replace("```", "").strip()
        
        return json.loads(content)
    
    except Exception as e:
        # Si Groq échoue → retourne un dict vide
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
    
    # Ajoute le texte brut dans la réponse
    fields["texte_brut"] = text[:500]  # premiers 500 caractères pour aperçu
    
    return fields
