import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Download, FileText } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import { uploadFichier, deleteFichier, downloadFile } from '../../../services/fichierService';
import DownloadButton from '../../../components/common/DownloadButton';

export default function BudgetTab({ readOnly, initialBudget = null, onChange, conventionId, budgetId }) {
  const { t } = useTranslation();
  
  // ✅ Devises (labels restent neutres)
  const DEVISES = [
    { value: 'MAD', label: '🇲🇦 MAD (Dirham)' },
    { value: 'EUR', label: '🇪🇺 EUR (Euro)' },
    { value: 'USD', label: '🇺🇸 USD (Dollar)' }
  ];

  const [budget, setBudget] = useState(initialBudget || {
    modalitePaiement: '', devise: 'MAD', montantTotal: 0,
    montantRecu: 0, montantDepense: 0, justificatifs: [], commentaire: ''
  });

  const [dragActive, setDragActive] = useState(false);
  const [downloading, setDownloading] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialBudget) {
      setBudget({ ...initialBudget, _modified: false });
    }
  }, [initialBudget]);

  const updateBudget = (newBudget) => {
    const updatedBudget = { ...newBudget, _modified: true };
    setBudget(updatedBudget);
    if (onChange) onChange(updatedBudget);
  };

  // ─── UPLOAD ───
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!conventionId) { alert(t('budget.saveFirst')); return; }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('convention_id', conventionId);
      formData.append('budget_id', budgetId);
      
      const response = await uploadFichier(formData);
      
      const newJustificatif = {
        id: response.data.id, nom: file.name,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      
      updateBudget({ ...budget, justificatifs: [...(budget.justificatifs || []), newJustificatif] });
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert(`❌ ${t('common.error')}`);
    }
  };

  // ─── TÉLÉCHARGEMENT ───
  const handleDownload = async (fichierId, nomFichier) => {
    if (!fichierId) { alert(t('common.error')); return; }
    setDownloading(prev => ({ ...prev, [fichierId]: true }));
    try {
      await downloadFile(fichierId, nomFichier);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    } finally {
      setDownloading(prev => ({ ...prev, [fichierId]: false }));
    }
  };

  // ─── SUPPRESSION ───
  const removeJustificatif = async (index) => {
    const justificatif = budget.justificatifs[index];
    if (justificatif.id) {
      try { await deleteFichier(justificatif.id); }
      catch (error) { console.error(error); alert(t('common.error')); return; }
    }
    updateBudget({ ...budget, justificatifs: (budget.justificatifs || []).filter((_, i) => i !== index) });
  };

  // ─── DRAG & DROP ───
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); };
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
  const handleFileInput = (e) => { const file = e.target.files[0]; if (file) handleFileUpload(file); };

  // ─── CALCULS ───
  const totalRestant = (budget.montantTotal || 0) - (budget.montantRecu || 0);
  const pourcentageRecu = budget.montantTotal > 0 ? (budget.montantRecu / budget.montantTotal) * 100 : 0;

  const getStatutBudget = () => {
    if (budget.montantTotal === 0) return { labelKey: 'budget.statusNotDefined', color: 'text-gray-600' };
    if (pourcentageRecu === 100) return { labelKey: 'budget.statusReceived', color: 'text-green-600' };
    if (pourcentageRecu >= 50) return { labelKey: 'budget.statusPartial', color: 'text-yellow-600' };
    if (pourcentageRecu > 0) return { labelKey: 'budget.statusReceiving', color: 'text-orange-600' };
    return { labelKey: 'budget.statusNotReceived', color: 'text-red-600' };
  };

  const statut = getStatutBudget();

  const getDeviseSymbol = (devise) => {
    const symbols = { MAD: 'DH', EUR: '€', USD: '$' };
    return symbols[devise] || devise;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ═══ MODALITÉS ═══ */}
      <Card className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{t('budget.paymentMethods')}</h3>
        {readOnly ? (
          <p className="text-sm sm:text-base text-gray-900">{budget.modalitePaiement || t('budget.notDefined')}</p>
        ) : (
          <Input value={budget.modalitePaiement}
            onChange={(e) => updateBudget({ ...budget, modalitePaiement: e.target.value })}
            placeholder={t('budget.paymentPlaceholder')} />
        )}
      </Card>

      {/* ═══ DEVISE ═══ */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700">{t('budget.currency')}</h3>
          {readOnly ? (
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              {DEVISES.find(d => d.value === budget.devise)?.label || budget.devise}
            </span>
          ) : (
            <select value={budget.devise || 'MAD'}
              onChange={(e) => updateBudget({ ...budget, devise: e.target.value })}
              className="rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 w-full sm:w-auto">
              {DEVISES.map(devise => <option key={devise.value} value={devise.value}>{devise.label}</option>)}
            </select>
          )}
        </div>
      </Card>

      {/* ═══ MONTANTS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">{t('budget.totalAmount')}</p>
          <p className="text-base sm:text-xl font-bold text-gray-900">
            {(budget.montantTotal || 0).toLocaleString()} {getDeviseSymbol(budget.devise)}
          </p>
          {!readOnly && (
            <Input type="number" value={budget.montantTotal || 0}
              onChange={(e) => updateBudget({ ...budget, montantTotal: parseFloat(e.target.value) || 0 })}
              className="mt-2 text-sm" />
          )}
        </Card>

        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">{t('budget.receivedAmount')}</p>
          <p className="text-base sm:text-xl font-bold text-green-600">
            {(budget.montantRecu || 0).toLocaleString()} {getDeviseSymbol(budget.devise)}
          </p>
          {!readOnly && (
            <Input type="number" value={budget.montantRecu || 0}
              onChange={(e) => updateBudget({ ...budget, montantRecu: parseFloat(e.target.value) || 0 })}
              className="mt-2 text-sm" />
          )}
        </Card>

        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">{t('budget.spentAmount')}</p>
          <p className="text-base sm:text-xl font-bold text-orange-600">
            {(budget.montantDepense || 0).toLocaleString()} {getDeviseSymbol(budget.devise)}
          </p>
          {!readOnly && (
            <Input type="number" value={budget.montantDepense || 0}
              onChange={(e) => updateBudget({ ...budget, montantDepense: parseFloat(e.target.value) || 0 })}
              className="mt-2 text-sm" />
          )}
        </Card>

        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">{t('budget.remaining')}</p>
          <p className="text-base sm:text-xl font-bold text-red-600">
            {totalRestant.toLocaleString()} {getDeviseSymbol(budget.devise)}
          </p>
          <p className={`text-xs sm:text-sm font-medium ${statut.color}`}>
            {t(statut.labelKey)}
          </p>
        </Card>
      </div>

      {/* ═══ JUSTIFICATIFS ═══ */}
      <Card className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FileText size={16} /> {t('budget.proofs')}
          {!readOnly && (
            <span className="text-xs text-gray-400 ms-2">
              ({(budget.justificatifs || []).length} {t('budget.files')})
            </span>
          )}
        </h3>

        {(budget.justificatifs || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {(budget.justificatifs || []).map((j, index) => (
              <div key={j.id || index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm text-gray-700 truncate">{j.nom}</span>
                    <span className="text-xs text-gray-400 ms-2">{j.uploadDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button type="button" onClick={() => handleDownload(j.id, j.nom)} disabled={downloading[j.id]}
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm flex items-center gap-1 disabled:opacity-50">
                    {downloading[j.id] ? (
                      <span className="text-xs">{t('common.loading')}</span>
                    ) : (
                      <><Download size={14} /> {t('common.download')}</>
                    )}
                  </button>
                  {!readOnly && (
                    <button type="button" onClick={() => removeJustificatif(index)}
                      className="text-red-600 hover:text-red-700 text-xs sm:text-sm">
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!readOnly && (
          <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            <UploadCloud className="mx-auto text-gray-400" size={28} />
            <p className="mt-2 text-xs sm:text-sm text-gray-600">
              {dragActive ? t('budget.dropHere') : t('budget.dragDrop')}
            </p>
            <p className="text-xs text-gray-400">{t('budget.acceptedFormats')}</p>
            <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileInput} />
          </div>
        )}
      </Card>

      {/* ═══ COMMENTAIRE ═══ */}
      <Card className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{t('budget.comment')}</h3>
        <Textarea value={budget.commentaire || ''}
          onChange={(e) => updateBudget({ ...budget, commentaire: e.target.value })}
          readOnly={readOnly} rows={3} placeholder={t('budget.commentPlaceholder')} />
      </Card>
    </div>
  );
}