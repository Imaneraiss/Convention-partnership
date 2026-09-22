import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Button from '../../../components/common/Button';
import DownloadButton from '../../../components/common/DownloadButton';

import { 
  TYPES_CONVENTION, 
  MODES_RENOUVELLEMENT,
  TYPES_PARTENAIRE,
  ETABLISSEMENTS_UM5,
  SIGNATAIRES_UM5,
  optionsBilingues
} from '../../../utils/constants';
import { bil } from '../../../utils/traductionsBilingues';   // ⬅️ AJOUTÉ
import { X, Plus, Upload, FileText, AlertCircle, Download, RefreshCw } from 'lucide-react';

// ✅ Modes conditionnels
const MODES_CONDITIONNELS = [
  "Concertation des parties",
  "Par avenant",
  "Par décision de l'Assemblée Générale extraordinaire"
];

// ✅ Options bilingues pour les signataires UM5
const SIGNATAIRES_UM5_BILINGUES = SIGNATAIRES_UM5.map(s => ({
  value: s.value,
  label: bil(s.label)
}));

export default function GeneralTab({
  formData,
  partenaires,
  motCle,
  setMotCle,
  onFormChange,
  onPartenaireChange,
  onAddPartenaire,
  onRemovePartenaire,
  onAddMotCle,
  onRemoveMotCle,
  readOnly,
  onExtractDocument,
  onExtractedData,
  conventionId,
  isFromUpload = false,
  uploadedFile = null,
  uploadedFileInfo = null,
  onFileChange
}) {
  const { t } = useTranslation();
  const [nouvelArticle, setNouvelArticle] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [replacementMode, setReplacementMode] = useState(false);

  const articlesMasques = formData.articles_masques || [];

  // ✅ Articles prédéfinis (traduits)
  const ARTICLES_DEFAUT = [
    { id: 'objet', labelKey: 'articles.objet', placeholderKey: 'articles.objetPlaceholder' },
    { id: 'objectif', labelKey: 'articles.objectif', placeholderKey: 'articles.objectifPlaceholder' },
    { id: 'engagement_um5', labelKey: 'articles.engagementUm5', placeholderKey: 'articles.engagementUm5Placeholder' },
    { id: 'engagement_partenaire', labelKey: 'articles.engagementPartenaire', placeholderKey: 'articles.engagementPartenairePlaceholder' },
    { id: 'engagement_commun', labelKey: 'articles.engagementCommun', placeholderKey: 'articles.engagementCommunPlaceholder' },
    { id: 'principaux_domaines', labelKey: 'articles.principauxDomaines', placeholderKey: 'articles.principauxDomainesPlaceholder' },
    { id: 'communication', labelKey: 'articles.communication', placeholderKey: 'articles.communicationPlaceholder' },
    { id: 'reglement_litiges', labelKey: 'articles.reglementLitiges', placeholderKey: 'articles.reglementLitigesPlaceholder' },
    { id: 'forces_majeurs', labelKey: 'articles.forcesMajeurs', placeholderKey: 'articles.forcesMajeursPlaceholder' },
    { id: 'modification_resiliation', labelKey: 'articles.modificationResiliation', placeholderKey: 'articles.modificationResiliationPlaceholder' },
    { id: 'confidentialite', labelKey: 'articles.confidentialite', placeholderKey: 'articles.confidentialitePlaceholder' },
    { id: 'protection_donnees', labelKey: 'articles.protectionDonnees', placeholderKey: 'articles.protectionDonneesPlaceholder' },
    { id: 'propriete_intellectuelle', labelKey: 'articles.proprieteIntellectuelle', placeholderKey: 'articles.proprieteIntellectuellePlaceholder' },
  ];

  // ✅ Drag & Drop
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (isFromUpload && !window.confirm(t('general.confirmReplace'))) return;

    setNewFile(file);
    onFileChange?.(file);
    setReplacementMode(true);
    setIsExtracting(true);
    setExtractError(null);

    try {
      if (onExtractDocument) {
        const result = await onExtractDocument(file);
        if (result && !result.error) {
          onExtractedData(result.data, file);
          onFormChange('articles_masques', []);
          alert(t('general.replaceSuccess'));
        } else {
          setExtractError(result?.message || t('common.error'));
        }
      }
    } catch (error) {
      console.error('Erreur extraction:', error);
      setExtractError(error.message || t('common.error'));
    } finally {
      setIsExtracting(false);
      setReplacementMode(false);
    }
  }, [onExtractDocument, onExtractedData, isFromUpload, onFileChange, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: readOnly || isExtracting
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onAddMotCle(); }
  };

  const ajouterArticle = () => {
    if (nouvelArticle.trim()) {
      const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newArticle = { id, label: nouvelArticle.trim(), placeholder: t('articles.customPlaceholder'), custom: true };
      onFormChange('articles_personnalises', [...(formData.articles_personnalises || []), newArticle]);
      onFormChange('articles', { ...(formData.articles || {}), [id]: '' });
      setNouvelArticle('');
    }
  };

  const supprimerArticle = (id) => {
    const currentCustom = formData.articles_personnalises || [];
    onFormChange('articles_personnalises', currentCustom.filter(a => a.id !== id));
    const newArticles = { ...(formData.articles || {}) };
    delete newArticles[id];
    onFormChange('articles', newArticles);
  };

  const masquerArticle = (id) => onFormChange('articles_masques', [...articlesMasques, id]);
  const afficherArticle = (id) => onFormChange('articles_masques', articlesMasques.filter(a => a !== id));

  const getArticleValue = (articleId) => formData.articles?.[articleId] || '';
  const setArticleValue = (articleId, value) => onFormChange('articles', { ...(formData.articles || {}), [articleId]: value });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileInfo = uploadedFileInfo || (uploadedFile ? { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type } : null);

  const articlesAffiches = [
    ...ARTICLES_DEFAUT.filter(a => !articlesMasques.includes(a.id)),
    ...(formData.articles_personnalises || []).filter(a => !articlesMasques.includes(a.id))
  ];

  const articlesMasquesList = [
    ...ARTICLES_DEFAUT.filter(a => articlesMasques.includes(a.id)),
    ...(formData.articles_personnalises || []).filter(a => articlesMasques.includes(a.id))
  ];

  const isModeConditionnel = MODES_CONDITIONNELS.includes(formData.mode_renouvellement);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ═══ SECTION FICHIER ═══ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} />
            {isFromUpload ? t('general.uploadedDocument') : t('general.uploadDocument')}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {fileInfo && !readOnly && (
              <button type="button" onClick={() => document.getElementById('fileInput')?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                <RefreshCw size={14} /> {t('general.replace')}
              </button>
            )}
            {!isFromUpload && !readOnly && (
              <span className="text-xs text-gray-400">{t('general.acceptedFormats')}</span>
            )}
          </div>
        </div>

        {isFromUpload && fileInfo ? (
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{fileInfo.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatFileSize(fileInfo.size)} • {fileInfo.type || 'Document'}
                    {fileInfo.uploadDate && ` • ${new Date(fileInfo.uploadDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              {uploadedFileInfo?.id && (
                <DownloadButton fichierId={uploadedFileInfo.id} nomFichier={uploadedFileInfo.name} />
              )}
            </div>
          </div>
        ) : null}

        {(!isFromUpload || !readOnly) && (
          <div {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'} ${(readOnly || isExtracting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input {...getInputProps()} id="fileInput" />
            {isExtracting ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 font-medium text-sm">
                  {replacementMode ? t('general.replacing') : t('general.extracting')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-gray-400" size={32} />
                <div>
                  <p className="text-gray-600 font-medium text-sm">
                    {isDragActive ? t('general.dropHere') :
                     isFromUpload ? t('general.dropToReplace') :
                     t('general.dropDocument')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">{t('general.orClick')}</p>
                </div>
                <div className="flex justify-center gap-2 sm:gap-4 text-xs text-gray-400 flex-wrap">
                  <span>PDF</span><span>DOC</span><span>DOCX</span><span>PNG</span><span>JPG</span>
                </div>
                {extractError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} /> {extractError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isFromUpload && !readOnly && !isExtracting && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={12} /> {t('general.replaceWarning')}
          </p>
        )}
        {!isFromUpload && !readOnly && !isExtracting && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={12} /> {t('general.uploadWarning')}
          </p>
        )}
      </section>

      {/* ═══ IDENTIFICATION ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.identification')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="md:col-span-2">
            <Input label={t('conventions.intitule')} name="intitule" value={formData.intitule || ''}
              onChange={(e) => onFormChange('intitule', e.target.value)} required readOnly={readOnly}
              placeholder={t('general.intitulePlaceholder')} />
          </div>
          <Select label={t('conventions.type')} name="type" value={formData.type || ''}
            onChange={(e) => onFormChange('type', e.target.value)}
            options={optionsBilingues(TYPES_CONVENTION)}              /* ⬅️ BILINGUE */
            required readOnly={readOnly} />
          <div className="space-y-2">
            <Select label={t('general.renewalMode')} name="mode_renouvellement" value={formData.mode_renouvellement || ''}
              onChange={(e) => onFormChange('mode_renouvellement', e.target.value)}
              options={optionsBilingues(MODES_RENOUVELLEMENT)}        /* ⬅️ BILINGUE */
              readOnly={readOnly} />
            {isModeConditionnel && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={formData.expiree_manuellement || false}
                  onChange={(e) => onFormChange('expiree_manuellement', e.target.checked)}
                  disabled={readOnly} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <span className="text-sm text-gray-700">{t('general.expiredConvention')}</span>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* ═══ DATES ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.datesDuration')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Input label={t('conventions.signatureDate')} name="date_signature" type="date"
            value={formData.date_signature || ''} onChange={(e) => onFormChange('date_signature', e.target.value)}
            required readOnly={readOnly} />
          <Input label={t('general.durationYears')} name="duree_annees" type="number" min="1" max="10"
            value={formData.duree_annees || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : '';
              onFormChange('duree_annees', value);
              if (value && formData.date_signature) {
                const dateSig = new Date(formData.date_signature);
                dateSig.setFullYear(dateSig.getFullYear() + value);
                dateSig.setDate(dateSig.getDate() - 1);
                onFormChange('date_expiration', dateSig.toISOString().split('T')[0]);
              } else if (!value) onFormChange('date_expiration', '');
            }}
            readOnly={readOnly} placeholder={t('general.durationPlaceholder')} />
          <Input label={t('conventions.expirationDate')} name="date_expiration" type="date"
            value={formData.date_expiration || ''} onChange={(e) => onFormChange('date_expiration', e.target.value)}
            readOnly={true} className="bg-gray-50"
            placeholder={formData.duree_annees ? t('general.autoCalculated') : ''} />
        </div>
        {formData.date_signature && !formData.duree_annees && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle size={16} /> {t('general.pleaseSetDuration')}
            </p>
          </div>
        )}
       
      </section>

      {/* ═══ SIGNATAIRE UM5 ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('conventions.signatoryUM5')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Select label={t('conventions.signatoryUM5')} name="signataire_um5" value={formData.signataire_um5 || ''}
            onChange={(e) => onFormChange('signataire_um5', e.target.value)}
            options={SIGNATAIRES_UM5_BILINGUES}                        /* ⬅️ BILINGUE */
            required readOnly={readOnly} placeholder={t('general.selectSignatory')} />
          <Input label={t('general.otherSignatory')} name="signataire_um5_autre" value={formData.signataire_um5_autre || ''}
            onChange={(e) => onFormChange('signataire_um5_autre', e.target.value)}
            readOnly={readOnly} placeholder={t('general.specifySignatory')} />
        </div>
      </section>

      {/* ═══ PARTENAIRES ═══ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.partnerSignatories')}</h3>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={onAddPartenaire} className="text-xs sm:text-sm">
              + {t('general.addPartner')}
            </Button>
          )}
        </div>

        {partenaires && partenaires.length > 0 ? (
          partenaires.map((p, index) => (
            <div key={index} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700 text-sm">{t('general.partner')} {index + 1}</span>
                {!readOnly && partenaires.length > 1 && (
                  <button type="button" onClick={() => onRemovePartenaire(index)} className="text-xs sm:text-sm text-red-600 hover:text-red-700">
                    {t('common.delete')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label={t('conventions.partnerName')} value={p.nom || ''} onChange={(e) => onPartenaireChange(index, 'nom', e.target.value)} required readOnly={readOnly} />
                <Select label={t('conventions.partnerType')} value={p.type || ''} onChange={(e) => onPartenaireChange(index, 'type', e.target.value)}
                  options={optionsBilingues(TYPES_PARTENAIRE)}          /* ⬅️ BILINGUE */
                  required readOnly={readOnly} />
                <Input label={t('conventions.partnerCity')} value={p.ville || ''} onChange={(e) => onPartenaireChange(index, 'ville', e.target.value)} readOnly={readOnly} />
                <Input label={t('conventions.partnerRegion')} value={p.region || ''} onChange={(e) => onPartenaireChange(index, 'region', e.target.value)} readOnly={readOnly} />
                <Input label={t('conventions.partnerCountry')} value={p.pays || 'Maroc'} onChange={(e) => onPartenaireChange(index, 'pays', e.target.value)} readOnly={readOnly} />
                <Input label={t('general.partnerSignatory')} value={p.signataire || ''} onChange={(e) => onPartenaireChange(index, 'signataire', e.target.value)} readOnly={readOnly} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 border border-dashed border-gray-300 rounded-lg text-sm">
            <p>{t('general.noPartner')}</p>
            {!readOnly && <p className="text-xs mt-1">{t('general.clickAddPartner')}</p>}
          </div>
        )}
      </section>

      {/* ═══ OPTIONS ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.options')}</h3>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {[
            { field: 'avec_budget', labelKey: 'conventions.withBudget' },
            { field: 'validation_conseil', labelKey: 'conventions.validationCouncil' },
            { field: 'formation_continue', labelKey: 'conventions.formationContinue' },
          ].map(({ field, labelKey }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData[field] || false} onChange={(e) => onFormChange(field, e.target.checked)}
                disabled={readOnly} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-xs sm:text-sm text-gray-700">{t(labelKey)}</span>
            </label>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={!!uploadedFile || !!uploadedFileInfo || formData.signe || false}
              disabled={true} className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-not-allowed opacity-70" />
            <span className="text-xs sm:text-sm text-gray-700 flex items-center gap-1">
              {t('conventions.signed')}
            </span>
          </div>
        </div>
        
      </section>
      
      {/* ═══ MOTS-CLÉS ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.keywords')}</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.mots_cles && formData.mots_cles.length > 0 ? (
            formData.mots_cles.map((mc, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm">
                {mc}
                {!readOnly && (
                  <button type="button" onClick={() => onRemoveMotCle(mc)} className="text-blue-600 hover:text-blue-800">×</button>
                )}
              </span>
            ))
          ) : (
            <span className="text-xs sm:text-sm text-gray-400">{t('general.keywordsHint')}</span>
          )}
        </div>
        {!readOnly && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={motCle || ''} onChange={(e) => setMotCle(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t('general.addKeyword')} className="flex-1" />
            <Button variant="secondary" onClick={onAddMotCle} className="text-xs sm:text-sm">{t('common.add')}</Button>
          </div>
        )}
      </section>

      {/* ═══ ARTICLES ═══ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-wrap">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('general.articles')}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {articlesMasquesList.length > 0 && !readOnly && (
              <Button variant="secondary" size="sm" onClick={() => articlesMasquesList.forEach(a => afficherArticle(a.id))} className="text-xs">
                {t('general.showHidden')} ({articlesMasquesList.length})
              </Button>
            )}
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Input value={nouvelArticle} onChange={(e) => setNouvelArticle(e.target.value)}
                  placeholder={t('general.newArticleName')} className="w-40 sm:w-48 text-sm" />
                <Button variant="outline" size="sm" onClick={ajouterArticle} className="text-xs">
                  <Plus size={14} className="mr-1" /> {t('common.add')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {articlesAffiches.map((article, index) => {
            const isCustom = article.custom === true;
            const hasContent = getArticleValue(article.id) && getArticleValue(article.id).trim() !== '';
            const key = article.id || `article_${index}`;
            const label = article.labelKey ? t(article.labelKey) : article.label;
            const placeholder = article.placeholderKey ? t(article.placeholderKey) : article.placeholder;

            return (
              <div key={key} className="relative group">
                <Textarea label={label} name={`article_${article.id || index}`} value={getArticleValue(article.id)}
                  onChange={(e) => setArticleValue(article.id, e.target.value)} readOnly={readOnly}
                  placeholder={placeholder} rows={3} />
                {!readOnly && !isCustom && (
                  <button type="button" onClick={() => masquerArticle(article.id)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-sm mt-1 mr-1 p-1 rounded hover:bg-gray-100" title={t('general.hideArticle')}>
                    <X size={16} />
                  </button>
                )}
                {isCustom && !readOnly && (
                  <button type="button" onClick={() => supprimerArticle(article.id)}
                    className="absolute top-0 right-0 text-red-400 hover:text-red-600 text-sm mt-1 mr-1 p-1 rounded hover:bg-red-50" title={t('general.deleteArticle')}>
                    <X size={16} />
                  </button>
                )}
                {!hasContent && !readOnly && (
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">({t('common.empty')})</span>
                )}
              </div>
            );
          })}
          {articlesAffiches.length === 0 && (
            <div className="text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded-lg text-sm">
              <p>{t('general.noArticles')}</p>
              {!readOnly && articlesMasquesList.length > 0 && <p className="text-xs mt-1">{t('general.clickShowHidden')}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}