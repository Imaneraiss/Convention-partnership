// ─────────────────────────────────────────
// RÔLES UTILISATEURS
// ─────────────────────────────────────────
export const ROLES = {
    CHARGE: "CHARGE",
    SG: "SG",
    PRESIDENT: "PRESIDENT"
}

// ─────────────────────────────────────────
// STATUTS DES CONVENTIONS
// ─────────────────────────────────────────
export const STATUTS = {
    EN_COURS: "EN_COURS",
    EXPIREE: "EXPIREE",
    RENOUVELEE: "RENOUVELEE",
    A_RENOUVELER: "A_RENOUVELER"
}

// Couleurs des statuts (pour les badges)
export const STATUTS_COLORS = {
    EN_COURS: "green",
    EXPIREE: "red",
    RENOUVELEE: "blue",
    A_RENOUVELER: "orange"
}

// ─────────────────────────────────────────
// TYPES DE CONVENTIONS
// ─────────────────────────────────────────
export const TYPES_CONVENTION = [
    "Convention cadre de partenariat",
    "Convention spécifique",
    "Convention de partenariat",
    "Entente",
    "Contrat",
    "Avenant",
    "Mémorandum"
]

// ─────────────────────────────────────────
// TYPES DE PARTENAIRES
// ─────────────────────────────────────────
export const TYPES_PARTENAIRE = [
    "PUBLIC",
    "PRIVE",
    "ONG",
    "SEMI_PUBLIC"
]

// ─────────────────────────────────────────
// MODES DE RENOUVELLEMENT
// ─────────────────────────────────────────
export const MODES_RENOUVELLEMENT = [
    "Tacitement",
    "Tacitement une fois pour la même période",
    "Tacite dans la limite d'une durée totale de deux années consécutives",
    "Une fois d'une année",
    "Concertation des parties",
    "Par avenant",
    "Par décision de l'Assemblée Générale extraordinaire",
    "Non renouvelable"
]

// ─────────────────────────────────────────
// TYPES DE COMITÉS
// ─────────────────────────────────────────
export const TYPES_COMITE = [
    "PILOTAGE",
    "SUIVI",
    "TECHNIQUE"
]

// ─────────────────────────────────────────
// FRÉQUENCES DES RÉUNIONS
// ─────────────────────────────────────────
export const FREQUENCES_REUNION = [
    "Mensuelle",
    "Bimestrielle",
    "Trimestrielle",
    "Semestrielle",
    "Annuelle"
]

// ─────────────────────────────────────────
// TYPES D'ALERTES
// ─────────────────────────────────────────
export const TYPES_ALERTE = {
    FIN_CONVENTION: "FIN_CONVENTION",
    REUNION_COMITE: "REUNION_COMITE",
    MANUELLE: "MANUELLE"
}

export const TYPES_ALERTE_COLORS = {
    FIN_CONVENTION: "red",
    REUNION_COMITE: "orange",
    MANUELLE: "green"
}

// ─────────────────────────────────────────
// STATUTS BUDGET
// ─────────────────────────────────────────
export const STATUTS_BUDGET = [
    "OUI",
    "NON",
    "PARTIELLEMENT"
]

// ─────────────────────────────────────────
// ÉTABLISSEMENTS UM5
// ─────────────────────────────────────────
export const ETABLISSEMENTS_UM5 = [
    "UM5R",
    "FLSH",
    "FMD",
    "FMPH",
    "ENS",
    "ENSAM",
    "ENSET",
    "EST",
    "FSR",
    "FSJES AGDAL",
    "FSJES SOUISSI",
    "FSJES SALE",
    "EST SALE",
    "EMI",
    "ENSIAS",
    "IS"
]

// ─────────────────────────────────────────
// ACTIONS HISTORIQUE
// ─────────────────────────────────────────
export const ACTIONS_HISTORIQUE = {
    CREATION_CONVENTION: "CREATION_CONVENTION",
    MODIFICATION_CONVENTION: "MODIFICATION_CONVENTION",
    SUPPRESSION_CONVENTION: "SUPPRESSION_CONVENTION",
    CREATION_COMPTE: "CREATION_COMPTE",
    MODIFICATION_COMPTE: "MODIFICATION_COMPTE",
    SUPPRESSION_COMPTE: "SUPPRESSION_COMPTE",
    MODIFICATION_BUDGET: "MODIFICATION_BUDGET",
    CREATION_COMITE: "CREATION_COMITE",
    CREATION_REUNION: "CREATION_REUNION",
    CREATION_ALERTE: "CREATION_ALERTE",
    UPLOAD_FICHIER: "UPLOAD_FICHIER",
    SUPPRESSION_FICHIER: "SUPPRESSION_FICHIER"
}

// ─────────────────────────────────────────
// CONFIG API
// ─────────────────────────────────────────
export const API_BASE_URL = "http://localhost:8000/api"