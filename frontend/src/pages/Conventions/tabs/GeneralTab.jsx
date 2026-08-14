import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Button from '../../../components/common/Button';
import { 
  TYPES_CONVENTION, 
  MODES_RENOUVELLEMENT,
  TYPES_PARTENAIRE,
  ETABLISSEMENTS_UM5 
} from '../../../utils/constants';

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
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddMotCle();
    }
  };

  return (
    <div className="space-y-8">
      {/* Identification */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Identification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Intitulé de la convention"
              name="intitule"
              value={formData.intitule}
              onChange={(e) => onFormChange('intitule', e.target.value)}
              required
              readOnly={readOnly}
              placeholder="Intitulé complet de la convention"
            />
          </div>
          
          <Select
            label="Type de convention"
            name="type"
            value={formData.type}
            onChange={(e) => onFormChange('type', e.target.value)}
            options={TYPES_CONVENTION.map(t => ({ value: t, label: t }))}
            required
            readOnly={readOnly}
          />
          
          <Select
            label="Mode de renouvellement"
            name="mode_renouvellement"
            value={formData.mode_renouvellement}
            onChange={(e) => onFormChange('mode_renouvellement', e.target.value)}
            options={MODES_RENOUVELLEMENT.map(m => ({ value: m, label: m }))}
            readOnly={readOnly}
          />
        </div>
      </section>

      {/* Dates */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de signature"
            name="date_signature"
            type="date"
            value={formData.date_signature}
            onChange={(e) => onFormChange('date_signature', e.target.value)}
            required
            readOnly={readOnly}
          />
          
          <Input
            label="Date d'expiration"
            name="date_expiration"
            type="date"
            value={formData.date_expiration}
            onChange={(e) => onFormChange('date_expiration', e.target.value)}
            readOnly={readOnly}
          />
        </div>
      </section>

      {/* Signataire */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Signataire</h3>
        
        <Select
          label="Signataire"
          name="signataire"
          value={formData.signataire}
          onChange={(e) => onFormChange('signataire', e.target.value)}
          options={ETABLISSEMENTS_UM5.map(e => ({ value: e, label: e }))}
          readOnly={readOnly}
          placeholder="Sélectionner un signataire"
        />
      </section>

      {/* Options */}
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
                checked={formData[field]}
                onChange={(e) => onFormChange(field, e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Partenaires */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Partenaires</h3>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={onAddPartenaire}>
              + Ajouter un partenaire
            </Button>
          )}
        </div>

        {partenaires.map((p, index) => (
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
                label="Nom"
                value={p.nom}
                onChange={(e) => onPartenaireChange(index, 'nom', e.target.value)}
                required
                readOnly={readOnly}
                placeholder="Nom du partenaire"
              />
              
              <Select
                label="Type"
                value={p.type}
                onChange={(e) => onPartenaireChange(index, 'type', e.target.value)}
                options={TYPES_PARTENAIRE.map(t => ({ value: t, label: t }))}
                required
                readOnly={readOnly}
                placeholder="Sélectionner un type"
              />
              
              <Input
                label="Ville"
                value={p.ville}
                onChange={(e) => onPartenaireChange(index, 'ville', e.target.value)}
                readOnly={readOnly}
                placeholder="Ville"
              />
              
              <Input
                label="Région"
                value={p.region}
                onChange={(e) => onPartenaireChange(index, 'region', e.target.value)}
                readOnly={readOnly}
                placeholder="Région"
              />
              
              <Input
                label="Pays"
                value={p.pays}
                onChange={(e) => onPartenaireChange(index, 'pays', e.target.value)}
                readOnly={readOnly}
                placeholder="Pays"
              />
            </div>
          </div>
        ))}
      </section>

      {/* Objet & Engagements */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Objet & Engagements</h3>
        
        <Textarea
          label="Objet de la convention"
          name="objet"
          value={formData.objet}
          onChange={(e) => onFormChange('objet', e.target.value)}
          readOnly={readOnly}
          placeholder="Description de l'objet de la convention..."
          rows={4}
        />
        
        {/* Mots-clés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mots-clés
          </label>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.mots_cles.map(mc => (
              <span
                key={mc}
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
            ))}
          </div>
          
          {!readOnly && (
            <div className="flex gap-2">
              <Input
                value={motCle}
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
        </div>
        
        <Textarea
          label="Engagement de l'université"
          name="engagement_universite"
          value={formData.engagement_universite}
          onChange={(e) => onFormChange('engagement_universite', e.target.value)}
          readOnly={readOnly}
          placeholder="Engagements de l'UM5..."
          rows={3}
        />
        
        <Textarea
          label="Engagement du partenaire"
          name="engagement_partenaire"
          value={formData.engagement_partenaire}
          onChange={(e) => onFormChange('engagement_partenaire', e.target.value)}
          readOnly={readOnly}
          placeholder="Engagements du partenaire..."
          rows={3}
        />
      </section>
    </div>
  );
}
