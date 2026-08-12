import api from './api'

// GET tout l'historique
export const getHistorique = () =>
    api.get('/historique')

// GET historique par utilisateur
export const getHistoriqueByUser = (user_id) =>
    api.get(`/historique/user/${user_id}`)

// GET historique par convention
export const getHistoriqueByConvention = (convention_id) =>
    api.get(`/historique/convention/${convention_id}`)

// POST - Créer une entrée (automatique)
export const createHistorique = (data) =>
    api.post('/historique', data)