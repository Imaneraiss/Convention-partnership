import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header(){
     
    const location = useLocation()
    const { user } = useAuth()

    const pageTitles = {
    '/dashboard': 'Dashboard',
    '/conventions': 'Conventions',
    '/alertes': 'Alertes',
    '/statistiques': 'Statistiques',
    '/historique': 'Historique',
    '/gestion-comptes': 'Gestion des comptes'
    }

    const title = pageTitles[location.pathname] || 'Dashboard'
        return(
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                <h1>{title}</h1>

                <div>
                    <span>{user?.nom}</span>
                    <span>|</span>
                    <span>{user?.role}</span>
                </div>
            </div>
        )
}