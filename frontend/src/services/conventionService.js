import api from './api'

// GET

// Liste toutes les conventions (avec filtres optionnels)
export const getConventions = (params = {}) => 
    api.get('/conventions', { params })

// Détail d'une convention
export const getConvention = (id) => 
    api.get(`/conventions/${id}`)

 // POST
 
// Créer une convention
export const createConvention = (data) => 
    api.post('/conventions', data)

 // PUT
 
// Modifier une convention
export const updateConvention = (id, data) => 
    api.put(`/conventions/${id}`, data)

 // DELETE
 
// Supprimer une convention
export const deleteConvention = (id) => 
    api.delete(`/conventions/${id}`)

 // EXPORT
 
// Exporter les conventions (PDF/Excel/Word)
export const exportConventions = (format, params = {}) =>
    api.get(`/conventions/export/${format}`, { 
        params,
        responseType: 'blob' // important pour les fichiers
    })