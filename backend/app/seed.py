import sys
sys.path.insert(0, '/app')

from app.database import SessionLocal
from app.models.user import User
from app.models.convention import Convention
from app.models.partenaire import Partenaire
from app.models.comite import Comite, ComiteDestinataireExterne
from app.models.reunion import Reunion
from app.models.alerte import Alerte
from app.models.budget import Budget
from app.models.historique import Historique
from app.auth import hash_password
import uuid
from datetime import date, datetime

def seed():
    db = SessionLocal()
    try:
        # ─────────────────────────────────────────
        # 1 — USERS
        # ─────────────────────────────────────────
        charge_admin = User(
            id=uuid.uuid4(),
            nom="Imane Raiss",
            email="imane@um5.ac.ma",
            mot_de_passe=hash_password("password123"),
            role="CHARGE",
            is_admin=True,
            premiere_connexion=False
        )
        charge_normal = User(
            id=uuid.uuid4(),
            nom="Ahmed Bennani",
            email="ahmed@um5.ac.ma",
            mot_de_passe=hash_password("password123"),
            role="CHARGE",
            is_admin=False,
            premiere_connexion=False
        )
        sg = User(
            id=uuid.uuid4(),
            nom="Fatima Zahra Idrissi",
            email="fatima@um5.ac.ma",
            mot_de_passe=hash_password("password123"),
            role="SG",
            is_admin=False,
            premiere_connexion=False
        )
        president = User(
            id=uuid.uuid4(),
            nom="Mohammed Alaoui",
            email="president@um5.ac.ma",
            mot_de_passe=hash_password("password123"),
            role="PRESIDENT",
            is_admin=False,
            premiere_connexion=False
        )

        db.add_all([charge_admin, charge_normal, sg, president])
        db.commit()

        # ─────────────────────────────────────────
        # 2 — CONVENTIONS
        # ─────────────────────────────────────────
        conv1 = Convention(
            id=uuid.uuid4(),
            numero_reference="01/2026",
            intitule="Convention cadre avec l'Université Paris Saclay",
            type="Convention cadre de partenariat",
            date_signature=date(2026, 1, 15),
            date_expiration=date(2029, 1, 15),
            statut="EN_COURS",
            mode_renouvellement="Tacitement",
            avec_budget=True,
            validation_conseil=True,
            formation_continue=False,
            user_id=charge_admin.id
        )
        conv2 = Convention(
            id=uuid.uuid4(),
            numero_reference="02/2026",
            intitule="Convention spécifique avec le CNRST",
            type="Convention spécifique",
            date_signature=date(2026, 2, 10),
            date_expiration=date(2027, 2, 10),
            statut="EN_COURS",
            mode_renouvellement="Par avenant",
            avec_budget=False,
            validation_conseil=True,
            formation_continue=True,
            user_id=charge_normal.id
        )
        conv3 = Convention(
            id=uuid.uuid4(),
            numero_reference="03/2026",
            intitule="Mémorandum avec l'Université Mohammed VI Polytechnique",
            type="Mémorandum",
            date_signature=date(2025, 6, 1),
            date_expiration=date(2026, 6, 1),
            statut="EXPIREE",
            mode_renouvellement="Non renouvelable",
            avec_budget=False,
            validation_conseil=False,
            formation_continue=False,
            user_id=charge_admin.id
        )
        conv4 = Convention(
            id=uuid.uuid4(),
            numero_reference="04/2026",
            intitule="Convention cadre avec l'OCP Group",
            type="Convention cadre de partenariat",
            date_signature=date(2026, 3, 20),
            date_expiration=date(2031, 3, 20),
            statut="EN_COURS",
            mode_renouvellement="Tacitement une fois pour la même période",
            avec_budget=True,
            validation_conseil=True,
            formation_continue=True,
            user_id=charge_normal.id
        )
        conv5 = Convention(
            id=uuid.uuid4(),
            numero_reference="05/2026",
            intitule="Convention spécifique avec l'ANAPEC",
            type="Convention spécifique",
            date_signature=date(2026, 4, 5),
            date_expiration=date(2028, 4, 5),
            statut="EN_COURS",
            mode_renouvellement="Concertation des parties",
            avec_budget=True,
            validation_conseil=True,
            formation_continue=False,
            user_id=charge_admin.id
        )

        db.add_all([conv1, conv2, conv3, conv4, conv5])
        db.commit()

        # ─────────────────────────────────────────
        # 3 — PARTENAIRES
        # ─────────────────────────────────────────
        partenaires = [
            Partenaire(
                id=uuid.uuid4(),
                nom="Université Paris Saclay",
                type="PUBLIC",
                ville="Paris",
                region="Île-de-France",
                pays="France",
                convention_id=conv1.id
            ),
            Partenaire(
                id=uuid.uuid4(),
                nom="CNRST",
                type="PUBLIC",
                ville="Rabat",
                region="Rabat-Salé-Kénitra",
                pays="Maroc",
                convention_id=conv2.id
            ),
            Partenaire(
                id=uuid.uuid4(),
                nom="Université Mohammed VI Polytechnique",
                type="PUBLIC",
                ville="Ben Guerir",
                region="Marrakech-Safi",
                pays="Maroc",
                convention_id=conv3.id
            ),
            Partenaire(
                id=uuid.uuid4(),
                nom="OCP Group",
                type="SEMI_PUBLIC",
                ville="Casablanca",
                region="Casablanca-Settat",
                pays="Maroc",
                convention_id=conv4.id
            ),
            Partenaire(
                id=uuid.uuid4(),
                nom="ANAPEC",
                type="PUBLIC",
                ville="Rabat",
                region="Rabat-Salé-Kénitra",
                pays="Maroc",
                convention_id=conv5.id
            ),
        ]
        db.add_all(partenaires)
        db.commit()

        # ─────────────────────────────────────────
        # 4 — BUDGETS
        # ─────────────────────────────────────────
        budgets = [
            Budget(
                id=uuid.uuid4(),
                montant=500000.0,
                modalites_paiement="Virement bancaire trimestriel",
                budget_recu="PARTIELLEMENT",
                montant_depense=120000.0,
                reste_a_payer=380000.0,
                commentaire="Premier versement reçu en janvier 2026",
                convention_id=conv1.id
            ),
            Budget(
                id=uuid.uuid4(),
                montant=250000.0,
                modalites_paiement="Virement annuel",
                budget_recu="NON",
                montant_depense=0.0,
                reste_a_payer=250000.0,
                commentaire="En attente du premier versement",
                convention_id=conv4.id
            ),
            Budget(
                id=uuid.uuid4(),
                montant=150000.0,
                modalites_paiement="Virement semestriel",
                budget_recu="OUI",
                montant_depense=75000.0,
                reste_a_payer=75000.0,
                commentaire="Budget bien géré",
                convention_id=conv5.id
            ),
        ]
        db.add_all(budgets)
        db.commit()

        # ─────────────────────────────────────────
        # 5 — COMITES
        # ─────────────────────────────────────────
        comite1 = Comite(
            id=uuid.uuid4(),
            type="PILOTAGE",
            frequence="Trimestrielle",
            convention_id=conv1.id
        )
        comite2 = Comite(
            id=uuid.uuid4(),
            type="SUIVI",
            frequence="Mensuelle",
            convention_id=conv1.id
        )
        comite3 = Comite(
            id=uuid.uuid4(),
            type="TECHNIQUE",
            frequence="Semestrielle",
            convention_id=conv4.id
        )

        db.add_all([comite1, comite2, comite3])
        db.commit()

        # Destinataires internes comités
        comite1.destinataires_internes.append(charge_admin)
        comite1.destinataires_internes.append(charge_normal)
        comite2.destinataires_internes.append(charge_admin)
        comite3.destinataires_internes.append(charge_normal)
        db.commit()

        # Destinataires externes comités
        externes = [
            ComiteDestinataireExterne(
                id=uuid.uuid4(),
                comite_id=comite1.id,
                email="contact@paris-saclay.fr"
            ),
            ComiteDestinataireExterne(
                id=uuid.uuid4(),
                comite_id=comite3.id,
                email="partenariat@ocpgroup.ma"
            ),
        ]
        db.add_all(externes)
        db.commit()

        # ─────────────────────────────────────────
        # 6 — REUNIONS
        # ─────────────────────────────────────────
        reunions = [
            Reunion(
                id=uuid.uuid4(),
                date_reunion=date(2026, 3, 15),
                decisions="Validation du plan d'action 2026. Prochaine réunion en juin.",
                comite_id=comite1.id
            ),
            Reunion(
                id=uuid.uuid4(),
                date_reunion=date(2026, 4, 10),
                decisions="Suivi des indicateurs Q1. Tout conforme aux objectifs.",
                comite_id=comite2.id
            ),
            Reunion(
                id=uuid.uuid4(),
                date_reunion=date(2026, 5, 20),
                decisions="Revue technique du projet. Ajustements mineurs nécessaires.",
                comite_id=comite3.id
            ),
        ]
        db.add_all(reunions)
        db.commit()

        # ─────────────────────────────────────────
        # 7 — ALERTES
        # ─────────────────────────────────────────
        alerte1 = Alerte(
            id=uuid.uuid4(),
            type_alerte="FIN_CONVENTION",
            date_declenchement=date(2026, 12, 25),
            objet="Convention 03/2026 expire dans 7 jours",
            envoyee=False,
            traitee=False,
            convention_id=conv3.id
        )
        alerte2 = Alerte(
            id=uuid.uuid4(),
            type_alerte="REUNION_COMITE",
            date_declenchement=date(2026, 7, 1),
            objet="Réunion trimestrielle du comité de pilotage à planifier",
            envoyee=False,
            traitee=False,
            convention_id=conv1.id
        )
        alerte3 = Alerte(
            id=uuid.uuid4(),
            type_alerte="MANUELLE",
            date_declenchement=date(2026, 8, 1),
            objet="Relancer OCP pour document manquant",
            envoyee=False,
            traitee=False,
            convention_id=conv4.id
        )

        db.add_all([alerte1, alerte2, alerte3])
        db.commit()

        # Destinataires alertes
        alerte1.destinataires.append(charge_admin)
        alerte1.destinataires.append(charge_normal)
        alerte2.destinataires.append(charge_admin)
        alerte3.destinataires.append(charge_admin)
        db.commit()

        # ─────────────────────────────────────────
        # 8 — HISTORIQUE
        # ─────────────────────────────────────────
        historique = [
            Historique(
                id=uuid.uuid4(),
                action="CREATION",
                date_action=datetime(2026, 1, 15, 10, 30),
                details="Convention 01/2026 créée",
                convention_id=conv1.id,
                user_id=charge_admin.id
            ),
            Historique(
                id=uuid.uuid4(),
                action="MODIFICATION",
                date_action=datetime(2026, 2, 20, 14, 0),
                details="Date d'expiration modifiée",
                convention_id=conv1.id,
                user_id=charge_admin.id
            ),
            Historique(
                id=uuid.uuid4(),
                action="CREATION",
                date_action=datetime(2026, 2, 10, 9, 0),
                details="Convention 02/2026 créée",
                convention_id=conv2.id,
                user_id=charge_normal.id
            ),
            Historique(
                id=uuid.uuid4(),
                action="CREATION",
                date_action=datetime(2026, 3, 20, 11, 0),
                details="Convention 04/2026 créée",
                convention_id=conv4.id,
                user_id=charge_normal.id
            ),
        ]
        db.add_all(historique)
        db.commit()

        print(" Seed terminé avec succès !")
        print(f"   - 4 utilisateurs créés")
        print(f"   - 5 conventions créées")
        print(f"   - 5 partenaires créés")
        print(f"   - 3 budgets créés")
        print(f"   - 3 comités créés")
        print(f"   - 3 réunions créées")
        print(f"   - 3 alertes créées")
        print(f"   - 4 historiques créés")

    except Exception as e:
        db.rollback()
        print(f"Erreur : {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()