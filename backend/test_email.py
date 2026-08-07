import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Charger les variables d'environnement
load_dotenv()

def test_email():
    try:
        # Récupérer les variables
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("FROM_EMAIL", smtp_user)
        to_email = "imaneraiss50@gmail.com"  # Remplace par ton email
        
        print(f"📧 SMTP_HOST: {smtp_host}")
        print(f"📧 SMTP_PORT: {smtp_port}")
        print(f"📧 SMTP_USER: {smtp_user}")
        print(f"📧 FROM_EMAIL: {from_email}")
        print(f"📧 TO_EMAIL: {to_email}")
        
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = "Test Email from UM5 Partnership"
        
        # Corps du message en HTML
        html = """
        <html>
          <body>
            <h2>📧 Test d'email</h2>
            <p>Bonjour,</p>
            <p>Ceci est un email de test envoyé depuis l'application <strong>UM5 Partnership</strong>.</p>
            <p>Cordialement,</p>
            <p><strong>Direction des Partenariats - UM5</strong></p>
          </body>
        </html>
        """
        msg.attach(MIMEText(html, 'html'))
        
        # ✅ Établir la connexion SMTP correctement
        print("🔌 Connexion au serveur SMTP...")
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.set_debuglevel(1)  # Affiche les détails de la connexion
        server.starttls()
        server.login(smtp_user, smtp_password)
        
        # Envoyer
        print("📤 Envoi de l'email...")
        server.send_message(msg)
        server.quit()
        
        print("✅ Email envoyé avec succès !")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Erreur d'authentification: {e}")
        print("   Vérifie ton email et ton mot de passe d'application")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ Erreur SMTP: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    test_email()