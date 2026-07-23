import api from './api'

 // GET
 
// Liste toutes les alertes
export const getAlertes = (params = {}) =>
    api.get('/alertes', { params })

// Alertes d'une convention spécifique
export const getAlertesByConvention = (conventionId) =>
    api.get(`/alertes/convention/${conventionId}`)

 // POST
 
// Créer une alerte manuelle
export const createAlerte = (data) =>
    api.post('/alertes', data)

 // PUT
 
// Modifier une alerte
export const updateAlerte = (id, data) =>
    api.put(`/alertes/${id}`, data)

 
// Traiter une alerte
export const traiterAlerte = (id) =>
    api.patch(`/alertes/${id}/traiter`)