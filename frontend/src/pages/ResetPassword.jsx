// pages/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import um5_logo from "../assets/um5.png";
import { Eye, EyeOff, MoveRight, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '../services/authService';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setMessage(t('auth.resetSuccess'));
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(t('auth.invalidLink'));
    } finally {
      setLoading(false);
    }
  };

  // Shared Left Panel
  const LeftPanel = () => (
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
  );

  // Si pas de token
  if (!token) {
    return (
      <div className="flex flex-col lg:flex-row bg-[#f5f3ef] min-h-screen">
        <div className="absolute top-4 right-4 z-10 lg:hidden">
          <LanguageSwitcher />
        </div>
        <LeftPanel />
        <section className="
          right-panel 
          flex flex-col justify-center items-center
          p-6 sm:p-10 lg:p-16 xl:p-20 
          w-full lg:w-2/3 
          min-h-[60vh] lg:min-h-screen
          relative
        ">
          <div className="hidden lg:block absolute top-6 right-6">
            <LanguageSwitcher />
          </div>
          <div className="w-full max-w-md text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600 mb-4">
              {t('auth.invalidLinkTitle')}
            </h1>
            <p className="text-gray-500 mb-8 text-sm sm:text-base">
              {t('auth.noTokenFound')}
            </p>
            <Link 
              to="/forgot-password" 
              className="inline-block text-[#003087] hover:underline text-sm sm:text-base font-medium"
            >
              {t('auth.newRequest')}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#f5f3ef] min-h-screen">
      {/* ✅ Sélecteur de langue en haut à droite (mobile) */}
      <div className="absolute top-4 right-4 z-10 lg:hidden">
        <LanguageSwitcher />
      </div>

      {/* Left Panel */}
      <LeftPanel />

      {/* Right Panel */}
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            {t('auth.newPassword')}
          </h1>
          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            {t('auth.chooseNewPassword')}
          </p>

          {message && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="flex-shrink-0" />
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="text-[#6b7280]">
            <div className="flex flex-col gap-5">
              {/* Nouveau mot de passe */}
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-mono text-sm sm:text-base">
                  {t('auth.newPassword')}
                </label>
                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="outline-none w-4/5 text-sm sm:text-base"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{t('auth.minCharacters')}</p>
              </div>

              {/* Confirmation */}
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="font-mono text-sm sm:text-base">
                  {t('auth.confirmPassword')}
                </label>
                <div className="flex bg-white p-3 rounded-lg border border-gray-200 relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="outline-none w-4/5 text-sm sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className={`flex justify-between items-center w-full text-left p-3 rounded-lg mt-2 transition-colors ${
                  loading || !password || !confirmPassword
                    ? 'bg-[#C5CFE8] cursor-not-allowed'
                    : 'bg-[#0c3e9c] text-white cursor-pointer hover:bg-[#003087]'
                }`}
              >
                <span className="text-sm sm:text-base">
                  {loading ? t('auth.resetting') : t('auth.resetPassword')}
                </span>
                <MoveRight size={20} />
              </button>
            </div>
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