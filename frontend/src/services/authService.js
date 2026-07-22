import api from './api'

// Login — envoie email + mot de passe, reçoit le token
const login = async (email, mot_de_passe) => {
    const response = await api.post('/auth/login', { email, mot_de_passe })
    return response.data
}

// Changer le mot de passe
const changePassword = async (ancien_mot_de_passe, nouveau_mot_de_passe) => {
    const response = await api.post('/auth/change-password', {
        ancien_mot_de_passe,
        nouveau_mot_de_passe
    })
    return response.data
}

// Récupérer l'utilisateur connecté
const getMe = async () => {
    const response = await api.get('/auth/me')
    return response.data
}

// Déconnexion — supprime le token du localStorage
const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
}

const authService = { login, changePassword, getMe, logout }

export default authService