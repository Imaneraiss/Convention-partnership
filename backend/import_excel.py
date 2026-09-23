"""
Import Excel multi-feuilles (2018 à 2026).
Utilisation : python import_excel.py /app/conventions.xlsx
"""
import sys
import re
import pandas as pd
from datetime import datetime, date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.convention import Convention
from app.models.partenaire import Partenaire
from app.models.comite import Comite
from app.models.budget import Budget
from app.models.user import User


# ═══════════════════════════════════════════════════════════
# NORMALISATION & DÉTECTION
# ═══════════════════════════════════════════════════════════

def normalize(s):
    s = str(s).strip().lower()
    for a, b in [('é','e'), ('è','e'), ('ê','e'), ('à','a'), ('ç','c'), ('ù','u'), ('û','u')]:
        s = s.replace(a, b)
    s = re.sub(r'\s+', ' ', s)
    return s


def find_column(df, keywords):
    """Recherche floue (mot-clé inclus)."""
    for col in df.columns:
        col_norm = normalize(col)
        for kw in keywords:
            if normalize(kw) in col_norm:
                return col
    return None


def find_column_exact(df, names):
    """Correspondance exacte (après normalisation)."""
    noms = [normalize(n) for n in names]
    for col in df.columns:
        if normalize(col) in noms:
            return col
    return None


def find_column_strict(df, includes, excludes=None):
    """Contient un des `includes` ET aucun des `excludes`."""
    excludes = [normalize(e) for e in (excludes or [])]
    for col in df.columns:
        col_norm = normalize(col)
        if any(normalize(i) in col_norm for i in includes) and \
           not any(e in col_norm for e in excludes):
            return col
    return None


# ═══════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════

def get_val(row, col):
    """Accès sécurisé : renvoie TOUJOURS une valeur scalaire (jamais un Series)."""
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
    if value is None:
        return ''
    if pd.isna(value):
        return ''
    s = str(value).strip()
    if s in ['_', '-', 'nan', 'None', 'NaN', 'N/A', 'Non définie', 'Non definie', 'Non défini']:
        return ''
    return s


def parse_date(value):
    """Parse une date. Accepte aussi une année seule (ex: 2018)."""
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.date()

    v = clean(value)
    if not v:
        return None

    if re.fullmatch(r'\d{4}(\.0)?', v):
        return date(int(v.split('.')[0]), 1, 1)

    for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%d.%m.%Y', '%m/%d/%Y', '%d/%m/%y']:
        try:
            return datetime.strptime(v.split(' ')[0], fmt).date()
        except (ValueError, IndexError):
            continue
    return None


def parse_float(value):
    v = clean(value)
    if not v:
        return 0.0
    v_clean = re.sub(r'[^\d.,]', '', v).replace(',', '.')
    try:
        return float(v_clean)
    except ValueError:
        return 0.0


def parse_bool(value):
    v = clean(value).lower()
    return v in ['oui', 'yes', 'true', '1', 'vrai', 'نعم']


def map_type_partenaire(value):
    v = clean(value).lower()
    if 'semi' in v and 'public' in v:
        return 'SEMI_PUBLIC'
    if 'public' in v:
        return 'PUBLIC'
    if 'priv' in v:
        return 'PRIVE'
    if 'ong' in v or 'association' in v:
        return 'ONG'
    return 'PRIVE'


def map_type_convention(value):
    v = clean(value).lower()
    if not v:
        return 'Convention cadre'
    if 'cadre' in v:
        return 'Convention cadre'
    if 'specifique' in v:
        return 'Convention spécifique'
    if 'cooperation' in v:
        return 'Convention de coopération'
    if 'partenariat' in v:
        return 'Convention de partenariat'
    if 'memorandum' in v:
        return 'Mémorandum'
    if 'avenant' in v:
        return 'Avenant'
    if 'contrat' in v:
        return 'Contrat'
    if 'entente' in v:
        return 'Entente'
    return 'Convention cadre'


def map_frequence(value):
    v = clean(value).lower()
    if not v:
        return 'Annuelle'
    if 'semestre' in v:
        return 'Semestrielle'
    if 'trimestre' in v:
        return 'Trimestrielle'
    if 'bimestre' in v:
        return 'Bimestrielle'
    if 'mois' in v:
        return 'Mensuelle'
    if 'an' in v:
        return 'Annuelle'
    return 'Annuelle'


def parse_membres(value):
    v = clean(value)
    if not v:
        return []
    lines = re.split(r'[\n;•]|(?:^|\s)-\s', v)
    membres = []
    for line in lines:
        line = line.strip().lstrip('-').lstrip('•').strip()
        if line and len(line) > 2:
            email_match = re.search(r'\(([^)]+@[^)]+)\)', line)
            email = email_match.group(1) if email_match else ''
            nom = line.split('(')[0].strip() if email_match else line
            membres.append({
                'id': str(len(membres) + 1),
                'nom': nom,
                'email': email,
                'etablissement': ''
            })
    return membres


# ═══════════════════════════════════════════════════════════
# IMPORT D'UNE FEUILLE
# ═══════════════════════════════════════════════════════════

def import_sheet(df, sheet_name, db, admin):
    # ✅ 1. Strip + dédoublonnage des noms de colonnes
    raw_cols = [str(c).strip() for c in df.columns]
    seen = {}
    new_cols = []
    for c in raw_cols:
        if c in seen:
            seen[c] += 1
            new_cols.append(f"{c}__dup{seen[c]}")
        else:
            seen[c] = 0
            new_cols.append(c)
    df.columns = new_cols

    print(f"\n📋 Feuille : {sheet_name}  ({len(df)} lignes)")

    # ── Détection stricte ─────────────────────────────
    col_numero   = find_column(df, ['numero de dossier', 'n° de dossier', 'num dossier'])
    col_annee    = find_column_exact(df, ['Année', 'Annee'])
    col_partenaire = find_column_exact(df, ['Partenaires'])
    col_type_part  = find_column_exact(df, ['Type de partenariat'])
    col_intitule   = find_column_exact(df, ['Intitulé de la convention'])
    col_type_conv  = find_column_exact(df, ['Type de convention'])
    col_um5r       = find_column_exact(df, ['UM5R'])
    col_visa       = find_column_exact(df, ['visa um5'])
    col_etab       = find_column_exact(df, ['Etablissement um5'])
    col_objet      = find_column_exact(df, ['Objet de la convention'])

    col_date_debut = find_column_exact(df, ['Date de début'])
    col_date_fin   = find_column_exact(df, ['Date de fin'])
    col_mode       = find_column_strict(df, ['mode de renouvellement'], excludes=['.1', ' 2'])

    col_comite_pilot = find_column_exact(df, ['Comité de pilotage'])
    col_comite_suivi = find_column_exact(df, ['Comité de suivi'])
    col_comite       = find_column_exact(df, ['Comité'])

    col_freq_pilot = find_column_strict(df, ['frequence'], excludes=['suivi'])
    col_freq_suivi = find_column_strict(df, ['frequence'], excludes=['pilotage'])
    col_freq_comite = find_column(df, ['frequences des reunion du comite'])

    col_membres_pilot_um5  = find_column(df, ['membres de comite de pilotage partie um5'])
    col_membres_suivi_um5  = find_column(df, ['membres de comite de suivi partie um5'])
    col_membres_pilot_part = find_column(df, ['membres de comite de pilotage partie partenaires'])
    col_membres_suivi_part = find_column(df, ['membres de comite de suivi partie partenaires'])

    col_budget    = find_column_exact(df, ['budget'])
    col_modalites = find_column_exact(df, ['Modalités de paiement', 'Modalites de paiement'])

    col_engagement_um5  = find_column(df, ['engagements um5', 'engagement um5'])
    col_engagement_part = find_column(df, ['engagements des partenaires', 'engagement des partenaires'])

    col_valide_conseil = find_column_exact(df, ["Validé par le Conseil de l'UM5",
                                                 "Validé par le conseil de l'UM5"])
    col_formation      = find_column(df, ['clause de la formation continue'])

    print(f"   Numéro       : {col_numero}")
    print(f"   Année        : {col_annee}")
    print(f"   Partenaire   : {col_partenaire}")
    print(f"   Intitulé     : {col_intitule}")
    print(f"   Type conv    : {col_type_conv or col_intitule}")
    print(f"   Date début   : {col_date_debut}")
    print(f"   Date fin     : {col_date_fin}")
    print(f"   Comité pilot : {col_comite_pilot}")
    print(f"   Comité suivi : {col_comite_suivi}")
    print(f"   Fréq pilot   : {col_freq_pilot}")
    print(f"   Fréq suivi   : {col_freq_suivi}")
    print(f"   Budget       : {col_budget}")

    imported = skipped = errors = 0

    for index, row in df.iterrows():
        try:
            numero = clean(get_val(row, col_numero))
            intitule_val = clean(get_val(row, col_intitule))
            partenaire_nom = clean(get_val(row, col_partenaire))

            if not numero and not intitule_val and not partenaire_nom:
                skipped += 1
                continue

            existing = db.query(Convention).filter(
                Convention.numero_reference == numero
            ).first() if numero else None

            if existing:
                convention = existing
                print(f"   🔄 MAJ  : {numero}")
            else:
                convention = Convention(
                    numero_reference=numero or f"TMP-{sheet_name}-{index}",
                    user_id=admin.id
                )
                db.add(convention)
                print(f"   ✅ NEW  : {numero}")

            type_src = get_val(row, col_type_conv) if col_type_conv else intitule_val
            convention.type = map_type_convention(type_src)
            convention.intitule = intitule_val or f"{convention.type} N° {numero}"

            date_debut = parse_date(get_val(row, col_date_debut)) if col_date_debut else None
            date_fin   = parse_date(get_val(row, col_date_fin))   if col_date_fin   else None

            convention.date_signature  = date_debut
            convention.date_expiration = date_fin

            if date_debut and date_fin:
                delta = (date_fin - date_debut).days
                convention.duree_annees = max(1, round(delta / 365.25))

            # ── Signataire UM5 (règle UM5R) ──
            # ⚠️ La valeur doit correspondre EXACTEMENT à la "value" du <option> frontend
            PRESIDENCE_VALUE = 'presidence'   # ← value du dropdown front

            # Règle : si UM5R = "Oui" → c'est la Présidence UM5 qui signe
            um5r_val = clean(get_val(row, col_um5r)) if col_um5r else ''
            etab_val = clean(get_val(row, col_etab)) if col_etab else ''

            if parse_bool(um5r_val):
                convention.signataire_um5 = PRESIDENCE_VALUE
            else:
                convention.signataire_um5 = etab_val or PRESIDENCE_VALUE

            convention.mode_renouvellement = (
                clean(get_val(row, col_mode)) if col_mode else 'Tacitement'
            ) or 'Tacitement'

            convention.articles = {
                'objet': clean(get_val(row, col_objet)) if col_objet else '',
                'engagement_um5': clean(get_val(row, col_engagement_um5)) if col_engagement_um5 else '',
                'engagement_partenaire': clean(get_val(row, col_engagement_part)) if col_engagement_part else '',
                'visa_um5': clean(get_val(row, col_visa)) if col_visa else '',
                'um5r': um5r_val,
                'etablissements': clean(get_val(row, col_comite)) if col_comite else '',
                'comite': clean(get_val(row, col_comite)) if col_comite else '',
                'frequence_comite': clean(get_val(row, col_freq_comite)) if col_freq_comite else '',
            }

            budget_val = parse_float(get_val(row, col_budget)) if col_budget else 0
            convention.avec_budget = (budget_val > 0)
            convention.validation_conseil = parse_bool(get_val(row, col_valide_conseil)) if col_valide_conseil else False
            convention.formation_continue = parse_bool(get_val(row, col_formation)) if col_formation else False
            convention.statut = 'EN_COURS'

            db.flush()

            # ── Partenaire ──
            if partenaire_nom:
                already = db.query(Partenaire).filter(
                    Partenaire.convention_id == convention.id,
                    Partenaire.nom == partenaire_nom
                ).first()
                if not already:
                    db.add(Partenaire(
                        nom=partenaire_nom,
                        type=map_type_partenaire(get_val(row, col_type_part)) if col_type_part else 'PRIVE',
                        ville='', region='', pays='Maroc',
                        convention_id=convention.id
                    ))

            # ── Budget ──
            if budget_val > 0:
                already = db.query(Budget).filter(Budget.convention_id == convention.id).first()
                if not already:
                    db.add(Budget(
                        convention_id=convention.id,
                        montant=budget_val,
                        devise='MAD',
                        modalites_paiement=clean(get_val(row, col_modalites)) if col_modalites else '',
                        budget_recu='NON',
                        montant_depense=0
                    ))

            # ── Comité de SUIVI ──
            comite_suivi_cell      = clean(get_val(row, col_comite_suivi))      if col_comite_suivi      else ''
            membres_suivi_um5_val  = clean(get_val(row, col_membres_suivi_um5)) if col_membres_suivi_um5  else ''
            membres_suivi_part_val = clean(get_val(row, col_membres_suivi_part)) if col_membres_suivi_part else ''
            freq_suivi_val         = clean(get_val(row, col_freq_suivi))        if col_freq_suivi        else ''

            # Créer le comité si AU MOINS UN des critères est renseigné
            if comite_suivi_cell or membres_suivi_um5_val or membres_suivi_part_val or freq_suivi_val:
                already = db.query(Comite).filter(
                    Comite.convention_id == convention.id, Comite.type == 'SUIVI'
                ).first()
                if not already:
                    db.add(Comite(
                        convention_id=convention.id,
                        type='SUIVI',
                        frequence=map_frequence(freq_suivi_val),
                        membres_um5=parse_membres(membres_suivi_um5_val),
                        membres_partenaires=parse_membres(membres_suivi_part_val),
                        taches=[], reunions=[]
                    ))
                    print(f"      👥 Comité SUIVI ajouté")

            # ── Comité de PILOTAGE ──
            comite_pilot_cell      = clean(get_val(row, col_comite_pilot))      if col_comite_pilot      else ''
            membres_pilot_um5_val  = clean(get_val(row, col_membres_pilot_um5)) if col_membres_pilot_um5  else ''
            membres_pilot_part_val = clean(get_val(row, col_membres_pilot_part)) if col_membres_pilot_part else ''
            freq_pilot_val         = clean(get_val(row, col_freq_pilot))        if col_freq_pilot        else ''

            if comite_pilot_cell or membres_pilot_um5_val or membres_pilot_part_val or freq_pilot_val:
                already = db.query(Comite).filter(
                    Comite.convention_id == convention.id, Comite.type == 'PILOTAGE'
                ).first()
                if not already:
                    db.add(Comite(
                        convention_id=convention.id,
                        type='PILOTAGE',
                        frequence=map_frequence(freq_pilot_val),
                        membres_um5=parse_membres(membres_pilot_um5_val),
                        membres_partenaires=parse_membres(membres_pilot_part_val),
                        taches=[], reunions=[]
                    ))
                    print(f"      👥 Comité PILOTAGE ajouté")

            imported += 1

        except Exception as e:
            errors += 1
            print(f"   ❌ Ligne {index + 2} : {e}")
            db.rollback()
            continue

    db.commit()
    return imported, skipped, errors


# ═══════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════

def import_excel(excel_path):
    print(f"\n{'=' * 70}")
    print(f"📂 Fichier : {excel_path}")
    print(f"{'=' * 70}")

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.is_admin == True).first()
        if not admin:
            print("❌ Aucun admin trouvé !")
            return
        print(f"👤 Importé par : {admin.email}")

        xls = pd.ExcelFile(excel_path)
        sheets = [s for s in xls.sheet_names if re.fullmatch(r'\d{4}', str(s).strip())]
        sheets.sort()
        print(f"📄 Feuilles à importer : {sheets}\n")

        total_imported = total_skipped = total_errors = 0
        for sheet in sheets:
            df = pd.read_excel(xls, sheet_name=sheet)
            i, s, e = import_sheet(df, sheet, db, admin)
            total_imported += i
            total_skipped  += s
            total_errors   += e
            print(f"   → {i} importées, {s} ignorées, {e} erreurs")

        print(f"\n{'=' * 70}")
        print(f"✅ IMPORT TERMINÉ")
        print(f"   ✅ {total_imported} conventions")
        print(f"   ⏭️  {total_skipped} lignes ignorées")
        print(f"   ❌ {total_errors} erreurs")
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
        print("❌ Usage : python import_excel.py /app/conventions.xlsx")
        sys.exit(1)
    import_excel(sys.argv[1])