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
 
// ✅ Support GET (export simple) et POST (export avec sélection)
export const exportConventions = (format, data = null) => {
  if (data) {
    // POST avec données (colonnes sélectionnées)
    return api.post(`/conventions/export/${format}`, data, {
      responseType: 'blob'
    });
  }
  // GET sans données (export complet)
  return api.get(`/conventions/export/${format}`, {
    responseType: 'blob'
  });
};