import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";
import um5_logo from "../../assets/um5.png";
import { useTranslation } from "react-i18next";
import {
    LayoutDashboard,
    FileText,
    TriangleAlert,
    ChartColumn,
    History,
    Settings,
    LogOut,
    X,
} from "lucide-react";

export default function Sidebar({ isOpen = true, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { t } = useTranslation();

    // ✅ Navigation avec traductions
    const navItems = [
        {
            labelKey: "sidebar.dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
            roles: [ROLES.CHARGE, ROLES.PRESIDENT],
            adminOnly: false,
        },
        {
            labelKey: "sidebar.conventions",
            path: "/conventions",
            icon: FileText,
            roles: null,
            adminOnly: false,
        },
        {
            labelKey: "sidebar.alerts",
            path: "/alertes",
            icon: TriangleAlert,
            roles: [ROLES.CHARGE],
            adminOnly: false,
        },
        {
            labelKey: "sidebar.statistics",
            path: "/statistiques",
            icon: ChartColumn,
            roles: [ROLES.CHARGE, ROLES.PRESIDENT],
            adminOnly: false,
        },
        {
            labelKey: "sidebar.history",
            path: "/historique",
            icon: History,
            roles: [ROLES.CHARGE],
            adminOnly: true,
        },
        {
            labelKey: "sidebar.accountManagement",
            path: "/gestion-comptes",
            icon: Settings,
            roles: [ROLES.CHARGE],
            adminOnly: true,
        },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleNavigation = (path) => {
        navigate(path);
        // ✅ Fermer le sidebar sur mobile après navigation
        if (onClose) onClose();
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const filteredItems = navItems.filter((item) => {
        if (item.roles && !item.roles.includes(user?.role)) return false;
        if (item.adminOnly && !user?.is_admin) return false;
        return true;
    });

    return (
        <div className="
            flex flex-col justify-between 
            h-full 
            bg-white 
            border-r border-gray-200
            w-64
            p-4
        ">
            {/* ═══ HEADER ═══ */}
            <div>
                {/* Logo + Bouton fermer (mobile) */}
                <div className="flex items-center justify-between mb-6">
                    <img
                        src={um5_logo}
                        alt="Logo UM5"
                        className="bg-white w-24 h-16"
                    />
                    {/* Bouton fermer visible seulement sur mobile */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>
                    )}
                </div>

                {/* ═══ NAVIGATION ═══ */}
                <ul className="space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <li
                                key={item.path}
                                onClick={() => handleNavigation(item.path)}
                                className={`
                                    flex items-center gap-3 
                                    px-3 py-3 
                                    rounded-lg 
                                    cursor-pointer 
                                    transition-colors
                                    ${active
                                        ? "bg-blue-100 text-blue-900 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }
                                `}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                <span className="text-sm truncate">
                                    {t(item.labelKey)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* ═══ DÉCONNEXION ═══ */}
            <button
                onClick={handleLogout}
                className="
                    flex items-center gap-3 
                    px-3 py-3 
                    rounded-lg 
                    cursor-pointer 
                    text-red-600 
                    hover:bg-red-50 
                    transition-colors
                    w-full
                "
            >
                <LogOut size={20} className="flex-shrink-0" />
                <span className="text-sm font-medium">
                    {t("sidebar.logout")}
                </span>
            </button>
        </div>
    );
}