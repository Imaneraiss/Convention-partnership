import api from './api'

 // GET
 
// Liste tous les utilisateurs
export const getUsers = () =>
    api.get('/users')

// Détail d'un utilisateur
export const getUser = (id) =>
    api.get(`/users/${id}`)

 // POST
 
// Créer un utilisateur (Admin uniquement)
export const createUser = (data) =>
    api.post('/users', data)

 // PUT
 
// Modifier un utilisateur
export const updateUser = (id, data) =>
    api.put(`/users/${id}`, data)

// Modifier le mot de passe
export const updatePassword = (id, data) =>
    api.put(`/users/${id}/password`, data)

 // DELETE
 
// Supprimer un utilisateur (Admin uniquement)
export const deleteUser = (id) =>
    api.delete(`/users/${id}`)