import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import avatarSG from "../../assets/avatar_sg.jpg";
import avatarCharge from "../../assets/avatar_charge.avif";
import avatarPresident from "../../assets/avatar_pr.webp";

export default function Header() {
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useTranslation();

    // 🎭 Mapping rôle → image
    const roleAvatars = {
        SG: avatarSG,
        CHARGE: avatarCharge,
        PRESIDENT: avatarPresident,
    };

    const avatarSrc = roleAvatars[user?.role] ;

    // ✅ Titres traduits
    const pageTitles = {
        "/dashboard": t('header.dashboard'),
        "/conventions": t('header.conventions'),
        "/alertes": t('header.alerts'),
        "/statistiques": t('header.statistics'),
        "/historique": t('header.history'),
        "/gestion-comptes": t('header.accountManagement'),
    };

    const getTitle = () => {
        const path = location.pathname;
        if (pageTitles[path]) return pageTitles[path];
        if (path.startsWith("/conventions/")) return t('header.conventionDetail') || "Détail de la convention";
        if (path.startsWith("/comites/")) return t('header.committeeDetail') || "Détail du comité";
        if (path.startsWith("/alertes/")) return t('header.alertDetail') || "Détail de l'alerte";
        return t('header.dashboard');
    };

    const title = getTitle();

    return (
        <header className="
            sticky top-0 z-50
            flex flex-wrap justify-between items-center 
            bg-white 
            px-4 sm:px-10 py-4 sm:py-5 
            border-b border-gray-200 gap-3
            shadow-sm
        ">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-griffy text-gray-600">
                {title}
            </h1>

            <div className="flex items-center gap-3">
                <LanguageSwitcher />

                <div className="flex items-center gap-3">
                    <div className="
                        w-18 h-18 sm:w-15 sm:h-15 
                        rounded-full 
                        overflow-hidden 
                        bg-blue-100
                        ring-2 ring-blue-100
                        shadow-sm
                    ">
                        <img
                            src={avatarSrc}
                            alt={user?.role || "Avatar"}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <span className="font-griffy text-blue-800 text-sm sm:text-base hidden sm:block">
                        {user?.nom}
                    </span>
                </div>
            </div>
        </header>
    );
}