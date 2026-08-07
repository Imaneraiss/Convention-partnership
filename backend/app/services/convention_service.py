from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.convention import Convention

class ConventionService:
    
    # ✅ Mapping des modes de renouvellement
    MODES_CONDITIONNELS = [
        "Concertation des parties",
        "Par avenant",
        "Par décision de l'Assemblée Générale extraordinaire"
    ]
    
    MODES_RENOUVELLEMENT_INFINI = [
        "Tacitement",
        "Tacitement une fois pour la même période",
        "Tacitement deux fois pour la même période"
    ]
    
    MODES_NON_RENOUVELABLES = [
        "Non renouvelable"
    ]
    
    @staticmethod
    def calculer_statut(convention: Convention) -> str:
        """
        Calcule le statut d'une convention en fonction de sa date d'expiration,
        de son mode de renouvellement et de la décision du chargé
        """
        if not convention.date_expiration:
            return "EN_COURS"
        
        today = datetime.now().date()
        mode = convention.mode_renouvellement
        date_expiration = convention.date_expiration
        
        # ✅ 1. Si le chargé a coché "Expirée" pour les modes conditionnels → EXPIREE
        if convention.expiree_manuellement and mode in ConventionService.MODES_CONDITIONNELS:
            return "EXPIREE"
        
        # ✅ 2. Si la date d'expiration est dépassée → EXPIREE
        if date_expiration <= today:
            return "EXPIREE"
        
        # ✅ 3. Si mode non renouvelable
        if mode in ConventionService.MODES_NON_RENOUVELABLES:
            date_renouvellement = date_expiration - timedelta(days=90)
            if date_renouvellement <= today < date_expiration:
                return "A_RENOUVELER"
            return "EN_COURS"
        
        # ✅ 4. Si mode renouvellement infini (tacitement)
        if mode in ConventionService.MODES_RENOUVELLEMENT_INFINI:
            date_renouvellement = date_expiration - timedelta(days=90)
            if date_renouvellement <= today < date_expiration:
                return "A_RENOUVELER"
            return "EN_COURS"
        
        # ✅ 5. Modes conditionnels (sans expiree_manuellement coché)
        # Même comportement que les autres modes
        date_renouvellement = date_expiration - timedelta(days=90)
        if date_renouvellement <= today < date_expiration:
            return "A_RENOUVELER"
        return "EN_COURS"
    
    @staticmethod
    def mettre_a_jour_statut(db: Session, convention_id: str) -> str:
        """
        Met à jour le statut d'une convention spécifique
        """
        convention = db.query(Convention).filter(Convention.id == convention_id).first()
        if not convention:
            return None
        
        nouveau_statut = ConventionService.calculer_statut(convention)
        convention.statut = nouveau_statut
        db.commit()
        return nouveau_statut
    
    @staticmethod
    def mettre_a_jour_tous_les_statuts(db: Session) -> dict:
        """
        Met à jour les statuts de toutes les conventions
        """
        conventions = db.query(Convention).all()
        resultats = {
            "mises_a_jour": [],
            "erreurs": []
        }
        
        for convention in conventions:
            try:
                nouveau_statut = ConventionService.calculer_statut(convention)
                if convention.statut != nouveau_statut:
                    ancien_statut = convention.statut
                    convention.statut = nouveau_statut
                    resultats["mises_a_jour"].append({
                        "id": str(convention.id),
                        "intitule": convention.intitule,
                        "mode_renouvellement": convention.mode_renouvellement,
                        "expiree_manuellement": convention.expiree_manuellement,
                        "ancien_statut": ancien_statut,
                        "nouveau_statut": nouveau_statut
                    })
            except Exception as e:
                resultats["erreurs"].append({
                    "id": str(convention.id),
                    "erreur": str(e)
                })
        
        db.commit()
        return resultats
    
    @staticmethod
    def get_statut_info(statut: str) -> dict:
        """
        Retourne les informations sur un statut (couleur, label, icône)
        """
        infos = {
            "EN_COURS": {
                "label": "En cours",
                "couleur": "#0F6E56",
                "icone": "🟢",
                "description": "Convention en cours de validité"
            },
            "A_RENOUVELER": {
                "label": "À renouveler",
                "couleur": "#BA7517",
                "icone": "🟡",
                "description": "Convention arrivant à expiration dans moins de 3 mois"
            },
            "EXPIREE": {
                "label": "Expirée",
                "couleur": "#993C1D",
                "icone": "🔴",
                "description": "Convention arrivée à expiration"
            }
        }
        return infos.get(statut, infos["EN_COURS"])