from enum import Enum

class TypeAlerte(str, Enum):
    DIFFUSION_CADRE = "DIFFUSION_CADRE"        # Envoi aux établissements UM5
    DIFFUSION_BUDGET = "DIFFUSION_BUDGET"      # Envoi aux services financiers
    NOTIFICATION_COMMENTAIRE = "NOTIFICATION_COMMENTAIRE"  # Notification interne
    RAPPEL_EXPIRATION = "RAPPEL_EXPIRATION"    # T-3 / T-2 / T-1
    RAPPEL_REUNION = "RAPPEL_REUNION"          # J-7
    MANUELLE = "MANUELLE"                      # Alerte personnalisée