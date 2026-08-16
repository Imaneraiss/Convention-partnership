// pages/ResetPassword.jsx
import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import um5_logo from "../assets/um5.png";
import { Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

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
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setMessage('✅ Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('❌ Lien invalide ou expiré. Veuillez refaire une demande.');
    } finally {
      setLoading(false);
    }
  };

  // Si pas de token
  if (!token) {
    return (
      <div className="flex bg-[#f5f3ef] h-screen">
        <section className="left-panel bg-[#003087] text-white h-screen flex flex-col gap-3 justify-between p-20 w-1/3">
          <div className="bg-[#154399] w-fit">
            <img src={um5_logo} alt="Logo UM5" className="bg-white w-30 h-20 m-5" />
          </div>
          <span className="border-t w-10 border-gray-400"></span>
          <h1 className="text-4xl">Gestion des Conventions de Partenariat</h1>
          <h2 className="opacity-70">
            Accédez à votre espace de suivi, d'archivage et de pilotage des conventions de partenariat de l'UM5.
          </h2>
          <span className="opacity-40">© 2026 Université Mohammed V de Rabat</span>
        </section>

        <section className="right-panel h-screen p-20 flex flex-col justify-center w-auto m-auto">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-red-600 mb-4">❌ Lien invalide</h1>
            <p className="text-gray-500 mb-8">
              Aucun token de réinitialisation n'a été trouvé.
            </p>
            <Link to="/forgot-password" className="text-[#003087] hover:underline">
              Faire une nouvelle demande
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f5f3ef]">
      {/* Left Panel */}
      <section className="left-panel bg-[#003087] text-white h-screen flex flex-col gap-3 justify-between p-20 w-1/3">
        <div className="bg-[#154399] w-fit">
          <img src={um5_logo} alt="Logo UM5" className="bg-white w-30 h-20 m-5" />
        </div>
        <span className="border-t w-10 border-gray-400"></span>
        <h1 className="text-4xl">Gestion des Conventions de Partenariat</h1>
        <h2 className="opacity-70">
          Accédez à votre espace de suivi, d'archivage et de pilotage des conventions de partenariat de l'UM5.
        </h2>
        <span className="opacity-40">© 2026 Université Mohammed V de Rabat</span>
      </section>

      {/* Right Panel */}
      <section className="right-panel h-screen p-20 flex flex-col justify-center w-auto m-auto">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-2">Nouveau mot de passe</h1>
          <p className="text-gray-500 mb-8">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nouveau mot de passe */}
            <div className="flex flex-col gap-2 mb-4">
              <label htmlFor="password" className="font-mono text-[#6b7280]">
                Nouveau mot de passe
              </label>
              <div className="flex bg-white p-3 border border-gray-200 rounded-lg relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="outline-none w-4/5"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Minimum 6 caractères</p>
            </div>

            {/* Confirmation */}
            <div className="flex flex-col gap-2 mb-8">
              <label htmlFor="confirmPassword" className="font-mono text-[#6b7280]">
                Confirmer le mot de passe
              </label>
              <div className="flex bg-white p-3 border border-gray-200 rounded-lg relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="outline-none w-4/5"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className={`w-full flex justify-between items-center p-3 rounded-lg ${
                loading || !password || !confirmPassword
                  ? 'bg-[#C5CFE8] cursor-not-allowed'
                  : 'bg-[#003087] text-white cursor-pointer hover:bg-[#002266]'
              }`}
            >
              <span>{loading ? 'Réinitialisation...' : 'Réinitialiser'}</span>
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            <Link to="/login" className="text-[#003087] hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}