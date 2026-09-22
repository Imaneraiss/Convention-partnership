# ═══════════════════════════════════════════════════════════
# SERVICE D'EXPORT WORD (FR / AR)
# Utilise docxtpl pour remplir les templates
# ═══════════════════════════════════════════════════════════

from docxtpl import DocxTemplate
from io import BytesIO
from datetime import datetime
from pathlib import Path


class WordExportService:
    """Service de génération de conventions Word bilingues (FR/AR)."""

    def __init__(self):
        # Dossier des templates : backend/templates/
        self.templates_dir = Path(__file__).parent.parent.parent / "templates"
        self.templates_dir.mkdir(exist_ok=True)

    # ═══════════════════════════════════════════════════════
    # FORMATAGE DES DATES
    # ═══════════════════════════════════════════════════════
    def _format_date_fr(self, date_value):
        """Formate une date en français : 21 septembre 2026"""
        if not date_value:
            return "—"
        try:
            if isinstance(date_value, str):
                date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            
            mois_fr = [
                "", "janvier", "février", "mars", "avril", "mai", "juin",
                "juillet", "août", "septembre", "octobre", "novembre", "décembre"
            ]
            return f"{date_value.day} {mois_fr[date_value.month]} {date_value.year}"
        except Exception as e:
            print(f"⚠️ Erreur format date FR : {e}")
            return str(date_value)

    def _format_date_ar(self, date_value):
        """Formate une date en arabe : 21 شتنبر 2026"""
        if not date_value:
            return "—"
        try:
            if isinstance(date_value, str):
                date_value = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
            
            mois_ar = [
                "", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو",
                "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"
            ]
            return f"{date_value.day} {mois_ar[date_value.month]} {date_value.year}"
        except Exception as e:
            print(f"⚠️ Erreur format date AR : {e}")
            return str(date_value)

    # ═══════════════════════════════════════════════════════
    # GÉNÉRATION DU TITRE
    # ═══════════════════════════════════════════════════════
    def _generer_titre(self, type_convention, langue='fr'):
        """Génère le titre complet selon le type et la langue."""
        titres_fr = {
            'Convention cadre': 'CONVENTION-CADRE DE PARTENARIAT',
            'Convention spécifique': 'CONVENTION SPÉCIFIQUE',
            'Convention de partenariat': 'CONVENTION DE PARTENARIAT',
            'Mémorandum': "MÉMORANDUM D'ENTENTE",
            'Avenant': 'AVENANT',
            'Contrat': 'CONTRAT DE PARTENARIAT',
            'Entente': 'ENTENTE DE PARTENARIAT',
        }
        
        titres_ar = {
            'Convention cadre': 'اتفاقية إطار للشراكة',
            'Convention spécifique': 'اتفاقية محددة',
            'Convention de partenariat': 'اتفاقية شراكة',
            'Mémorandum': 'مذكرة تفاهم',
            'Avenant': 'ملحق',
            'Contrat': 'عقد شراكة',
            'Entente': 'اتفاق',
        }
        
        if not type_convention:
            return 'CONVENTION' if langue == 'fr' else 'اتفاقية'
        
        if langue == 'ar':
            return titres_ar.get(type_convention, type_convention.upper())
        else:
            return titres_fr.get(type_convention, type_convention.upper())

    # ═══════════════════════════════════════════════════════
    # FORMATAGE DES COMITÉS
    # ═══════════════════════════════════════════════════════
    def _format_comite(self, comite):
        """Formate un comité en texte multi-lignes pour le Word."""
        if not comite:
            return "—"
        
        lignes = []
        
        # Fréquence
        if comite.get('frequence'):
            lignes.append(f"Fréquence des réunions : {comite['frequence']}")
        
        # Membres UM5
        membres_um5 = comite.get('membres_um5') or []
        if membres_um5:
            lignes.append("")
            lignes.append("Membres UM5 :")
            for m in membres_um5:
                nom = m.get('nom', '')
                email = m.get('email', '')
                etab = m.get('etablissement', '')
                txt = f"  • {nom}"
                if email:
                    txt += f" ({email})"
                if etab:
                    txt += f" - {etab}"
                lignes.append(txt)
        
        # Membres partenaires
        membres_partenaires = comite.get('membres_partenaires') or []
        if membres_partenaires:
            lignes.append("")
            lignes.append("Membres partenaires :")
            for m in membres_partenaires:
                nom = m.get('nom', '')
                email = m.get('email', '')
                org = m.get('organisme', '')
                txt = f"  • {nom}"
                if email:
                    txt += f" ({email})"
                if org:
                    txt += f" - {org}"
                lignes.append(txt)
        
        return "\n".join(lignes) if lignes else "—"

    # ═══════════════════════════════════════════════════════
    # PRÉPARATION DU CONTEXTE
    # ═══════════════════════════════════════════════════════
    def _prepare_context(self, convention, partenaires, comites, articles, langue='fr'):
        """Prépare toutes les données pour le template."""
        
        # Signataire UM5
        signataire_um5 = (
            convention.signataire_um5_autre 
            or convention.signataire_um5 
            or "Le Président"
        )
        
        # Partenaire principal (le premier de la liste)
        partenaire_principal = partenaires[0] if partenaires else {}
        
        # Trouver les comités
        comites_pilotage = next(
            (c for c in comites if c.get('type') == 'PILOTAGE'), 
            None
        )
        comites_suivi = next(
            (c for c in comites if c.get('type') == 'SUIVI'), 
            None
        )
        
        # Formater les dates
        date_signature_texte = (
            self._format_date_ar(convention.date_signature)
            if langue == 'ar'
            else self._format_date_fr(convention.date_signature)
        )
        
        # Nettoyer les articles (remplacer None par "")
        articles_clean = {}
        if articles:
            for key, val in articles.items():
                if val is None:
                    articles_clean[key] = "—"
                elif isinstance(val, list):
                    articles_clean[key] = "\n".join(str(v) for v in val) if val else "—"
                else:
                    articles_clean[key] = str(val)
        
        # Valeurs par défaut pour les articles manquants
        for key in [
            'objet', 'objectif', 'engagement_um5', 'engagement_partenaire',
            'engagement_commun', 'principaux_domaines', 'financement',
            'propriete_intellectuelle', 'confidentialite', 'reglement_litiges',
            'communication', 'forces_majeurs', 'modification_resiliation',
            'protection_donnees'
        ]:
            if key not in articles_clean or not articles_clean[key]:
                articles_clean[key] = "—"
        
        # Contexte final
        context = {
            # Titre
            'titre_convention': self._generer_titre(convention.type, langue),
            
            # Partenaire
            'partenaire_nom': partenaire_principal.get('nom', '—'),
            'partenaire_type': partenaire_principal.get('type', '—'),
            'partenaire_ville': partenaire_principal.get('ville', '—'),
            'partenaire_region': partenaire_principal.get('region', '—'),
            'partenaire_pays': partenaire_principal.get('pays', 'Maroc'),
            'signataire_partenaire': partenaire_principal.get('signataire', '—'),
            
            # UM5
            'signataire_um5': signataire_um5,
            
            # Dates
            'date_signature': str(convention.date_signature) if convention.date_signature else '—',
            'date_signature_texte': date_signature_texte,
            'date_expiration': str(convention.date_expiration) if convention.date_expiration else '—',
            
            # Durée et renouvellement
            'duree_annees': convention.duree_annees or '—',
            'mode_renouvellement': convention.mode_renouvellement or '—',
            
            # Référence
            'numero_reference': convention.numero_reference or '—',
            'intitule': convention.intitule or '—',
            
            # Comités
            'comites_pilotage': self._format_comite(comites_pilotage),
            'comites_suivi': self._format_comite(comites_suivi),
            
            # Articles (sous forme d'objet)
            'articles': articles_clean,
        }
        
        return context

    # ═══════════════════════════════════════════════════════
    # MÉTHODE PRINCIPALE
    # ═══════════════════════════════════════════════════════
    def generer_convention(self, convention, partenaires, comites, articles, langue='fr'):
        """
        Génère le document Word de la convention.
        
        Args:
            convention : objet Convention (SQLAlchemy)
            partenaires : liste de dicts
            comites : liste de dicts
            articles : dict des articles
            langue : 'fr' ou 'ar'
        
        Returns:
            BytesIO : fichier Word prêt à télécharger
        """
        # Nom du template
        template_name = f"convention_{'FR' if langue == 'fr' else 'AR'}.docx"
        template_path = self.templates_dir / template_name
        
        print(f"📄 Chargement du template : {template_path}")
        
        if not template_path.exists():
            raise FileNotFoundError(
                f"Template introuvable : {template_path}. "
                f"Vérifiez que le fichier existe dans backend/templates/"
            )
        
        # Charger le template
        doc = DocxTemplate(str(template_path))
        
        # Préparer les données
        context = self._prepare_context(
            convention, partenaires, comites, articles, langue
        )
        
        print(f"✅ Contexte préparé avec {len(context)} variables")
        print(f"   - Titre : {context['titre_convention']}")
        print(f"   - Partenaire : {context['partenaire_nom']}")
        
        # Remplir le template
        doc.render(context)
        
        # Sauvegarder dans un BytesIO
        output = BytesIO()
        doc.save(output)
        output.seek(0)
        
        print(f"✅ Word généré ({output.getbuffer().nbytes} octets)")
        
        return output

    # ═══════════════════════════════════════════════════════
    # NOM DU FICHIER
    # ═══════════════════════════════════════════════════════
    def get_filename(self, convention, langue='fr'):
        """Génère un nom de fichier propre."""
        intitule = (convention.intitule or 'convention')[:50]
        # Nettoyer les caractères spéciaux
        intitule = "".join(
            c for c in intitule 
            if c.isalnum() or c in (' ', '-', '_')
        ).strip()
        intitule = intitule.replace(' ', '_')
        
        date_str = datetime.now().strftime('%Y%m%d')
        suffix = 'FR' if langue == 'fr' else 'AR'
        
        return f"Convention_{intitule}_{suffix}_{date_str}.docx"
        # ═══════════════════════════════════════════════════════
    # DEBUG : Voir les placeholders détectés dans le template
    # ═══════════════════════════════════════════════════════
    def debug_template(self, langue='fr'):
        """Affiche les placeholders détectés dans le template."""
        template_name = f"convention_{'FR' if langue == 'fr' else 'AR'}.docx"
        template_path = self.templates_dir / template_name
        
        print(f"\n{'=' * 60}")
        print(f"🔍 DEBUG TEMPLATE : {template_path}")
        print(f"{'=' * 60}")
        
        if not template_path.exists():
            print(f"❌ Template introuvable : {template_path}")
            return []
        
        doc = DocxTemplate(str(template_path))
        
        # Récupérer tous les placeholders non-remplis
        undeclared = doc.get_undeclared_template_variables()
        
        print(f"🔍 Placeholders détectés : {len(undeclared)}")
        for ph in sorted(undeclared):
            print(f"   - {ph}")
        
        print(f"{'=' * 60}\n")
        return list(undeclared)