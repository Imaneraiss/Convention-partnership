import { useState } from "react";
import um5_logo from "../assets/um5.png";
import { Eye, EyeOff, MoveRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const isFormValid = email.trim() !== "" && password.trim() !== "";

    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await login(email, password);

            // Redirection selon le rôle
            if (data.premiere_connexion) {
                navigate("/change-password");
            } else if (data.role === "SG") {
                navigate("/conventions");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            setError(t("auth.wrongCredentials"));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row bg-[#f5f3ef] min-h-screen">

            {/* ✅ Sélecteur de langue en haut à droite (mobile) */}
            <div className="absolute top-4 right-4 z-10 lg:hidden">
                <LanguageSwitcher />
            </div>

            {/* ═══════════════ LEFT PANEL ═══════════════ */}
            <section className="
                left-panel 
                bg-[#003087] text-white 
                flex flex-col gap-6 justify-between 
                p-6 sm:p-10 lg:p-16 xl:p-20 
                w-full lg:w-1/3 
                min-h-[40vh] lg:min-h-screen
            ">
                <div className="bg-[#154399] w-fit">
                    <img
                        src={um5_logo}
                        alt="Logo UM5"
                        className="bg-white w-24 h-16 sm:w-28 sm:h-18 lg:w-30 lg:h-20 m-3 sm:m-4 lg:m-5"
                    />
                </div>

                <span className="border-t w-10 border-gray-400 hidden lg:block"></span>

                <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                    {t("auth.loginTitle")}
                </h1>

                <h2 className="opacity-70 text-sm sm:text-base lg:text-base">
                    {t("auth.loginSubtitle")}
                </h2>

                <span className="opacity-40 text-xs sm:text-sm">
                    © 2026 Université Mohammed V de Rabat
                </span>
            </section>

            {/* ═══════════════ RIGHT PANEL ═══════════════ */}
            <section className="
                right-panel 
                flex flex-col justify-center items-center
                p-6 sm:p-10 lg:p-16 xl:p-20 
                w-full lg:w-2/3 
                min-h-[60vh] lg:min-h-screen
                relative
            ">
                {/* ✅ Sélecteur de langue en haut à droite (desktop) */}
                <div className="hidden lg:block absolute top-6 right-6">
                    <LanguageSwitcher />
                </div>

                <div className="w-full max-w-md">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-8 lg:mb-12">
                        {t("auth.login")}
                    </h1>

                    {/* Message d'erreur */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="text-[#6b7280]">
                        <div className="flex flex-col gap-5">

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="font-mono text-sm sm:text-base">
                                    {t("auth.email")}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="prenom.nom@um5.ac.ma"
                                    className="bg-white p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003087] text-sm sm:text-base"
                                />
                            </div>

                            {/* Mot de passe */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="font-mono text-sm sm:text-base">
                                        {t("auth.password")}
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs sm:text-sm underline text-[#003087] hover:text-blue-700"
                                    >
                                        {t("auth.forgotPassword")}
                                    </Link>
                                </div>
                                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="outline-none w-4/5 text-sm sm:text-base"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Bouton de connexion */}
                            <button
                                type="submit"
                                className={`flex justify-between items-center w-full text-left p-3 rounded-lg mt-6 sm:mt-10 transition-colors ${
                                    isFormValid
                                        ? "bg-[#0c3e9c] text-white cursor-pointer hover:bg-[#003087]"
                                        : "bg-[#C5CFE8] cursor-not-allowed"
                                }`}
                                disabled={!isFormValid || loading}
                            >
                                <span className="text-sm sm:text-base">
                                    {loading ? t("common.loading") : t("auth.loginButton")}
                                </span>
                                <MoveRight size={20} />
                            </button>
                        </div>
                    </form>

                    
                </div>
            </section>
        </div>
    );
}