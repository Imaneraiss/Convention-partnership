import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { createConvention, updateConvention, getConvention, deleteConvention } from '../../services/conventionService';
import { uploadFichier } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import GeneralTab from './tabs/GeneralTab';
import CommitteesTab from './tabs/CommitteesTab';
import BudgetTab from './tabs/BudgetTab';
import AlertsTab from './tabs/AlertsTab';
import { createPartenaire, updatePartenaire } from '../../services/partenaireService';

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
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [alertsData, setAlertsData] = useState({ auto: [], manual: [] });

  const canEdit = user?.role === ROLES.CHARGE;
  const isExisting = !!id;
  
  // ✅ Mode édition : false = lecture seule, true = édition
  const [isEditing, setIsEditing] = useState(!isExisting ? true : (isExisting && !canEdit ? false : false));  
  const [formData, setFormData] = useState({
    intitule: '',
    type: '',
    numero_reference: '',
    date_signature: '',
    date_expiration: '',
    mode_renouvellement: '',
    signataire_um5: '',
    signataire_um5_autre: '',
    signataire_partenaire: '',
    signataire_partenaire_autre: '',
    avec_budget: false,
    validation_conseil: false,
    formation_continue: false,
    mots_cles: [],
    articles: {},
    articles_personnalises: [],
    statut: 'EN_COURS'
  });

  const [partenaires, setPartenaires] = useState([
    { nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }
  ]);
  const [file, setFile] = useState(null);
  const [motCle, setMotCle] = useState('');

  useEffect(() => {
    if (id) {
      fetchConventionData();
    }
  }, [id]);

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
          avec_budget: extracted.avec_budget || false,
          validation_conseil: extracted.validation_conseil || false,
          formation_continue: extracted.formation_continue || false,
          mots_cles: extracted.mots_cles || [],
          signataire_um5: extracted.signataire_um5 || '',
          signataire_um5_autre: extracted.signataire_um5_autre || '',
          signataire_partenaire: extracted.signataire_partenaire || '',
          signataire_partenaire_autre: extracted.signataire_partenaire_autre || '',
          articles: extracted.articles || {},
          articles_personnalises: extracted.articles_personnalises || []
        }));

        if (extracted.partenaires && extracted.partenaires.length > 0) {
          setPartenaires(extracted.partenaires.map(p => ({
            nom: p.nom || '',
            type: p.type || '',
            ville: p.ville || '',
            region: p.region || '',
            pays: p.pays || 'Maroc',
            signataire: p.signataire || ''
          })));
        } else if (extracted.partenaire_nom) {
          setPartenaires([{
            nom: extracted.partenaire_nom || '',
            type: extracted.partenaire_type || '',
            ville: extracted.partenaire_ville || '',
            region: extracted.partenaire_region || '',
            pays: extracted.partenaire_pays || 'Maroc',
            signataire: extracted.partenaire_signataire || ''
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
        numero_reference: data.numero_reference || '',
        date_signature: data.date_signature || '',
        date_expiration: data.date_expiration || '',
        mode_renouvellement: data.mode_renouvellement || '',
        signataire_um5: data.signataire_um5 || '',
        signataire_um5_autre: data.signataire_um5_autre || '',
        signataire_partenaire: data.signataire_partenaire || '',
        signataire_partenaire_autre: data.signataire_partenaire_autre || '',
        avec_budget: data.avec_budget || false,
        validation_conseil: data.validation_conseil || false,
        formation_continue: data.formation_continue || false,
        mots_cles: data.mots_cles || [],
        articles: data.articles || {},
        articles_personnalises: data.articles_personnalises || [],
        statut: data.statut || 'EN_COURS'
      });
      setPartenaires(data.partenaires || [{ nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }]);
      
      // ✅ Si l'utilisateur n'est pas CHARGE, rester en lecture seule
      if (!canEdit) {
        setIsEditing(false);
      } else {
        setIsEditing(false); // Toujours en lecture seule au chargement
      }
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
    setPartenaires([...partenaires, { nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }]);
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

  const handleEdit = () => {
    if (canEdit) {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    if (id) {
      setIsEditing(false);
      fetchConventionData(); // Recharger les données originales
    } else {
      navigate('/conventions');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette convention ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await deleteConvention(id);
      navigate('/conventions');
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      setError('Erreur lors de la suppression de la convention');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const requiredFields = [
      { field: 'intitule', label: 'Intitulé de la convention' },
      { field: 'type', label: 'Type de convention' },
      { field: 'date_signature', label: 'Date de signature' },
      { field: 'signataire_um5', label: 'Signataire UM5' }
    ];

    const missingFields = requiredFields.filter(f => !formData[f.field]);
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => f.label).join(', ');
      setError(`Veuillez remplir les champs obligatoires : ${fieldNames}`);
      setSaving(false);
      return;
    }

    const dataToSend = {
      intitule: formData.intitule,
      type: formData.type,
      date_signature: formData.date_signature,
      date_expiration: formData.date_expiration || null,
      mode_renouvellement: formData.mode_renouvellement || null,
      signataire_um5: formData.signataire_um5,
      signataire_um5_autre: formData.signataire_um5_autre || null,
      signataire_partenaire: formData.signataire_partenaire || null,
      signataire_partenaire_autre: formData.signataire_partenaire_autre || null,
      avec_budget: formData.avec_budget || false,
      validation_conseil: formData.validation_conseil || false,
      formation_continue: formData.formation_continue || false,
      mots_cles: formData.mots_cles || [],
      articles: formData.articles || {},
      articles_personnalises: formData.articles_personnalises || [],
      statut: formData.statut || 'EN_COURS'
    };

    try {
      let conventionId;

      if (id) {
        const response = await updateConvention(id, dataToSend);
        conventionId = id;
        
        // ✅ Mise à jour des partenaires
        for (const partenaire of partenaires) {
          if (partenaire.nom) {
            if (partenaire.id) {
              await updatePartenaire(partenaire.id, {
                nom: partenaire.nom,
                type: partenaire.type,
                ville: partenaire.ville || '',
                region: partenaire.region || '',
                pays: partenaire.pays || 'Maroc',
                signataire: partenaire.signataire || '',
                convention_id: conventionId  
              });
            } else {
              await createPartenaire({
                ...partenaire,
                convention_id: conventionId
              });
            }
          }
        }
      } else {
        const convResponse = await createConvention(dataToSend);
        conventionId = convResponse.data.id;

        for (const partenaire of partenaires) {
          if (partenaire.nom) {
            await createPartenaire({
              ...partenaire,
              convention_id: conventionId
            });
          }
        }

        if (file) {
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          formDataFile.append('convention_id', conventionId);
          await uploadFichier(formDataFile);
        }
      }

      // ✅ Après enregistrement, repasser en lecture seule
      setIsEditing(false);
      
      // ✅ Recharger les données pour être sûr
      if (id) {
        await fetchConventionData();
      }
      
      navigate(`/conventions/${conventionId}`, { replace: true });
      
    } catch (err) {
      console.error('❌ Erreur:', err);
      console.error('📋 Réponse:', err.response?.data);
      setError(err.response?.data?.detail || "Erreur lors de l'enregistrement de la convention");
    } finally {
      setSaving(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? `Convention ${formData.intitule || ''}` : 'Nouvelle convention'}
          </h1>
          {id && <p className="text-sm text-gray-500">Réf: {formData.numero_reference}</p>}

        </div>
        <div className="flex gap-2">
          {/* ✅ Mode lecture seule */}
          {id && !isEditing && (
            <>
              {canEdit && (
                <Button onClick={handleEdit}>Modifier</Button>
              )}
              {canEdit && (
                <Button variant="danger" onClick={handleDelete}>
                  Supprimer
                </Button>
              )}
            </>
          )}
          
          {/* ✅ Mode édition */}
          {(!id || isEditing) && (
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
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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
                readOnly={!isEditing}  // ✅ Lecture seule si pas en édition
              />
            )}
            {activeTab === 'committees' && (
              <CommitteesTab 
                readOnly={!isEditing}  // ✅ Lecture seule si pas en édition
                initialCommittees={committees}
                onChange={setCommittees}
                conventionId={id}
              />
            )}
            
            {activeTab === 'budget' && (
              <BudgetTab 
                readOnly={!isEditing}  // ✅ Lecture seule si pas en édition
                initialBudget={budgetData}
                onChange={setBudgetData}
              />
            )}
            
            {activeTab === 'alerts' && (
              <AlertsTab 
                readOnly={!isEditing}  // ✅ Lecture seule si pas en édition
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