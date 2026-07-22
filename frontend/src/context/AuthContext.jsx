import { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

// Crée le contexte
const AuthContext = createContext(null)

// Provider — entoure toute l'application
export function AuthProvider({ children }) {

    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    // Au chargement — vérifie si un token existe déjà
    useEffect(() => {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')

        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
            setIsAuthenticated(true)
        }
        setLoading(false)
    }, [])

    // Login — appelé depuis Login.jsx
    const login = async (email, mot_de_passe) => {
        const data = await authService.login(email, mot_de_passe)

        // Stocke le token
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify({
            role: data.role,
            is_admin: data.is_admin,
            premiere_connexion: data.premiere_connexion
        }))

        setToken(data.access_token)
        setUser({ role: data.role, premiere_connexion: data.premiere_connexion })
        setIsAuthenticated(true)

        return data
    }

    // Logout — appelé depuis Header ou Sidebar
    const logout = () => {
        authService.logout()
        setToken(null)
        setUser(null)
        setIsAuthenticated(false)
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            loading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// Hook personnalisé pour utiliser le contexte facilement
export function useAuth() {
    return useContext(AuthContext)
}