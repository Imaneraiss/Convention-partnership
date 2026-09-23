# app/services/scheduler_service.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import logging
import traceback

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_expiration_job():
    """
    Tâche quotidienne : vérifie les conventions qui expirent bientôt
    et crée les alertes + envoie les emails.
    """
    from app.database import SessionLocal
    from app.models.convention import Convention
    from app.models.comite import Comite
    from app.models.alerte import Alerte
    from app.services.email_service import EmailService

    logger.info("=" * 60)
    logger.info("🔄 [SCHEDULER] Vérification des expirations...")
    logger.info("=" * 60)

    db = SessionLocal()
    try:
        email_service = EmailService()
        today = datetime.now().date()

        conventions = db.query(Convention).filter(
            Convention.date_expiration.isnot(None)
        ).all()

        logger.info(f"📊 {len(conventions)} convention(s) à vérifier")
        alerts_created = 0

        for convention in conventions:
            if not convention.date_expiration:
                continue

            diff = (convention.date_expiration - today).days
            logger.info(f"   → [{convention.intitule[:40]}] expire dans {diff} jours")

            # Déterminer le type de rappel
            rappel_type = None
            if 0 <= diff <= 30:
                rappel_type = "T-1"
            elif 31 <= diff <= 60:
                rappel_type = "T-2"
            elif 61 <= diff <= 90:
                rappel_type = "T-3"

            if not rappel_type:
                continue

            # Vérifier si l'alerte existe déjà (éviter les doublons)
            existing = db.query(Alerte).filter(
                Alerte.convention_id == convention.id,
                Alerte.objet.like(f"%{rappel_type}%")
            ).first()

            if existing:
                logger.info(f"   ⏭️  Alerte {rappel_type} déjà existante")
                continue

            # Récupérer les comités de la convention
            comites = db.query(Comite).filter(
                Comite.convention_id == convention.id
            ).all()

            # Envoyer l'email aux destinataires
            success = email_service.send_expiration_alert(convention, comites, rappel_type)

            # Créer l'alerte en base
            alerte = Alerte(
                convention_id=convention.id,
                type_alerte="FIN_CONVENTION",
                objet=f"{rappel_type} avant expiration - {convention.intitule}",
                date_declenchement=datetime.now(),
                envoyee=success,
                traitee=success                     # ⬅️ À traiter par le chargé
            )
            db.add(alerte)
            alerts_created += 1
            logger.info(f"   ✅ Alerte {rappel_type} créée (email: {success})")

        db.commit()
        logger.info(f"✅ [SCHEDULER] {alerts_created} alerte(s) d'expiration créée(s)")

    except Exception as e:
        logger.error(f"❌ [SCHEDULER] Erreur expiration: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def check_reunions_job():
    """
    Tâche quotidienne : vérifie les réunions dans les 7 prochains jours
    et crée les alertes + envoie les emails.
    """
    from app.database import SessionLocal
    from app.models.comite import Comite
    from app.models.convention import Convention
    from app.models.alerte import Alerte
    from app.services.email_service import EmailService

    logger.info("=" * 60)
    logger.info("🔄 [SCHEDULER] Vérification des réunions...")
    logger.info("=" * 60)

    db = SessionLocal()
    try:
        email_service = EmailService()
        today = datetime.now().date()
        alert_date = today + timedelta(days=7)

        comites = db.query(Comite).all()
        logger.info(f"📊 {len(comites)} comité(s) à vérifier")
        alerts_created = 0

        for comite in comites:
            reunions = comite.reunions or []
            for reunion in reunions:
                try:
                    reunion_date = datetime.strptime(
                        reunion.get('date', ''), '%Y-%m-%d'
                    ).date()

                    if today <= reunion_date <= alert_date:
                        # Vérifier doublon
                        existing = db.query(Alerte).filter(
                            Alerte.convention_id == comite.convention_id,
                            Alerte.objet.like(f"%Réunion du comité {comite.type}%"),
                            Alerte.type_alerte == "REUNION_COMITE"
                        ).first()

                        if existing:
                            continue

                        convention = db.query(Convention).filter(
                            Convention.id == comite.convention_id
                        ).first()

                        if convention:
                            success = email_service.send_reunion_alert(
                                comite, reunion, convention
                            )

                            alerte = Alerte(
                                convention_id=convention.id,
                                type_alerte="REUNION_COMITE",
                                objet=f"Réunion du comité {comite.type} - {reunion_date}",
                                date_declenchement=datetime.now(),
                                envoyee=success,
                                traitee=success
                            )
                            db.add(alerte)
                            alerts_created += 1
                            logger.info(f"   ✅ Alerte réunion {comite.type} créée (email: {success})")

                except (ValueError, TypeError) as e:
                    logger.warning(f"   ⚠️ Réunion invalide: {reunion} — {e}")
                    continue

        db.commit()
        logger.info(f"✅ [SCHEDULER] {alerts_created} alerte(s) de réunion créée(s)")

    except Exception as e:
        logger.error(f"❌ [SCHEDULER] Erreur réunions: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Démarrer le scheduler avec les tâches planifiées."""
    if scheduler.running:
        logger.warning("⚠️ Scheduler déjà démarré")
        return

    # Tâche 1 : Expirations — tous les jours à 08h00
    scheduler.add_job(
        check_expiration_job,
        CronTrigger(hour=8, minute=0),
        id="check_expiration",
        replace_existing=True
    )

    # Tâche 2 : Réunions — tous les jours à 08h05
    scheduler.add_job(
        check_reunions_job,
        CronTrigger(hour=8, minute=5),
        id="check_reunions",
        replace_existing=True
    )

    scheduler.start()
    logger.info("=" * 60)
    logger.info("✅ [SCHEDULER] DÉMARRÉ")
    logger.info("   → Expirations : tous les jours à 08h00")
    logger.info("   → Réunions    : tous les jours à 08h05")
    logger.info("=" * 60)


def stop_scheduler():
    """Arrêter le scheduler proprement."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 [SCHEDULER] Arrêté")