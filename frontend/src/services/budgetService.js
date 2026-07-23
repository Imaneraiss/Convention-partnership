import api from "./api";

export const getBudget = (convention_id) => api.get(`/budgets/${convention_id}`)

export const createBudget = (data) => api.post('budgets',data)

export const updateBudget = (budget_id, data) => api.put (`/budgets/${budget_id}`, data)