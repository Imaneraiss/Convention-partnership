// components/common/DownloadButton.jsx
import { Download } from 'lucide-react';
import { useState } from 'react';
import { handleDownload } from '../../services/fichierService';

export default function DownloadButton({ fichierId, nomFichier, className = "" }) {
  const [loading, setLoading] = useState(false);

  const onDownload = async () => {
    if (!fichierId) {
      alert('Fichier non disponible');
      return;
    }
    
    setLoading(true);
    try {
      await handleDownload(fichierId, nomFichier);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDownload}
      disabled={loading || !fichierId}
      className={`p-1 transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
      } ${className}`}
    >
      {loading ? (
        <span className="text-xs">Chargement...</span>
      ) : (
        <Download size={16} className="text-blue-600" />
      )}
    </button>
  );
}