import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, Loader } from 'lucide-react';
import { extractConvention } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export default function ConventionUpload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      // Appel à l'API d'extraction (OCR + Groq)
      const response = await extractConvention(formData);

      // Redirection vers le formulaire avec les données extraites
      navigate('/conventions/form', {
        state: {
          extractedData: response.data,
          uploadedFile: file
        }
      });
    } catch (err) {
      console.error('Erreur lors de l\'extraction:', err);
      setError("Erreur lors de l'extraction du document. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleManualEntry = () => {
    navigate('/conventions/form', {
      state: {
        extractedData: null,
        uploadedFile: null
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle convention</h1>
        <p className="mt-2 text-gray-600">
          Téléchargez un document existant ou remplissez le formulaire manuellement
        </p>
      </div>

      <Card className="p-8">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer transition-all duration-200 rounded-xl
            border-2 border-dashed p-14 text-center
            ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? (
            <div className="space-y-4">
              <Loader className="mx-auto text-blue-600 animate-spin" size={48} />
              <div>
                <p className="text-lg font-medium text-gray-700">Extraction en cours...</p>
                <p className="text-sm text-gray-500">OCR + Groq analysent votre document</p>
              </div>
              <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse rounded-full w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadCloud className="mx-auto text-blue-600" size={70} />
              <div>
                <h2 className="text-xl font-semibold text-gray-700">
                  {dragActive ? 'Déposez votre document ici' : 'Déposez votre convention ici'}
                </h2>
                <p className="mt-2 text-gray-500">
                  ou cliquez pour sélectionner un fichier
                </p>
              </div>
              <p className="text-sm text-gray-400">
                Formats acceptés : PDF • DOC • DOCX • PNG • JPG
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </Card>

      <div className="mt-8 text-center">
        <p className="text-gray-500 mb-3">Vous ne disposez pas du document ?</p>
        <button
          onClick={handleManualEntry}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <FileText size={18} />
          Remplir la convention manuellement
        </button>
      </div>
    </div>
  );
}