import os
from typing import List, Optional
from datetime import datetime
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.services.email_service import EmailService
from app.models.convention import Convention
from app.models.comite import Comite
from app.models.reunion import Reunion
from app.models.user import User
from app.models.alerte import Alerte
from app.models.enums import TypeAlerte


class AlerteService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()

    # ──────────────────────────────────────────────
    # FONCTIONS INTERNES - RÉCUPÉRATION DES EMAILS
    # ──────────────────────────────────────────────

    def _get_charges_emails(self) -> List[str]:
        """Récupère les emails de tous les Chargés de partenariat (rôle CHARGE)"""
        users = self.db.query(User).filter(User.role == "CHARGE").all()
        return [user.email for user in users if user.email]

    def _get_etablissements_um5(self) -> List[str]:
        """Récupère les emails des établissements UM5"""
        # À remplacer par la vraie liste plus tard
        emails_str = os.getenv("ETABLISSEMENTS_UM5_EMAILS", "")
        return [email.strip() for email in emails_str.split(",") if email.strip()]

    def _get_finance_emails(self) -> List[str]:
        """Récupère les emails des services financiers"""
        emails_str = os.getenv("FINANCE_EMAILS", "")
        return [email.strip() for email in emails_str.split(",") if email.strip()]

    def _get_committee_emails(self, comite: Comite) -> List[str]:
        """Récupère tous les emails des membres d'un comité"""
        emails = []
        for membre in comite.destinataires_internes:
            if membre.email:
                emails.append(membre.email)
        for externe in comite.destinataires_externes:
            if externe.email:
                emails.append(externe.email)
        return list(set(emails))

    def _enregistrer_alerte(self, convention_id, type_alerte: TypeAlerte, objet: str, envoyee: bool, comite_id=None, reunion_id=None):
        """Enregistrer une alerte en base de données"""
        alerte = Alerte(
            convention_id=convention_id,
            type_alerte=type_alerte.value,
            date_declenchement=datetime.now().date(),
            objet=objet,
            envoyee=envoyee,
            traitee=envoyee,
            comite_id=comite_id,
            reunion_id=reunion_id
        )
        self.db.add(alerte)
        self.db.commit()
        return alerte

    # ──────────────────────────────────────────────
    # ALERTES DE DIFFUSION
    # ──────────────────────────────────────────────

    def diffuser_convention_cadre(self, convention: Convention, piece_jointe: str = None) -> bool:
        """
        Alerte 1 : Envoie la convention cadre à tous les établissements UM5
        """
        to_emails = self._get_etablissements_um5()
        if not to_emails:
            print("⚠️ Aucun email d'établissement UM5 configuré.")
            return False

        sujet = f"📄 [DIFFUSION] Nouvelle Convention Cadre : {convention.intitule}"
        message = f"""
        <h2>📄 Diffusion d'une Convention Cadre</h2>
        <p>Bonjour,</p>
        <p>Une nouvelle convention cadre a été signée.</p>
        <ul>
            <li><strong>Intitulé :</strong> {convention.intitule}</li>
            <li><strong>Référence :</strong> {convention.numero_reference}</li>
            <li><strong>Signataire UM5 :</strong> {convention.signataire_um5}</li>
        </ul>
        <p>Veuillez trouver la convention en pièce jointe.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>Direction des Partenariats - UM5</strong></p>
        """

        success = self.email_service.send_email(to_emails, sujet, message)
        
        # Enregistrer l'alerte
        self._enregistrer_alerte(
            convention_id=convention.id,
            type_alerte=TypeAlerte.DIFFUSION_CADRE,
            objet=f"Diffusion convention cadre : {convention.intitule}",
            envoyee=success
        )
        
        return success

    def diffuser_convention_budget(self, convention: Convention, piece_jointe: str = None) -> bool:
        """
        Alerte 2 : Envoie la convention avec budget aux services financiers
        """
        to_emails = self._get_finance_emails()
        if not to_emails:
            print("⚠️ Aucun email des services financiers configuré.")
            return False

        sujet = f"💰 [BUDGET] Convention avec budget : {convention.intitule}"
        message = f"""
        <h2>💰 Convention avec Budget</h2>
        <p>Bonjour,</p>
        <p>Une convention avec un budget a été signée.</p>
        <ul>
            <li><strong>Intitulé :</strong> {convention.intitule}</li>
            <li><strong>Référence :</strong> {convention.numero_reference}</li>
            <li><strong>Montant :</strong> {convention.budget.montant_total if convention.budget else 'Non renseigné'}</li>
        </ul>
        <p>Veuillez trouver la convention en pièce jointe.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>Direction des Partenariats - UM5</strong></p>
        """

        success = self.email_service.send_email(to_emails, sujet, message)
        
        # Enregistrer l'alerte
        self._enregistrer_alerte(
            convention_id=convention.id,
            type_alerte=TypeAlerte.DIFFUSION_BUDGET,
            objet=f"Diffusion budget : {convention.intitule}",
            envoyee=success
        )
        
        return success

    # ──────────────────────────────────────────────
    # ALERTES AUTOMATIQUES
    # ──────────────────────────────────────────────

    def alerte_expiration(self, convention: Convention, rappel_type: str) -> bool:
        """
        Alerte 3 : Envoi d'un rappel d'expiration aux CHARGÉS DE PARTENARIAT
        """
        to_emails = self._get_charges_emails()
        if not to_emails:
            print("⚠️ Aucun Chargé de partenariat trouvé.")
            return False

        sujet, html = self.email_service._generate_expiration_message(convention, rappel_type)
        success = self.email_service.send_email(to_emails, sujet, html)
        
        # Enregistrer l'alerte
        self._enregistrer_alerte(
            convention_id=convention.id,
            type_alerte=TypeAlerte.RAPPEL_EXPIRATION,
            objet=f"{rappel_type} - {convention.intitule}",
            envoyee=success
        )
        
        return success

    def alerte_reunion(self, reunion: Reunion) -> bool:
        """
        Alerte 4 : Envoi d'un rappel de réunion aux MEMBRES DU COMITÉ
        """
        comite = self.db.query(Comite).filter(Comite.id == reunion.comite_id).first()
        if not comite:
            return False

        convention = self.db.query(Convention).filter(Convention.id == comite.convention_id).first()
        all_emails = self._get_committee_emails(comite)
        
        if not all_emails:
            print(f"⚠️ Aucun email trouvé pour le comité {comite.id}")
            return False

        sujet, html = self.email_service._generate_reunion_message(comite, reunion, convention)
        success = self.email_service.send_email(all_emails, sujet, html)
        
        # Enregistrer l'alerte
        self._enregistrer_alerte(
            convention_id=convention.id,
            type_alerte=TypeAlerte.RAPPEL_REUNION,
            objet=f"Réunion du comité {comite.nom} - {reunion.date_reunion}",
            envoyee=success,
            comite_id=comite.id,
            reunion_id=reunion.id
        )
        
        return success

    # ──────────────────────────────────────────────
    # VÉRIFICATIONS AUTOMATIQUES (SCHEDULER)
    # ──────────────────────────────────────────────

    def verifier_expirations(self) -> dict:
        """
        Vérifier et envoyer les alertes d'expiration (T-3, T-2, T-1)
        """
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        conventions = self.db.query(Convention).filter(
            Convention.date_expiration.isnot(None)
        ).all()
        
        resultats = {"envoyees": [], "erreurs": []}
        
        for convention in conventions:
            if convention.date_expiration:
                diff = (convention.date_expiration - today).days
                
                rappel_type = None
                if 0 <= diff <= 30:
                    rappel_type = "T-1"
                elif 31 <= diff <= 60:
                    rappel_type = "T-2"
                elif 61 <= diff <= 90:
                    rappel_type = "T-3"
                
                if rappel_type:
                    # Vérifier si l'alerte n'a pas déjà été envoyée
                    existante = self.db.query(Alerte).filter(
                        Alerte.convention_id == convention.id,
                        Alerte.type_alerte == TypeAlerte.RAPPEL_EXPIRATION.value,
                        Alerte.objet.like(f"%{rappel_type}%")
                    ).first()
                    
                    if not existante:
                        try:
                            success = self.alerte_expiration(convention, rappel_type)
                            resultats["envoyees"].append({
                                "convention": convention.intitule,
                                "rappel": rappel_type,
                                "success": success
                            })
                        except Exception as e:
                            resultats["erreurs"].append({
                                "convention": convention.intitule,
                                "erreur": str(e)
                            })
        
        return resultats

    def verifier_reunions(self) -> dict:
        """
        Vérifier et envoyer les alertes de réunion (J-7)
        """
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        alert_date = today + timedelta(days=7)
        
        reunions = self.db.query(Reunion).filter(
            Reunion.date_reunion >= today,
            Reunion.date_reunion <= alert_date
        ).all()
        
        resultats = {"envoyees": [], "erreurs": []}
        
        for reunion in reunions:
            # Vérifier si l'alerte n'a pas déjà été envoyée
            existante = self.db.query(Alerte).filter(
                Alerte.reunion_id == reunion.id,
                Alerte.type_alerte == TypeAlerte.RAPPEL_REUNION.value
            ).first()
            
            if not existante:
                try:
                    success = self.alerte_reunion(reunion)
                    resultats["envoyees"].append({
                        "reunion_id": str(reunion.id),
                        "date": str(reunion.date_reunion),
                        "success": success
                    })
                except Exception as e:
                    resultats["erreurs"].append({
                        "reunion_id": str(reunion.id),
                        "erreur": str(e)
                    })
        
        return resultats

    # ──────────────────────────────────────────────
    # ALERTE MANUELLE
    # ──────────────────────────────────────────────

    def alerte_manuelle(self, emails: List[str], sujet: str, corps: str, convention_id: str = None) -> bool:
        """
        Alerte 6 : Envoyer une alerte manuelle personnalisée
        """
        if not emails:
            return False
        
        success = self.email_service.send_email(emails, sujet, corps)
        
        if convention_id:
            self._enregistrer_alerte(
                convention_id=convention_id,
                type_alerte=TypeAlerte.MANUELLE,
                objet=sujet,
                envoyee=success
            )
        
        return success