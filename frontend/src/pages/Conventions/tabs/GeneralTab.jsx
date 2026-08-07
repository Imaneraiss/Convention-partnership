import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Button from '../../../components/common/Button';
import { 
  TYPES_CONVENTION, 
  MODES_RENOUVELLEMENT,
  TYPES_PARTENAIRE,
  ETABLISSEMENTS_UM5,
  SIGNATAIRES_UM5
} from '../../../utils/constants';
import { X, Plus, Upload, FileText, AlertCircle, Download, RefreshCw } from 'lucide-react';

// Articles prédéfinis
const ARTICLES_DEFAUT = [
  { id: 'objet', label: 'Objet', placeholder: "Description de l'objet de la convention..." },
  { id: 'objectif', label: 'Objectif', placeholder: "Objectifs visés par la convention..." },
  { id: 'engagement_um5', label: 'Engagement UM5', placeholder: "Engagements de l'UM5..." },
  { id: 'engagement_partenaire', label: 'Engagement partenaire', placeholder: "Engagements du partenaire..." },
  { id: 'engagement_commun', label: 'Engagement commun', placeholder: "Engagements communs..." },
  { id: 'principaux_domaines', label: 'Principaux domaines', placeholder: "Domaines de coopération..." },
  { id: 'communication', label: 'Communication', placeholder: "Modalités de communication..." },
  { id: 'reglement_litiges', label: 'Règlement des litiges', placeholder: "Modalités de règlement des litiges..." },
  { id: 'forces_majeurs', label: 'Forces majeurs', placeholder: "Cas de force majeure..." },
  { id: 'modification_resiliation', label: 'Modification & Résiliation', placeholder: "Modalités de modification et résiliation..." },
  { id: 'confidentialite', label: 'Confidentialité', placeholder: "Clauses de confidentialité..." },
  { id: 'protection_donnees', label: 'Protection des données personnelles', placeholder: "Protection des données personnelles..." },
  { id: 'propriete_intellectuelle', label: 'Propriété intellectuelle', placeholder: "Propriété intellectuelle..." },
];

// ✅ Modes conditionnels qui nécessitent une décision
const MODES_CONDITIONNELS = [
  "Concertation des parties",
  "Par avenant",
  "Par décision de l'Assemblée Générale extraordinaire"
];

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
  const [nouvelArticle, setNouvelArticle] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [replacementMode, setReplacementMode] = useState(false);

  const articlesMasques = formData.articles_masques || [];

  // ✅ Drag & Drop pour remplacer le fichier
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (isFromUpload && !window.confirm(
      '⚠️ Remplacer ce document effacera toutes les données modifiées.\n\n' +
      'Les nouvelles données seront extraites automatiquement.\n\n' +
      'Continuer ?'
    )) {
      return;
    }

    setNewFile(file);
    onFileChange?.(file);
    setReplacementMode(true);
    setIsExtracting(true);
    setExtractError(null);

    try {
      if (onExtractDocument) {
        const result = await onExtractDocument(file);
        
        if (result && !result.error) {
          onExtractedData(result);
          onFormChange('articles_masques', []);
          alert('✅ Document remplacé et extrait avec succès !');
        } else {
          setExtractError(result?.message || 'Erreur lors de l\'extraction');
        }
      }
    } catch (error) {
      console.error('Erreur extraction:', error);
      setExtractError(error.message || 'Erreur lors de l\'extraction du document');
    } finally {
      setIsExtracting(false);
      setReplacementMode(false);
    }
  }, [onExtractDocument, onExtractedData, isFromUpload, onFileChange]);
 
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
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddMotCle();
    }
  };

  const ajouterArticle = () => {
    if (nouvelArticle.trim()) {
      const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newArticle = { 
        id, 
        label: nouvelArticle.trim(), 
        placeholder: `Contenu de l'article...`, 
        custom: true 
      };
      
      onFormChange('articles_personnalises', [...(formData.articles_personnalises || []), newArticle]);
      onFormChange('articles', {
        ...(formData.articles || {}),
        [id]: ''
      });
      
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

  const masquerArticle = (id) => {
    onFormChange('articles_masques', [...articlesMasques, id]);
  };

  const afficherArticle = (id) => {
    onFormChange('articles_masques', articlesMasques.filter(a => a !== id));
  };

  const getArticleValue = (articleId) => {
    return formData.articles?.[articleId] || '';
  };

  const setArticleValue = (articleId, value) => {
    onFormChange('articles', {
      ...(formData.articles || {}),
      [articleId]: value
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileInfo = uploadedFileInfo || (uploadedFile ? {
    name: uploadedFile.name,
    size: uploadedFile.size,
    type: uploadedFile.type
  } : null);

  const articlesAffiches = [
    ...ARTICLES_DEFAUT.filter(a => !articlesMasques.includes(a.id)),
    ...(formData.articles_personnalises || []).filter(a => !articlesMasques.includes(a.id))
  ];

  const articlesMasquesList = [
    ...ARTICLES_DEFAUT.filter(a => articlesMasques.includes(a.id)),
    ...(formData.articles_personnalises || []).filter(a => articlesMasques.includes(a.id))
  ];

  // ✅ Vérifier si le mode de renouvellement est conditionnel
  const isModeConditionnel = MODES_CONDITIONNELS.includes(formData.mode_renouvellement);

  return (
    <div className="space-y-8">
      {/* SECTION FICHIER */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} />
            {isFromUpload ? 'Document uploadé' : 'Upload du document'}
          </h3>
          <div className="flex items-center gap-2">
            {fileInfo && !readOnly && (
              <button
                type="button"
                onClick={() => document.getElementById('fileInput')?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw size={14} />
                Remplacer
              </button>
            )}
            {!isFromUpload && !readOnly && (
              <span className="text-xs text-gray-400">
                Formats acceptés : PDF, DOC, DOCX, PNG, JPG
              </span>
            )}
          </div>
        </div>

        {isFromUpload && fileInfo ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{fileInfo.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(fileInfo.size)} • {fileInfo.type || 'Document'}
                    {fileInfo.uploadDate && ` • ${new Date(fileInfo.uploadDate).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                onClick={() => {
                  console.log('Télécharger:', fileInfo);
                }}
              >
                <Download size={16} />
                Télécharger
              </button>
            </div>
          </div>
        ) : null}

        {(!isFromUpload || !readOnly) && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
              ${(readOnly || isExtracting) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} id="fileInput" />
            
            {isExtracting ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 font-medium">
                  {replacementMode ? 'Remplacement et extraction en cours...' : 'Extraction en cours...'}
                </p>
                <p className="text-sm text-gray-400">OCR + Groq analysent le document</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-gray-400" size={32} />
                <div>
                  <p className="text-gray-600 font-medium">
                    {isDragActive ? 'Déposez le document ici' : 
                    isFromUpload ? 'Glissez-déposez pour remplacer le document' : 
                    'Glissez-déposez le document'}
                  </p>
                  <p className="text-sm text-gray-400">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
                <div className="flex justify-center gap-4 text-xs text-gray-400">
                  <span>PDF</span>
                  <span>DOC</span>
                  <span>DOCX</span>
                  <span>PNG</span>
                  <span>JPG</span>
                </div>
                {newFile && !isExtracting && (
                  <p className="text-sm text-green-600">
                    ✅ Nouveau fichier : {newFile.name}
                  </p>
                )}
                {extractError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {extractError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isFromUpload && !readOnly && !isExtracting && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={12} />
            ⚠️ Le remplacement effacera toutes les modifications manuelles
          </p>
        )}
        
        {!isFromUpload && !readOnly && !isExtracting && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={12} />
            L'upload d'un document remplacera toutes les données existantes
          </p>
        )}
      </section>

      {/* ==================== RESTE DU FORMULAIRE ==================== */}
      
      {/* IDENTIFICATION */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Intitulé de la convention"
              name="intitule"
              value={formData.intitule || ''}
              onChange={(e) => onFormChange('intitule', e.target.value)}
              required
              readOnly={readOnly}
              placeholder="Intitulé complet de la convention"
            />
          </div>
          
          <Select
            label="Type de convention"
            name="type"
            value={formData.type || ''}
            onChange={(e) => onFormChange('type', e.target.value)}
            options={TYPES_CONVENTION.map(t => ({ value: t, label: t }))}
            required
            readOnly={readOnly}
          />
          
          <div className="space-y-2">
            <Select
              label="Mode de renouvellement"
              name="mode_renouvellement"
              value={formData.mode_renouvellement || ''}
              onChange={(e) => onFormChange('mode_renouvellement', e.target.value)}
              options={MODES_RENOUVELLEMENT.map(m => ({ value: m, label: m }))}
              readOnly={readOnly}
            />
            
            {/* ✅ Case à cocher "Expirée" - UNIQUEMENT pour les modes conditionnels */}
            {isModeConditionnel && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.expiree_manuellement || false}
                  onChange={(e) => onFormChange('expiree_manuellement', e.target.checked)}
                  disabled={readOnly}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  ❌ Convention expirée
                </span>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* DATES */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dates et Durée</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date de signature"
            name="date_signature"
            type="date"
            value={formData.date_signature || ''}
            onChange={(e) => onFormChange('date_signature', e.target.value)}
            required
            readOnly={readOnly}
          />
          
          <Input
            label="Durée (en années)"
            name="duree_annees"
            type="number"
            min="1"
            max="10"
            value={formData.duree_annees || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : '';
              onFormChange('duree_annees', value);
              
              if (value && formData.date_signature) {
                const dateSig = new Date(formData.date_signature);
                dateSig.setFullYear(dateSig.getFullYear() + value);
                dateSig.setDate(dateSig.getDate() - 1);
                const dateExp = dateSig.toISOString().split('T')[0];
                onFormChange('date_expiration', dateExp);
              } else if (!value) {
                onFormChange('date_expiration', '');
              }
            }}
            readOnly={readOnly}
            placeholder="Ex: 3"
          />
          
          <Input
            label="Date d'expiration"
            name="date_expiration"
            type="date"
            value={formData.date_expiration || ''}
            onChange={(e) => onFormChange('date_expiration', e.target.value)}
            readOnly={true}
            className="bg-gray-50"
            placeholder={formData.duree_annees ? 'Calculée automatiquement' : ''}
          />
        </div>
        
        {formData.date_signature && !formData.duree_annees && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <AlertCircle size={16} />
              Veuillez renseigner la durée (en années) pour calculer automatiquement la date d'expiration.
            </p>
          </div>
        )}
        
        {formData.duree_annees && formData.date_signature && formData.date_expiration && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              ✅ Date d'expiration calculée : <strong>{new Date(formData.date_expiration).toLocaleDateString('fr-FR')}</strong>
            </p>
          </div>
        )}
      </section>

      {/* SIGNATAIRE UM5 */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Signataire UM5</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Signataire UM5"
            name="signataire_um5"
            value={formData.signataire_um5 || ''}
            onChange={(e) => onFormChange('signataire_um5', e.target.value)}
            options={SIGNATAIRES_UM5}
            required
            readOnly={readOnly}
            placeholder="Sélectionner le signataire UM5"
          />
          
          <Input
            label="Autre signataire UM5 (si non listé)"
            name="signataire_um5_autre"
            value={formData.signataire_um5_autre || ''}
            onChange={(e) => onFormChange('signataire_um5_autre', e.target.value)}
            readOnly={readOnly}
            placeholder="Précisez le signataire UM5..."
          />
        </div>
      </section>

      {/* SIGNATAIRES PARTENAIRES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Signataires Partenaires</h3>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={onAddPartenaire}>
              + Ajouter un partenaire
            </Button>
          )}
        </div>

        {partenaires && partenaires.length > 0 ? (
          partenaires.map((p, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Partenaire {index + 1}</span>
                {!readOnly && partenaires.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemovePartenaire(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nom du partenaire"
                  value={p.nom || ''}
                  onChange={(e) => onPartenaireChange(index, 'nom', e.target.value)}
                  required
                  readOnly={readOnly}
                  placeholder="Nom du partenaire"
                />
                
                <Select
                  label="Type"
                  value={p.type || ''}
                  onChange={(e) => onPartenaireChange(index, 'type', e.target.value)}
                  options={TYPES_PARTENAIRE.map(t => ({ value: t, label: t }))}
                  required
                  readOnly={readOnly}
                  placeholder="Sélectionner un type"
                />
                
                <Input
                  label="Ville"
                  value={p.ville || ''}
                  onChange={(e) => onPartenaireChange(index, 'ville', e.target.value)}
                  readOnly={readOnly}
                  placeholder="Ville"
                />
                
                <Input
                  label="Région"
                  value={p.region || ''}
                  onChange={(e) => onPartenaireChange(index, 'region', e.target.value)}
                  readOnly={readOnly}
                  placeholder="Région"
                />
                
                <Input
                  label="Pays"
                  value={p.pays || 'Maroc'}
                  onChange={(e) => onPartenaireChange(index, 'pays', e.target.value)}
                  readOnly={readOnly}
                  placeholder="Pays"
                />
                
                <Input
                  label="Signataire du partenaire"
                  value={p.signataire || ''}
                  onChange={(e) => onPartenaireChange(index, 'signataire', e.target.value)}
                  readOnly={readOnly}
                  placeholder="Nom du signataire pour ce partenaire"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4 border border-dashed border-gray-300 rounded-lg">
            <p>Aucun partenaire ajouté</p>
            {!readOnly && (
              <p className="text-sm mt-1">Cliquez sur "Ajouter un partenaire" pour commencer</p>
            )}
          </div>
        )}
      </section>

      {/* OPTIONS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Options</h3>
        
        <div className="flex flex-wrap gap-6">
          {[
            { field: 'avec_budget', label: 'Avec budget' },
            { field: 'validation_conseil', label: 'Validation conseil' },
            { field: 'formation_continue', label: 'Formation continue' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[field] || false}
                onChange={(e) => onFormChange(field, e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}

          {/* ✅ Champ Signé */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!uploadedFile || !!uploadedFileInfo || formData.signe || false}
              disabled={true}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-not-allowed opacity-70"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <FileText size={14} className={uploadedFile || uploadedFileInfo ? 'text-green-600' : 'text-gray-400'} />
              Signé {uploadedFile || uploadedFileInfo ? '✅' : '❌'}
            </span>
          </div>
        </div>

        {(uploadedFile || uploadedFileInfo) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <FileText size={16} />
              ✅ Document uploadé : <strong>{uploadedFile?.name || uploadedFileInfo?.name}</strong>
            </p>
          </div>
        )}

        
      </section>
      
      {/* MOTS-CLÉS */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Mots-clés</h3>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.mots_cles && formData.mots_cles.length > 0 ? (
            formData.mots_cles.map((mc, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {mc}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveMotCle(mc)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">
              Mots-clés associés à la convention pour faciliter la recherche
            </span>
          )}
        </div>
        
        {!readOnly && (
          <div className="flex gap-2">
            <Input
              value={motCle || ''}
              onChange={(e) => setMotCle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un mot-clé..."
              className="flex-1"
            />
            <Button variant="secondary" onClick={onAddMotCle}>
              Ajouter
            </Button>
          </div>
        )}
      </section>

      {/* ==================== ARTICLES ==================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Articles</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {articlesMasquesList.length > 0 && !readOnly && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  articlesMasquesList.forEach(a => afficherArticle(a.id));
                }}
              >
                Afficher les articles masqués ({articlesMasquesList.length})
              </Button>
            )}
            
            {!readOnly && (
              <div className="flex items-center gap-2">
                <Input
                  value={nouvelArticle}
                  onChange={(e) => setNouvelArticle(e.target.value)}
                  placeholder="Nom du nouvel article..."
                  className="w-48"
                />
                <Button variant="outline" size="sm" onClick={ajouterArticle}>
                  <Plus size={14} className="mr-1" />
                  Ajouter
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
            
            return (
              <div key={key} className="relative group">
                <Textarea
                  label={article.label}
                  name={`article_${article.id || index}`}
                  value={getArticleValue(article.id)}
                  onChange={(e) => setArticleValue(article.id, e.target.value)}
                  readOnly={readOnly}
                  placeholder={article.placeholder}
                  rows={3}
                />
                
                {!readOnly && !isCustom && (
                  <button
                    type="button"
                    onClick={() => masquerArticle(article.id)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-sm mt-1 mr-1 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Masquer cet article"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {isCustom && !readOnly && (
                  <button
                    type="button"
                    onClick={() => supprimerArticle(article.id)}
                    className="absolute top-0 right-0 text-red-400 hover:text-red-600 text-sm mt-1 mr-1 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Supprimer cet article personnalisé"
                  >
                    <X size={16} />
                  </button>
                )}
                
                {!hasContent && !readOnly && (
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    (vide)
                  </span>
                )}
              </div>
            );
          })}
          
          {articlesAffiches.length === 0 && (
            <div className="text-center text-gray-500 py-8 border border-dashed border-gray-300 rounded-lg">
              <p>Aucun article affiché</p>
              {!readOnly && articlesMasquesList.length > 0 && (
                <p className="text-sm mt-1">
                  Cliquez sur "Afficher les articles masqués" pour les restaurer
                </p>
              )}
              {!readOnly && articlesMasquesList.length === 0 && (
                <p className="text-sm mt-1">
                  Ajoutez un article personnalisé ou affichez les articles masqués
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}