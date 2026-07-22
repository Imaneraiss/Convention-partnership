// ─────────────────────────────────────────
// FORMATAGE DES DATES
// ─────────────────────────────────────────

// 01/01/2026
export const formatDate = (date) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("fr-FR")
}

// 1 janvier 2026
export const formatDateLong = (date) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    })
}

// 01/01/2026 à 10:30
export const formatDateTime = (date) => {
    if (!date) return "—"
    return new Date(date).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

// Calcule le nombre de jours restants avant expiration
export const daysUntilExpiration = (dateExpiration) => {
    if (!dateExpiration) return null
    const today = new Date()
    const expiration = new Date(dateExpiration)
    const diff = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24))
    return diff
}

// Retourne le statut selon la date d'expiration
export const getStatutFromDate = (dateExpiration) => {
    const days = daysUntilExpiration(dateExpiration)
    if (days === null) return "EN_COURS"
    if (days < 0) return "EXPIREE"
    if (days <= 30) return "A_RENOUVELER"
    return "EN_COURS"
}