import api from './api'

// GET

// Liste tous les partenaires (avec filtres optionnels)
export const getPartenaires = (params = {}) => 
    api.get('/partenaires', { params })

// Détail d'un partenaire
export const getPartenaire = (id) => 
    api.get(`/partenaires/${id}`)

// POST

// Créer un partenaire
export const createPartenaire = (data) => 
    api.post('/partenaires', data)

// PUT

// Modifier un partenaire
export const updatePartenaire = (id, data) => 
    api.put(`/partenaires/${id}`, data)

// DELETE

// Supprimer un partenaire
export const deletePartenaire = (id) => 
    api.delete(`/partenaires/${id}`)