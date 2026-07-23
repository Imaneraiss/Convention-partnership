import api from './api'

// GET tout l'historique
export const getHistorique = () =>
    api.get('/historique')

// GET historique par utilisateur
export const getHistoriqueByUser = (user_id) =>
    api.get(`/historique/user/${user_id}`)