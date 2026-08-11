import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CircleUserRound } from "lucide-react";

export default function Header() {
    const location = useLocation();
    const { user } = useAuth();

    const pageTitles = {
        "/dashboard": "Dashboard",
        "/conventions": "Conventions",
        "/alertes": "Alertes",
        "/statistiques": "Statistiques",
        "/historique": "Historique",
        "/gestion-comptes": "Gestion des comptes",
    };

    // ✅ Fonction pour obtenir le titre
    const getTitle = () => {
        const path = location.pathname;

        // Vérifier les titres statiques
        if (pageTitles[path]) {
            return pageTitles[path];
        }

        // ✅ Titres dynamiques
        if (path.startsWith("/conventions/")) {
            return "Détail de la convention";
        }

        if (path.startsWith("/comites/")) {
            return "Détail du comité";
        }

        if (path.startsWith("/alertes/")) {
            return "Détail de l'alerte";
        }

        // Titre par défaut
        return "Dashboard";
    };

    const title = getTitle();

    return (
        <header className="flex justify-between items-center bg-white px-10 py-5 border-b border-l border-gray-200 ">
            <h1 className="text-3xl font-griffy text-gray-600">
                {title}
            </h1>

            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
                    <CircleUserRound className="text-blue-900" size={26} />
                </div>

                <div className="flex flex-col">
                    <span className="font-griffy text-blue-800">
                        {user?.nom}
                    </span>

                    <span className="text-sm font-griffy text-blue-800">
                        {user?.role}
                    </span>
                </div>
            </div>
        </header>
    );
}