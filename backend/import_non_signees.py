"""
Import d'un fichier Excel minimal (Partenaire + Objet) → conventions NON SIGNÉES.
Utilisation : python /app/import_non_signees.py /app/non_signees.xlsx
"""
import sys
import re
import pandas as pd
from datetime import datetime, date
from pathlib import Path

# ✅ CORRECTION : remonter 1 seul niveau (le fichier est dans /app/)
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import SessionLocal
from app.models.convention import Convention
from app.models.partenaire import Partenaire
from app.models.user import User


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def normalize(s):
    s = str(s).strip().lower()
    for a, b in [('é','e'), ('è','e'), ('ê','e'), ('à','a'), ('ç','c'), ('ù','u'), ('û','u')]:
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s)


def find_column(df, keywords):
    """Trouve une colonne par mots-clés (recherche floue)."""
    for col in df.columns:
        col_norm = normalize(col)
        for kw in keywords:
            if normalize(kw) in col_norm:
                return col
    return None


def get_val(row, col):
    """Accès sécurisé (renvoie toujours une valeur scalaire)."""
    if col is None:
        return None
    try:
        v = row[col]
    except (KeyError, IndexError):
        return None
    if isinstance(v, pd.Series):
        return v.iloc[0]
    return v


def clean(value):
    if pd.isna(value) or value is None:
        return ''
    s = str(value).strip()
    if s in ['_', '-', 'nan', 'None', 'NaN', 'N/A']:
        return ''
    return s


def generer_numero(db, annee):
    """Génère un numéro unique NN/YY pour l'année donnée."""
    suffixe = f"/{str(annee)[-2:]}"
    conventions_annee = db.query(Convention).filter(
        Convention.numero_reference.like(f"%{suffixe}")
    ).all()

    numeros = []
    for c in conventions_annee:
        if c.numero_reference:
            try:
                numeros.append(int(c.numero_reference.split('/')[0]))
            except (ValueError, IndexError):
                continue

    prochain = max(numeros, default=0) + 1
    numero = f"{prochain:02d}/{str(annee)[-2:]}"

    tentative = 0
    while db.query(Convention).filter(
        Convention.numero_reference == numero
    ).first() and tentative < 100:
        prochain += 1
        numero = f"{prochain:02d}/{str(annee)[-2:]}"
        tentative += 1

    return numero


# ═══════════════════════════════════════════════════════════
# IMPORT
# ═══════════════════════════════════════════════════════════

def import_non_signees(excel_path, sheet_name=0):
    print(f"\n{'=' * 70}")
    print(f"📂 Fichier : {excel_path}")
    print(f"📋 Feuille : {sheet_name}")
    print(f"{'=' * 70}\n")

    db = SessionLocal()

    try:
        admin = db.query(User).filter(User.is_admin == True).first()
        if not admin:
            print("❌ Aucun admin trouvé !")
            return
        print(f"👤 Importé par : {admin.email}\n")

        # Lire le fichier
        df = pd.read_excel(excel_path, sheet_name=sheet_name)

        # Nettoyer les noms de colonnes
        df.columns = [str(c).strip() for c in df.columns]

        # ═══════════════════════════════════════════════════════
        # DÉTECTION DES COLONNES
        # ═══════════════════════════════════════════════════════
        col_partenaire = find_column(df, ['partenaire', 'partner'])
        col_objet      = find_column(df, ['objet', 'object', 'sujet'])

        # ✅ FALLBACK : si pas trouvé → prendre par position
        if not col_partenaire and len(df.columns) >= 2:
            col_partenaire = df.columns[1]
            print(f"⚠️ Fallback : Partenaire = '{col_partenaire}' (colonne 2)")

        if not col_objet and len(df.columns) >= 3:
            col_objet = df.columns[2]
            print(f"⚠️ Fallback : Objet = '{col_objet}' (colonne 3)")

        print(f"🔍 Colonnes du fichier : {list(df.columns)}")
        print(f"🔍 Colonnes utilisées :")
        print(f"   Partenaire : {col_partenaire}")
        print(f"   Objet      : {col_objet}")
        print(f"   Signé      : NON (toutes non signées)\n")

        if not col_partenaire:
            print("❌ Impossible de détecter la colonne Partenaire.")
            return

        # Année courante
        annee_courante = datetime.now().year

        imported = 0
        skipped = 0
        errors = 0

        for index, row in df.iterrows():
            try:
                partenaire_nom = clean(get_val(row, col_partenaire))
                objet_val      = clean(get_val(row, col_objet))

                # Ignorer les lignes vides
                if not partenaire_nom and not objet_val:
                    skipped += 1
                    continue

                # Générer le numéro
                numero = generer_numero(db, annee_courante)
                print(f"   ✅ NEW  : {numero}  ← {partenaire_nom[:50]}")

                # Créer la convention (NON SIGNÉE par défaut)
                convention = Convention(
                    numero_reference=numero,
                    intitule='_',
                    date_signature=None,
                    date_expiration=None,
                    signataire_um5='presidence',
                    signe=False,                      # ✅ NON SIGNÉE
                    statut='EN_COURS',
                    user_id=admin.id,
                    articles={
                        'objet': objet_val or '',
                        'objectif': '',
                        'engagement_um5': '',
                        'engagement_partenaire': '',
                    },
                    mots_cles=[],
                    avec_budget=False,
                    validation_conseil=False,
                    formation_continue=False,
                )
                db.add(convention)
                db.flush()

                # Créer le partenaire
                if partenaire_nom:
                    db.add(Partenaire(
                        nom=partenaire_nom,
                        type='PRIVE',
                        ville='',
                        region='',
                        pays='Maroc',
                        convention_id=convention.id
                    ))

                imported += 1

            except Exception as e:
                errors += 1
                print(f"   ❌ Ligne {index + 2} : {e}")
                db.rollback()
                continue

        db.commit()

        print(f"\n{'=' * 70}")
        print(f"✅ IMPORT TERMINÉ")
        print(f"   ✅ {imported} conventions non signées créées")
        print(f"   ⏭️  {skipped} lignes ignorées")
        print(f"   ❌ {errors} erreurs")
        print(f"{'=' * 70}\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur globale : {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage : python /app/import_non_signees.py /app/non_signees.xlsx [nom_feuille]")
        sys.exit(1)

    excel_path = sys.argv[1]
    sheet = sys.argv[2] if len(sys.argv) > 2 else 0

    import_non_signees(excel_path, sheet_name=sheet)