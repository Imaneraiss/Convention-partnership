// pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import um5_logo from "../assets/um5.png";
import { Mail, MoveRight, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPassword } from '../services/authService';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFormValid = email.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await forgotPassword(email);
      setMessage(t('auth.resetLinkSent'));
      setEmail('');
    } catch (err) {
      setError(t('auth.forgotError'));
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
              <Mail size={20} className="text-[#003087]" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
              {t('auth.forgotPassword')}
            </h1>
          </div>

          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            {t('auth.forgotPasswordSubtitle')}
          </p>

          {/* Message succès */}
          {message && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              {message}
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
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-mono text-sm sm:text-base">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@um5.ac.ma"
                className="bg-white p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003087] text-sm sm:text-base"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`flex justify-between items-center w-full text-left p-3 rounded-lg mt-6 sm:mt-8 transition-colors ${
                loading || !isFormValid
                  ? 'bg-[#C5CFE8] cursor-not-allowed'
                  : 'bg-[#0c3e9c] text-white cursor-pointer hover:bg-[#003087]'
              }`}
            >
              <span className="text-sm sm:text-base">
                {loading ? t('auth.sending') : t('auth.sendLink')}
              </span>
              <MoveRight size={20} />
            </button>
          </form>

          <p className="text-center mt-6 text-xs sm:text-sm text-gray-500">
            <Link
              to="/login"
              className="text-[#003087] hover:underline text-sm sm:text-base font-medium"
            >
              ← {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}