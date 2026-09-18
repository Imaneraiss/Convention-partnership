import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CircleUserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";

export default function Header() {
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useTranslation();

    // ✅ Titres traduits
    const pageTitles = {
        "/dashboard": t('header.dashboard'),
        "/conventions": t('header.conventions'),
        "/alertes": t('header.alerts'),
        "/statistiques": t('header.statistics'),
        "/historique": t('header.history'),
        "/gestion-comptes": t('header.accountManagement'),
    };

    // ✅ Fonction pour obtenir le titre
    const getTitle = () => {
        const path = location.pathname;

        // Vérifier les titres statiques
        if (pageTitles[path]) {
            return pageTitles[path];
        }

        // ✅ Titres dynamiques (traduits)
        if (path.startsWith("/conventions/")) {
            return t('header.conventionDetail') || "Détail de la convention";
        }

        if (path.startsWith("/comites/")) {
            return t('header.committeeDetail') || "Détail du comité";
        }

        if (path.startsWith("/alertes/")) {
            return t('header.alertDetail') || "Détail de l'alerte";
        }

        // Titre par défaut
        return t('header.dashboard');
    };

    const title = getTitle();

    return (
        <header className="flex flex-wrap justify-between items-center bg-white px-4 sm:px-10 py-4 sm:py-5 border-b border-gray-200 gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-griffy text-gray-600">
                {title}
            </h1>

            <div className="flex items-center gap-3">
                {/* ✅ Sélecteur de langue */}
                <LanguageSwitcher />

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-100 flex items-center justify-center">
                        <CircleUserRound className="text-blue-900" size={24} />
                    </div>

                    <div className="flex flex-col">
                        <span className="font-griffy text-blue-800 text-sm sm:text-base">
                            {user?.nom}
                        </span>
                        <span className="text-xs sm:text-sm font-griffy text-blue-800">
                            {user?.role && t(`roles.${user.role}`)}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}