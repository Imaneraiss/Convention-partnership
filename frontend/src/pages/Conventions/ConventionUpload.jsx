import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileText, Loader } from 'lucide-react';
import { extractConvention } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export default function ConventionUpload() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      const response = await extractConvention(formData);
      navigate('/conventions/form', {
        state: { extractedData: response.data, uploadedFile: file }
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('upload.extractError'));
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
      state: { extractedData: null, uploadedFile: null }
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4">
      {/* ═══ HEADER ═══ */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          {t('upload.title')}
        </h1>
        <p className="mt-2 text-xs sm:text-sm lg:text-base text-gray-600">
          {t('upload.subtitle')}
        </p>
      </div>

      {/* ═══ ZONE UPLOAD ═══ */}
      <Card className="p-4 sm:p-6 lg:p-8">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer transition-all duration-200 rounded-xl
            border-2 border-dashed p-6 sm:p-10 lg:p-14 text-center
            ${dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {loading ? (
            <div className="space-y-4">
              <Loader className="mx-auto text-blue-600 animate-spin" size={40} />
              <div>
                <p className="text-sm sm:text-base lg:text-lg font-medium text-gray-700">
                  {t('upload.extracting')}
                </p>
              </div>
              <div className="w-full max-w-xs mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 animate-pulse rounded-full w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <UploadCloud className="mx-auto text-blue-600 w-12 h-12 sm:w-16 sm:h-16 lg:w-[70px] lg:h-[70px]" />
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700">
                  {dragActive ? t('upload.dropHere') : t('upload.dropConvention')}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  {t('upload.orClick')}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                {t('upload.acceptedFormats')}
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
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

      {/* ═══ ENTRÉE MANUELLE ═══ */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-xs sm:text-sm text-gray-500 mb-3">{t('upload.noDocument')}</p>
        <button
          onClick={handleManualEntry}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors"
        >
          <FileText size={18} />
          {t('upload.manualEntry')}
        </button>
      </div>
    </div>
  );
}