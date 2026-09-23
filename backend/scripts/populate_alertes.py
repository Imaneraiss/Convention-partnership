"""
Peuple la table alertes pour toutes les conventions existantes.
À lancer UNE FOIS après l'import Excel.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.convention import Convention
from app.models.comite import Comite
from app.models.alerte import Alerte


def main():
    db = SessionLocal()
    try:
        print("🔔 Génération des alertes...\n")

        # ═══════════════════════════════════════════════════════
        # 1. Alertes d'expiration (T-1, T-2, T-3)
        # ═══════════════════════════════════════════════════════
        print("📅 Vérification des expirations...")
        today = datetime.now().date()
        conventions = db.query(Convention).filter(
            Convention.date_expiration.isnot(None)
        ).all()

        nb_exp = 0
        for convention in conventions:
            diff = (convention.date_expiration - today).days
            rappel_type = None
            if 0 <= diff <= 30:
                rappel_type = "T-1"
            elif 31 <= diff <= 60:
                rappel_type = "T-2"
            elif 61 <= diff <= 90:
                rappel_type = "T-3"

            if rappel_type:
                # Éviter les doublons
                existing = db.query(Alerte).filter(
                    Alerte.convention_id == convention.id,
                    Alerte.type_alerte == "RAPPEL_EXPIRATION",
                    Alerte.objet.like(f"%{rappel_type}%")
                ).first()
                if not existing:
                    alerte = Alerte(
                        convention_id=convention.id,
                        type_alerte="RAPPEL_EXPIRATION",
                        objet=f"{rappel_type} - {convention.intitule}",
                        date_declenchement=datetime.now(),
                        envoyee=True,      # On simule que l'email est parti
                        traitee=True,      # → grisée
                    )
                    db.add(alerte)
                    nb_exp += 1
                    print(f"   ✅ {rappel_type} — {convention.numero_reference}")

        db.commit()
        print(f"\n   → {nb_exp} alertes d'expiration créées\n")

        # ═══════════════════════════════════════════════════════
        # 2. Alertes de réunion de comité (≤7j)
        # ═══════════════════════════════════════════════════════
        print("📋 Vérification des réunions de comité...")
        alert_date = today + timedelta(days=7)
        comites = db.query(Comite).all()
        nb_reunion = 0

        for comite in comites:
            for reunion in (comite.reunions or []):
                try:
                    reunion_date = datetime.strptime(
                        reunion.get('date', ''), '%Y-%m-%d'
                    ).date()
                    if today <= reunion_date <= alert_date:
                        existing = db.query(Alerte).filter(
                            Alerte.convention_id == comite.convention_id,
                            Alerte.type_alerte == "REUNION_COMITE",
                            Alerte.objet.like(f"%{reunion_date}%")
                        ).first()
                        if not existing:
                            conv = db.query(Convention).filter(
                                Convention.id == comite.convention_id
                            ).first()
                            if conv:
                                alerte = Alerte(
                                    convention_id=conv.id,
                                    type_alerte="REUNION_COMITE",
                                    objet=f"Réunion du comité {comite.type} - {reunion_date}",
                                    date_declenchement=datetime.now(),
                                    envoyee=True,
                                    traitee=True,
                                )
                                db.add(alerte)
                                nb_reunion += 1
                                print(f"   ✅ {comite.type} — {conv.numero_reference}")
                except (ValueError, TypeError):
                    continue

        db.commit()
        print(f"\n   → {nb_reunion} alertes de réunion créées\n")

        # ═══════════════════════════════════════════════════════
        # 3. Récap
        # ═══════════════════════════════════════════════════════
        total = db.query(Alerte).count()
        actives = db.query(Alerte).filter(Alerte.traitee == False).count()
        traitees = db.query(Alerte).filter(Alerte.traitee == True).count()

        print(f"{'=' * 60}")
        print(f"📊 RÉCAP")
        print(f"   Total    : {total}")
        print(f"   Actives  : {actives}   (à traiter)")
        print(f"   Traitées : {traitees}   (grisées)")
        print(f"{'=' * 60}")

    finally:
        db.close()


if __name__ == "__main__":
    main()