import api from './api'

export const getReunions = () => api.get('/reunions')
export const createReunion = (data) => api.post('/reunions', data)
export const updateReunion = (reunion_id, data) => api.put(`/reunions/${reunion_id}`, data)
export const deleteReunion = (reunion_id) => api.delete(`/reunions/${reunion_id}`)