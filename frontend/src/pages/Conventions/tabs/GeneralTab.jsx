import { useState } from 'react';
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
  readOnly
}) {
  const [nouvelArticle, setNouvelArticle] = useState('');
  const [articlesPersonnalises, setArticlesPersonnalises] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddMotCle();
    }
  };

  // Ajouter un article personnalisé
  const ajouterArticle = () => {
    if (nouvelArticle.trim()) {
      const id = `custom_${Date.now()}`;
      setArticlesPersonnalises([
        ...articlesPersonnalises,
        { id, label: nouvelArticle.trim(), placeholder: `Contenu de l'article...`, custom: true }
      ]);
      setNouvelArticle('');
    }
  };

  // Supprimer un article personnalisé
  const supprimerArticle = (id) => {
    setArticlesPersonnalises(articlesPersonnalises.filter(a => a.id !== id));
  };

  // Récupérer la valeur d'un article depuis formData
  const getArticleValue = (articleId) => {
    return formData.articles?.[articleId] || '';
  };

  // Mettre à jour la valeur d'un article
  const setArticleValue = (articleId, value) => {
    onFormChange('articles', {
      ...(formData.articles || {}),
      [articleId]: value
    });
  };

  // Tous les articles (prédéfinis + personnalisés)
  const tousLesArticles = [...ARTICLES_DEFAUT, ...articlesPersonnalises];

  return (
    <div className="space-y-8">
      {/* ==================== IDENTIFICATION ==================== */}
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
          
          <Select
            label="Mode de renouvellement"
            name="mode_renouvellement"
            value={formData.mode_renouvellement || ''}
            onChange={(e) => onFormChange('mode_renouvellement', e.target.value)}
            options={MODES_RENOUVELLEMENT.map(m => ({ value: m, label: m }))}
            readOnly={readOnly}
          />
        </div>
      </section>

      {/* ==================== DATES ==================== */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            label="Date d'expiration"
            name="date_expiration"
            type="date"
            value={formData.date_expiration || ''}
            onChange={(e) => onFormChange('date_expiration', e.target.value)}
            readOnly={readOnly}
          />
        </div>
      </section>

      {/* ==================== SIGNATAIRE UM5 ==================== */}
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


      {/* ==================== SIGNATAIRES PARTENAIRES ==================== */}
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
                
                {/* Signataire spécifique à ce partenaire */}
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
      {/* ==================== OPTIONS ==================== */}
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
        </div>
      </section>

      {/* ==================== MOTS-CLÉS ==================== */}
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
            <span className="text-sm text-gray-400">          Mots-clés associés à la convention pour faciliter la recherche
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Articles</h3>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Input
                value={nouvelArticle}
                onChange={(e) => setNouvelArticle(e.target.value)}
                placeholder="Nom du nouvel article..."
                className="w-48"
              />
              <Button variant="outline" size="sm" onClick={ajouterArticle}>
                + Ajouter article
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {tousLesArticles.map((article) => (
            <div key={article.id} className="relative">
              <Textarea
                label={article.label}
                name={`article_${article.id}`}
                value={getArticleValue(article.id)}
                onChange={(e) => setArticleValue(article.id, e.target.value)}
                readOnly={readOnly}
                placeholder={article.placeholder}
                rows={3}
              />
              {article.custom && !readOnly && (
                <button
                  type="button"
                  onClick={() => supprimerArticle(article.id)}
                  className="absolute top-0 right-0 text-red-600 hover:text-red-700 text-sm mt-1"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}