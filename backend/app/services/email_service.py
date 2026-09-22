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

   # ═══════════════════════════════════════════════════════════
    # NOTIFICATION : Le SG a modifié le budget d'une convention
    # ═══════════════════════════════════════════════════════════
    def send_sg_update_notification(self, convention, sg_user) -> bool:
        """Envoie UN SEUL email aux chargés quand le SG modifie le budget."""
        from app.models.user import User
        from app.database import SessionLocal
        
        db = SessionLocal()
        try:
            charges = db.query(User).filter(
                User.role == "CHARGE",
                User.actif == True,
                User.premiere_connexion == False
            ).all()
            emails = [c.email for c in charges if c.email]
        finally:
            db.close()
        
        if not emails:
            logger.warning("Aucun chargé à notifier")
            return False
        
        sg_nom = f"{sg_user.prenom or ''} {sg_user.nom or ''}".strip() or "Le Secrétaire Général"
        subject = f"[NOTIFICATION] Mises à jour budget par le SG - {convention.intitule[:60]}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            
            <div style="background-color: #003087; color: white; padding: 25px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 22px;">💰 Mises à jour du budget</h1>
            </div>
            
            <div style="padding: 30px 25px; background-color: #f9fafb;">
                
                <p style="font-size: 16px;">Bonjour,</p>
                
                <p style="font-size: 15px; line-height: 1.6;">
                    Nous vous informons que le <strong>Secrétaire Général</strong> 
                    a effectué des <strong>mises à jour budgétaires</strong> dans la convention suivante :
                </p>
                
                <div style="background-color: white; padding: 20px; border-left: 5px solid #003087; 
                            margin: 25px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">
                                <strong>Convention :</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                {convention.intitule}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                <strong>Référence :</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                {convention.numero_reference or '—'}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                <strong>Modifiée par :</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                {sg_nom}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                <strong>Date :</strong>
                            </td>
                            <td style="padding: 8px 0; color: #111827; font-size: 14px;">
                                {self._format_date_now()}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">
                    Ces modifications peuvent concerner :
                </p>
                
                <ul style="font-size: 14px; color: #374151; line-height: 1.8;">
                    <li>💰 Le montant ou les modalités de paiement</li>
                    <li>📄 Les justificatifs financiers</li>
                    <li>📊 Le suivi de la réception des fonds</li>
                </ul>
                
                <p style="text-align: center; margin: 35px 0;">
                    <a href="http://conventions.intranet.um5/conventions/{convention.id}" 
                    style="background-color: #0c3e9c; color: white; padding: 14px 28px; 
                            text-decoration: none; border-radius: 6px; display: inline-block;
                            font-weight: bold; font-size: 15px;">
                        📄 Consulter la convention
                    </a>
                </p>
                
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; 
                        font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0;">
                    <strong style="color: #003087;">Direction des Partenariats — UM5 Rabat</strong>
                </p>
            </div>
            
        </body>
        </html>
        """
        
        return self.send_email(emails, subject, body)


    def _format_date_now(self):
        """Date et heure actuelles en français."""
        from datetime import datetime
        mois_fr = ["janvier", "février", "mars", "avril", "mai", "juin",
                "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
        now = datetime.now()
        return f"{now.day} {mois_fr[now.month - 1]} {now.year} à {now.strftime('%H:%M')}"