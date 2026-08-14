import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createConvention, updateConvention, getConvention } from '../../services/conventionService';
import { createPartenaire } from '../../services/partenaireService';
import { uploadFichier } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import GeneralTab from './tabs/GeneralTab';
import CommitteesTab from './tabs/CommitteesTab';
import BudgetTab from './tabs/BudgetTab';
import AlertsTab from './tabs/AlertsTab';

const TABS = [
  { id: 'general', label: 'Infos générales' },
  { id: 'committees', label: 'Comités' },
  { id: 'budget', label: 'Budget' },
  { id: 'alerts', label: 'Alertes' }
];

export default function ConventionForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [readOnly, setReadOnly] = useState(!!id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [alertsData, setAlertsData] = useState({ auto: [], manual: [] });
  // Données du formulaire
  const [formData, setFormData] = useState({
    intitule: '',
    type: '',
    date_signature: '',
    date_expiration: '',
    mode_renouvellement: '',
    avec_budget: false,
    validation_conseil: false,
    formation_continue: false,
    objet: '',
    engagement_universite: '',
    engagement_partenaire: '',
    mots_cles: [],
    signataire: '',
    statut: 'EN_COURS'
  });

  const [partenaires, setPartenaires] = useState([
    { nom: '', type: '', ville: '', region: '', pays: 'Maroc' }
  ]);

  const [file, setFile] = useState(null);
  const [motCle, setMotCle] = useState('');

  // Récupération des données si modification
  useEffect(() => {
    if (id) {
      fetchConventionData();
    }
  }, [id]);

  // Récupération des données depuis l'upload (OCR + Groq)
  useEffect(() => {
    if (location.state?.extractedData) {
      const extracted = location.state.extractedData;
      if (!extracted.error) {
        setFormData(prev => ({
          ...prev,
          intitule: extracted.intitule || '',
          type: extracted.type || '',
          date_signature: extracted.date_signature || '',
          date_expiration: extracted.date_expiration || '',
          mode_renouvellement: extracted.mode_renouvellement || '',
          objet: extracted.objet || '',
          engagement_universite: extracted.engagement_universite || '',
          engagement_partenaire: extracted.engagement_partenaire || '',
          avec_budget: extracted.avec_budget || false,
          mots_cles: extracted.mots_cles || [],
        }));

        if (extracted.partenaire_nom) {
          setPartenaires([{
            nom: extracted.partenaire_nom || '',
            type: extracted.partenaire_type || '',
            ville: extracted.partenaire_ville || '',
            region: '',
            pays: extracted.partenaire_pays || 'Maroc',
          }]);
        }
      }
    }
    if (location.state?.uploadedFile) {
      setFile(location.state.uploadedFile);
    }
  }, [location.state]);

  const fetchConventionData = async () => {
    setLoading(true);
    try {
      const response = await getConvention(id);
      const data = response.data;
      setFormData({
        intitule: data.intitule || '',
        type: data.type || '',
        date_signature: data.date_signature || '',
        date_expiration: data.date_expiration || '',
        mode_renouvellement: data.mode_renouvellement || '',
        avec_budget: data.avec_budget || false,
        validation_conseil: data.validation_conseil || false,
        formation_continue: data.formation_continue || false,
        objet: data.objet || '',
        engagement_universite: data.engagement_universite || '',
        engagement_partenaire: data.engagement_partenaire || '',
        mots_cles: data.mots_cles || [],
        signataire: data.signataire || '',
        statut: data.statut || 'EN_COURS'
      });
      setPartenaires(data.partenaires || [{ nom: '', type: '', ville: '', region: '', pays: 'Maroc' }]);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement de la convention');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartenaireChange = (index, field, value) => {
    const updated = [...partenaires];
    updated[index][field] = value;
    setPartenaires(updated);
  };

  const addPartenaire = () => {
    setPartenaires([...partenaires, { nom: '', type: '', ville: '', region: '', pays: 'Maroc' }]);
  };

  const removePartenaire = (index) => {
    setPartenaires(partenaires.filter((_, i) => i !== index));
  };

  const addMotCle = () => {
    if (motCle.trim() && !formData.mots_cles.includes(motCle.trim())) {
      setFormData(prev => ({
        ...prev,
        mots_cles: [...prev.mots_cles, motCle.trim()]
      }));
      setMotCle('');
    }
  };

  const removeMotCle = (mc) => {
    setFormData(prev => ({
      ...prev,
      mots_cles: prev.mots_cles.filter(m => m !== mc)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let conventionId;

      if (id) {
        // Mise à jour
        await updateConvention(id, formData);
        conventionId = id;
      } else {
        // Création
        const convResponse = await createConvention(formData);
        conventionId = convResponse.data.id;

        // Création des partenaires
        for (const partenaire of partenaires) {
          if (partenaire.nom) {
            await createPartenaire({
              ...partenaire,
              convention_id: conventionId
            });
          }
        }

        // Upload du fichier
        if (file) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          formDataFile.append('convention_id', conventionId);
          await uploadFichier(formDataFile);
        }
      }

      navigate(`/conventions/${conventionId}`);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement de la convention");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setReadOnly(false);
  };

  const handleCancel = () => {
    if (id) {
      setReadOnly(true);
      fetchConventionData();
    } else {
      navigate('/conventions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec boutons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? `Convention ${formData.intitule || ''}` : 'Nouvelle convention'}
          </h1>
          {id && <p className="text-sm text-gray-500">Réf: {formData.numero_reference}</p>}
        </div>
        <div className="flex gap-2">
          {id && readOnly && (
            <Button onClick={handleEdit}>Modifier</Button>
          )}
          {(!id || !readOnly) && (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200  rounded ">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto px-6 pt-4 space-x-8">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <GeneralTab
                formData={formData}
                partenaires={partenaires}
                motCle={motCle}
                setMotCle={setMotCle}
                onFormChange={handleFormChange}
                onPartenaireChange={handlePartenaireChange}
                onAddPartenaire={addPartenaire}
                onRemovePartenaire={removePartenaire}
                onAddMotCle={addMotCle}
                onRemoveMotCle={removeMotCle}
                readOnly={readOnly}
              />
            )}
            {activeTab === 'committees' && (
                <CommitteesTab 
                readOnly={readOnly} 
                initialCommittees={committees}
                onChange={setCommittees}
                />
            )}
            
            {activeTab === 'budget' && (
                <BudgetTab 
                readOnly={readOnly} 
                initialBudget={budgetData}
                onChange={setBudgetData}
                />
            )}
            
            {activeTab === 'alerts' && (
                <AlertsTab 
                readOnly={readOnly}
                conventionData={{
                    date_expiration: formData.date_expiration,
                    comites: committees,
                    budget: budgetData
                }}
                onChange={setAlertsData}
                />
            )}

          </form>
        </div>
      </Card>
    </div>
  );
}