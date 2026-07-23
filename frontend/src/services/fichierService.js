import api from './api'

// Upload fichier (convention, réunion ou budget)
export const uploadFichier = (formData) =>
    api.post('/fichiers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })

// GET fichiers par convention
export const getFichiersByConvention = (convention_id) =>
    api.get(`/fichiers/convention/${convention_id}`)

// GET fichiers par réunion
export const getFichiersByReunion = (reunion_id) =>
    api.get(`/fichiers/reunion/${reunion_id}`)

// GET fichiers par budget
export const getFichiersByBudget = (budget_id) =>
    api.get(`/fichiers/budget/${budget_id}`)

// Supprimer un fichier
export const deleteFichier = (id) =>
    api.delete(`/fichiers/${id}`)

// Extraire les champs via OCR + Groq
export const extractConvention = (formData) =>
    api.post('/fichiers/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })