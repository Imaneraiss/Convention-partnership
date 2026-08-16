// pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import um5_logo from "../assets/um5.png";
import { forgotPassword } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await forgotPassword(email);
      setMessage('📧 Un lien de réinitialisation vous a été envoyé par email.');
      setEmail('');
    } catch (err) {
      setError('❌ Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#f5f3ef]">
      {/* Left Panel - Identique à Login */}
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
          <h1 className="text-4xl font-bold mb-2">Mot de passe oublié</h1>
          <p className="text-gray-500 mb-8">
            Entrez votre email institutionnel pour recevoir un lien de réinitialisation.
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
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-mono text-[#6b7280]">
                Email institutionnel
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@um5.ac.ma"
                className="bg-white p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003087]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`w-full flex justify-between items-center p-3 mt-8 rounded-lg ${
                loading || !email.trim() ? 'bg-[#C5CFE8] cursor-not-allowed' : 'bg-[#003087] text-white cursor-pointer hover:bg-[#002266]'
              }`}
            >
              <span>{loading ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
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