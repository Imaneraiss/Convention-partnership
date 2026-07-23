import api from "./api";
 
export const getComites  = () => api.get('/comites')

export const getComite  =(comite_id) => api.get(`/comites/${comite_id}`)
export const createComite = (data) => api.post('/comites', data)
export const updateComite = (comite_id, data) => api.put(`/comites/${comite_id}`, data)
export const deleteComite = (comite_id) => api.delete(`/comites/${comite_id}`)