import os
from sendgrid import SendGridAPIClient # type: ignore
from sendgrid.helpers.mail import Mail, Email, To, Content # type: ignore
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.sendgrid_client = sendgrid.SendGridAPIClient(
            api_key=os.getenv("SENDGRID_API_KEY")
        )
        self.from_email = os.getenv("FROM_EMAIL", "alertes.partenariats.um5@gmail.com")
    
    def send_email(self, to_emails: List[str], subject: str, html_content: str) -> bool:
        """
        Envoyer un email via l'API REST SendGrid
        """
        if not to_emails:
            logger.warning("Aucun destinataire spécifié")
            return False
        
        try:
            message = Mail(
                from_email=Email(self.from_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            for email in to_emails:
                message.add_to(To(email))
            
            response = self.sendgrid_client.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"✅ Email envoyé à {', '.join(to_emails)}")
                return True
            else:
                logger.error(f"❌ Erreur SendGrid: {response.status_code} - {response.body}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erreur envoi email: {e}")
            return False
    
    # ─── ALERTE D'EXPIRATION ───
    def send_expiration_alert(self, convention, comites, rappel_type: str) -> bool:
        """
        Envoyer l'alerte d'expiration à tous les membres des comités
        """
        emails = []
        for comite in comites:
            # Membres internes (UM5)
            if hasattr(comite, 'destinataires_internes'):
                for membre in comite.destinataires_internes:
                    if hasattr(membre, 'email') and membre.email:
                        emails.append(membre.email)
            
            # Membres externes (partenaires)
            if hasattr(comite, 'destinataires_externes'):
                for externe in comite.destinataires_externes:
                    if hasattr(externe, 'email') and externe.email:
                        emails.append(externe.email)
        
        # Supprimer les doublons
        emails = list(set(emails))
        
        if not emails:
            logger.warning(f"Aucun email trouvé pour la convention {convention.id}")
            return False
        
        # Générer le message
        subject, body = self._generate_expiration_message(convention, rappel_type)
        return self.send_email(emails, subject, body)
    
    def _generate_expiration_message(self, convention, rappel_type: str):
        """
        Générer le message d'expiration dynamique
        """
        messages = {
            "T-3": f"""
            <h2>📅 Rappel : Convention {convention.intitule}</h2>
            <p>Bonjour,</p>
            <p>La convention <strong>{convention.intitule}</strong> arrivera à expiration dans <strong>3 mois</strong>.</p>
            <p><strong>Détails :</strong></p>
            <ul>
                <li>Référence : {convention.numero_reference or 'Non renseignée'}</li>
                <li>Date d'expiration : {convention.date_expiration}</li>
                <li>Signataire UM5 : {convention.signataire_um5 or 'Non renseigné'}</li>
            </ul>
            <p>Veuillez prendre les mesures nécessaires pour le renouvellement.</p>
            <br>
            <p>Cordialement,</p>
            <p><strong>Direction des Partenariats - UM5</strong></p>
            """,
            "T-2": f"""
            <h2>⚠️ Rappel : Convention {convention.intitule}</h2>
            <p>Bonjour,</p>
            <p>La convention <strong>{convention.intitule}</strong> arrivera à expiration dans <strong>2 mois</strong>.</p>
            <p><strong>Détails :</strong></p>
            <ul>
                <li>Référence : {convention.numero_reference or 'Non renseignée'}</li>
                <li>Date d'expiration : {convention.date_expiration}</li>
                <li>Signataire UM5 : {convention.signataire_um5 or 'Non renseigné'}</li>
            </ul>
            <p>Une action rapide est recommandée.</p>
            <br>
            <p>Cordialement,</p>
            <p><strong>Direction des Partenariats - UM5</strong></p>
            """,
            "T-1": f"""
            <h2>🚨 DERNIER RAPPEL : Convention {convention.intitule}</h2>
            <p>Bonjour,</p>
            <p>La convention <strong>{convention.intitule}</strong> arrivera à expiration dans <strong>1 mois</strong>.</p>
            <p><strong>Détails :</strong></p>
            <ul>
                <li>Référence : {convention.numero_reference or 'Non renseignée'}</li>
                <li>Date d'expiration : {convention.date_expiration}</li>
                <li>Signataire UM5 : {convention.signataire_um5 or 'Non renseigné'}</li>
            </ul>
            <p style="color: red;"><strong>⚠️ Action immédiate requise !</strong></p>
            <br>
            <p>Cordialement,</p>
            <p><strong>Direction des Partenariats - UM5</strong></p>
            """
        }
        
        sujet = f"[ALERTE] Convention {convention.intitule} - {rappel_type} avant expiration"
        return sujet, messages.get(rappel_type, messages["T-1"])
    
    # ─── ALERTE RÉUNION DE COMITÉ ───
    def send_reunion_alert(self, comite, reunion, convention) -> bool:
        """
        Envoyer l'alerte de réunion aux membres du comité
        """
        emails = []
        
        if hasattr(comite, 'destinataires_internes'):
            for membre in comite.destinataires_internes:
                if hasattr(membre, 'email') and membre.email:
                    emails.append(membre.email)
        
        if hasattr(comite, 'destinataires_externes'):
            for externe in comite.destinataires_externes:
                if hasattr(externe, 'email') and externe.email:
                    emails.append(externe.email)
        
        emails = list(set(emails))
        
        if not emails:
            logger.warning(f"Aucun email trouvé pour le comité {comite.id}")
            return False
        
        subject, body = self._generate_reunion_message(comite, reunion, convention)
        return self.send_email(emails, subject, body)
    
    def _generate_reunion_message(self, comite, reunion, convention):
        """
        Générer le message de réunion dynamique
        """
        sujet = f"📅 Rappel : Réunion du comité {comite.nom}"
        
        corps = f"""
        <h2>Rappel de réunion : Comité {comite.nom}</h2>
        <p>Bonjour,</p>
        <p>Vous êtes convié(e) à la réunion du comité <strong>{comite.nom}</strong>.</p>
        <p><strong>Détails :</strong></p>
        <ul>
            <li><strong>Date :</strong> {reunion.date_reunion}</li>
            <li><strong>Heure :</strong> {reunion.heure or 'À définir'}</li>
            <li><strong>Lieu :</strong> {reunion.lieu or 'À définir'}</li>
            <li><strong>Ordre du jour :</strong> {reunion.ordre_du_jour or 'À définir'}</li>
            <li><strong>Convention :</strong> {convention.intitule}</li>
        </ul>
        <p>Merci de confirmer votre présence.</p>
        <br>
        <p>Cordialement,</p>
        <p><strong>Direction des Partenariats - UM5</strong></p>
        """
        
        return sujet, corps
    
    # ─── ALERTE MANUELLE ───
    def send_manual_alert(self, emails: List[str], sujet: str, corps: str) -> bool:
        """
        Envoyer une alerte manuelle personnalisée
        """
        if not emails:
            logger.warning("Aucun email spécifié pour l'alerte manuelle")
            return False
        
        # Transformer le corps en HTML si ce n'est pas déjà fait
        if not corps.startswith('<'):
            corps = corps.replace('\n', '<br>')
            corps = f"<p>{corps}</p>"
        
        return self.send_email(emails, sujet, corps)