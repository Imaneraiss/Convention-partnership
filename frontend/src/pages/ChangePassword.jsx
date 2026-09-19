// pages/ChangePassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import um5_logo from "../assets/um5.png";
import { Eye, EyeOff, MoveRight, CheckCircle, AlertCircle, Key } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

export default function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isFormValid =
    ancienMotDePasse.trim() !== '' &&
    nouveauMotDePasse.trim() !== '' &&
    confirmMotDePasse.trim() !== '';

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);

  if (nouveauMotDePasse !== confirmMotDePasse) {
    setError(t('auth.passwordMismatch'));
    return;
  }

  if (nouveauMotDePasse.length < 6) {
    setError(t('auth.passwordTooShort'));
    return;
  }

  setLoading(true);
  try {
    await authService.changePassword(ancienMotDePasse, nouveauMotDePasse);
    
    // ✅ METTRE À JOUR le user en local
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    storedUser.premiere_connexion = false;
    localStorage.setItem('user', JSON.stringify(storedUser));
    
    setSuccess(true);
    
    // ✅ FORCER la navigation (rechargement complet)
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
    
  } catch (err) {
    console.error('Erreur:', err);
    setError(t('auth.wrongOldPassword'));
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
          {t('auth.loginTitle')}
        </h1>

        <h2 className="opacity-70 text-sm sm:text-base lg:text-base">
          {t('auth.loginSubtitle')}
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
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Key size={20} className="text-[#003087]" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              {t('auth.changePassword')}
            </h1>
          </div>

          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            {t('auth.firstConnectionMessage')}
          </p>

          {/* Message succès */}
          {success && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              {t('auth.passwordChangedSuccess')}
            </div>
          )}

          {/* Message erreur */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-[#6b7280]">
            <div className="flex flex-col gap-5">

              {/* Ancien mot de passe */}
              <div className="flex flex-col gap-2">
                <label htmlFor="oldPassword" className="font-mono text-sm sm:text-base">
                  {t('users.oldPassword')}
                </label>
                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                  <input
                    id="oldPassword"
                    type={showOld ? "text" : "password"}
                    value={ancienMotDePasse}
                    onChange={(e) => setAncienMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="outline-none w-4/5 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowOld(!showOld)}
                  >
                    {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div className="flex flex-col gap-2">
                <label htmlFor="newPassword" className="font-mono text-sm sm:text-base">
                  {t('auth.newPassword')}
                </label>
                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                  <input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={nouveauMotDePasse}
                    onChange={(e) => setNouveauMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="outline-none w-4/5 text-sm sm:text-base"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{t('auth.minCharacters')}</p>
              </div>

              {/* Confirmer mot de passe */}
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="font-mono text-sm sm:text-base">
                  {t('auth.confirmPassword')}
                </label>
                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmMotDePasse}
                    onChange={(e) => setConfirmMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="outline-none w-4/5 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`flex justify-between items-center w-full text-left p-3 rounded-lg mt-2 transition-colors ${
                  loading || !isFormValid
                    ? "bg-[#C5CFE8] cursor-not-allowed"
                    : "bg-[#0c3e9c] text-white cursor-pointer hover:bg-[#003087]"
                }`}
              >
                <span className="text-sm sm:text-base">
                  {loading ? t('auth.saving') : t('auth.save')}
                </span>
                <MoveRight size={20} />
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-xs sm:text-sm text-gray-500">
            <Link
              to="/dashboard"
              className="text-[#003087] hover:underline text-sm sm:text-base font-medium"
            >
              ← {t('auth.backToDashboard')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}