from sqlalchemy.orm import Session
from app.models import Convention, Partenaire, Budget
from datetime import datetime

class StatistiquesService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_stats(self, periode, date_debut, date_fin):
        """Récupérer toutes les statistiques"""
        query = self.db.query(Convention)
        
        # Filtrage par période
        if periode == 'personnalise' and date_debut and date_fin:
            query = query.filter(
                Convention.date_signature >= date_debut,
                Convention.date_signature <= date_fin
            )
        elif periode != 'all':
            query = query.filter(
                Convention.date_signature.startswith(periode)
            )
        
        conventions = query.all()
        
        # Statistiques de base
        total = len(conventions)
        en_cours = sum(1 for c in conventions if c.statut == 'EN_COURS')
        expirees = sum(1 for c in conventions if c.statut == 'EXPIREE')
        a_renouveler = sum(1 for c in conventions if c.statut == 'A_RENOUVELER')
        renouvelees = sum(1 for c in conventions if c.statut == 'RENOUVELEE')
        
        # Type de convention
        par_type = {}
        for c in conventions:
            par_type[c.type] = par_type.get(c.type, 0) + 1
        
        # Statut
        par_statut = {
            'En cours': en_cours,
            'Expirée': expirees,
            'À renouveler': a_renouveler,
            'Renouvelée': renouvelees
        }
        
        # Type de partenaire
        par_type_partenaire = {}
        for c in conventions:
            if c.partenaires:
                for p in c.partenaires:
                    par_type_partenaire[p.type] = par_type_partenaire.get(p.type, 0) + 1
        
        # Budget
        avec_budget = sum(1 for c in conventions if c.avec_budget)
        sans_budget = total - avec_budget
        
        # Budget total
        budget_total = 0
        for c in conventions:
            if c.budget:
                budget_total += c.budget.montant_total or 0
        
        return {
            'total_conventions': total,
            'en_cours': en_cours,
            'expirees': expirees,
            'a_renouveler': a_renouveler,
            'renouvelees': renouvelees,
            'par_type': self._format_stats(par_type, total),
            'par_statut': self._format_stats(par_statut, total),
            'par_type_partenaire': self._format_stats(par_type_partenaire, total),
            'avec_budget': {
                'oui': avec_budget,
                'non': sans_budget,
                'total': total
            },
            'taux_renouvellement': round((renouvelees / total) * 100 if total > 0 else 0, 1),
            'budget_total': budget_total
        }
    
    def _format_stats(self, data, total):
        """Formater les statistiques avec pourcentages"""
        return [
            {
                'type' if k in ['Privé', 'Public', 'ONG', 'Semi-Public'] else 
                'statut' if k in ['En cours', 'Expirée', 'À renouveler', 'Renouvelée'] else 
                'mode' if k in ['Tacitement', 'Par avenant', 'Concertation des parties', 'Non renouvelable'] else 
                'region' if k in ['Rabat-Salé-Kénitra', 'Casablanca-Settat', 'Fès-Meknès', 'International'] else 
                'type' if k in ['Convention cadre', 'Convention spécifique', 'Contrat', 'Mémorandum'] else 
                'variable': k,
                'count': v,
                'pourcentage': round((v / total) * 100 if total > 0 else 0, 1)
            }
            for k, v in data.items()
        ]