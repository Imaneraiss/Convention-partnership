import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        api_key = os.getenv("SENDGRID_API_KEY")
        if not api_key:
            logger.warning("⚠️ SENDGRID_API_KEY non définie")
        self.sendgrid_client = SendGridAPIClient(api_key) if api_key else None
        self.from_email = os.getenv("FROM_EMAIL", "alertes.partenariats.um5@gmail.com")
    
    def send_email(self, to_emails: List[str], subject: str, html_content: str) -> bool:
        """
        Envoyer un email via l'API REST SendGrid
        """
        if not self.sendgrid_client:
            logger.error("❌ SendGrid non configuré")
            return False
            
        if not to_emails:
            logger.warning("Aucun destinataire spécifié")
            return False
        
        try:
            message = Mail(
                from_email=Email(self.from_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            # Ajouter tous les destinataires
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
        ✅ Version corrigée - Utilise les champs JSON membres_um5 et membres_partenaires
        """
        emails = []
        for comite in comites:
            # ✅ Membres internes (UM5) - depuis le JSON
            if hasattr(comite, 'membres_um5') and comite.membres_um5:
                for membre in comite.membres_um5:
                    if membre.get('email'):
                        emails.append(membre.get('email'))
            
            # ✅ Membres externes (partenaires) - depuis le JSON
            if hasattr(comite, 'membres_partenaires') and comite.membres_partenaires:
                for membre in comite.membres_partenaires:
                    if membre.get('email'):
                        emails.append(membre.get('email'))
        
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
        date_expiration = convention.date_expiration.strftime('%d/%m/%Y') if convention.date_expiration else 'Non renseignée'
        
        messages = {
            "T-3": f"""
            <h2>📅 Rappel : Convention {convention.intitule}</h2>
            <p>Bonjour,</p>
            <p>La convention <strong>{convention.intitule}</strong> arrivera à expiration dans <strong>3 mois</strong>.</p>
            <p><strong>Détails :</strong></p>
            <ul>
                <li>Date d'expiration : {date_expiration}</li>
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
                <li>Date d'expiration : {date_expiration}</li>
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
                <li>Date d'expiration : {date_expiration}</li>
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
        ✅ Version corrigée - Utilise les champs JSON
        """
        emails = []
        
        # ✅ Membres internes (UM5) - depuis le JSON
        if hasattr(comite, 'membres_um5') and comite.membres_um5:
            for membre in comite.membres_um5:
                if membre.get('email'):
                    emails.append(membre.get('email'))
        
        # ✅ Membres externes (partenaires) - depuis le JSON
        if hasattr(comite, 'membres_partenaires') and comite.membres_partenaires:
            for membre in comite.membres_partenaires:
                if membre.get('email'):
                    emails.append(membre.get('email'))
        
        emails = list(set(emails))
        
        if not emails:
            logger.warning(f"Aucun email trouvé pour le comité {comite.id}")
            return False
        
        subject, body = self._generate_reunion_message(comite, reunion, convention)
        return self.send_email(emails, subject, body)
    
    def _generate_reunion_message(self, comite, reunion, convention):
        """
        Générer le message de réunion dynamique
        ✅ Version corrigée - Utilise les données du JSON
        """
        # ✅ Extraire les données de la réunion depuis le JSON
        reunion_date = reunion.get('date', 'Non définie')
        reunion_titre = reunion.get('titre', f"Réunion du comité {comite.type}")
        reunion_pv = reunion.get('pv')
        
        sujet = f"📅 Rappel : Réunion du comité {comite.type}"
        
        corps = f"""
        <h2>Rappel de réunion : Comité {comite.type}</h2>
        <p>Bonjour,</p>
        <p>Vous êtes convié(e) à la réunion du comité <strong>{comite.type}</strong>.</p>
        <p><strong>Détails :</strong></p>
        <ul>
            <li><strong>Date :</strong> {reunion_date}</li>
            <li><strong>Titre :</strong> {reunion_titre}</li>
            <li><strong>Convention :</strong> {convention.intitule}</li>
            {f'<li><strong>PV :</strong> {reunion_pv.get("nom") if reunion_pv else "À venir"}</li>' if reunion_pv else ''}
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