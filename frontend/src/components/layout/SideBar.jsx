import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { ROLES } from "../../utils/constants"
import um5_logo from "../../assets/um5.png"
import {
    LayoutDashboard,
    FileText,
    TriangleAlert,
    ChartColumn,
    History,
    Settings,
    LogOut
} from "lucide-react";

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    console.log(user);
    const navItems = [
        {
            label: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
            roles: null,
            adminOnly: false
        },
        {
            label: "Conventions",
            path: "/conventions",
            icon: FileText,
            roles: [ROLES.CHARGE, ROLES.PRESIDENT],
            adminOnly: false
        },
        {
            label: "Alertes",
            path: "/alertes",
            icon: TriangleAlert,
            roles: [ROLES.CHARGE],
            adminOnly: false
        },
        {
            label: "Statistiques",
            path: "/statistiques",
            icon: ChartColumn,
            roles: [ROLES.CHARGE, ROLES.PRESIDENT],
            adminOnly: false
        },
        {
            label: "Historique",
            path: "/historique",
            icon: History,
            roles: [ROLES.CHARGE],
            adminOnly: true
        },
        {
            label: "Gestion comptes",
            path: "/gestion-comptes",
            icon: Settings,
            roles: [ROLES.CHARGE],
            adminOnly: true
        }
    ];
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
            <div className="flex flex-col justify-between h-3/4">
                <img src={um5_logo} alt="Logo de l'Université Mohammed V" className="bg-white w-30 h-20 m-5  "  />
                <ul >
                    {filteredItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <li
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-3 px-3 py-3 rounded cursor-pointer
                                            ${isActive(item.path)
                                                ? "bg-blue-200 text-blue-900"
                                                : "text-gray-600 hover:bg-gray-100"
                                                
                                            }
                                            `}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </li>
                            
                        );
                    })}
                </ul>
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-red-700 hover:bg-gray-100" >
                    <LogOut size={20}/>                
                    <span>Déconnexion</span>
                </button>
                
            </div>
        </div>
    )
}