import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { ROLES } from "../../utils/constants"

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()

    const navItems = [
        { label: "Dashboard", path: "/dashboard", roles: null, adminOnly: false },
        { label: "Conventions", path: "/conventions", roles: [ROLES.CHARGE, ROLES.PRESIDENT], adminOnly: false },
        { label: "Alertes", path: "/alertes", roles: [ROLES.CHARGE], adminOnly: false },
        { label: "Statistiques", path: "/statistiques", roles: [ROLES.CHARGE, ROLES.PRESIDENT], adminOnly: false },
        { label: "Historique", path: "/historique", roles: [ROLES.CHARGE], adminOnly: true },
        { label: "Gestion comptes", path: "/gestion-comptes", roles: [ROLES.CHARGE], adminOnly: true },
    ]

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => {
        return location.pathname === path
    }
    const filteredItems = navItems.filter(item => {
        // Si roles = null → accessible à tous
        if (item.roles && !item.roles.includes(user?.role)) return false
        // Si adminOnly → vérifier is_admin
        if (item.adminOnly && !user?.is_admin) return false
        return true
    })
    return (
        <div>
            <div>Logo um5</div>
            <ul>
                {filteredItems.map(item => (
                    <li key = {item.path} 
                        onClick={ () => navigate(item.path)}
                        style={{backgroundColor : isActive(item.path) ? '#A8C0E0': 'transparent'
                        }}
                    >
                        {item.label}
                    </li>
                )) }
                
            </ul>
            <button onClick={handleLogout}>Déconnexion</button>
        </div>
    )
}