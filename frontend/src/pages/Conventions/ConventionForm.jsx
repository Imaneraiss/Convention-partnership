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
import { extractConvention } from '../../services/fichierService';
import { exportConventionToWord } from '../../services/wordExportService';
import { FileDown } from 'lucide-react';

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
  const [isFromUpload, setIsFromUpload] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);

  const canEdit = user?.role === ROLES.CHARGE;
  const isExisting = !!id;
  
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
    articles_masques: [],
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

  // ✅ Récupération des données extraites par OCR + Groq
  useEffect(() => {
    if (location.state?.extractedData) {
      const extracted = location.state.extractedData;
      console.log('📥 Données extraites reçues:', extracted);
      
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
          articles_personnalises: extracted.articles_personnalises || [],
          statut: extracted.statut || 'EN_COURS'
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
        }

        if (extracted.comites && extracted.comites.length > 0) {
          setCommittees(extracted.comites.map(c => ({
            ...c,
            id: Date.now() + Math.random(),
            expanded: false,
            reunions: c.reunions || []
          })));
        }

        if (extracted.budget) {
          setBudgetData(extracted.budget);
        }

        if (extracted.alertes) {
          setAlertsData({
            auto: extracted.alertes.auto || [],
            manual: extracted.alertes.manual || []
          });
        }

        setIsFromUpload(true);
        console.log('✅ Données mises à jour avec succès !');
      } else {
        console.error('❌ Erreur extraction:', extracted.error);
        setError('Erreur lors de l\'extraction du document');
      }
    }
    if (location.state?.uploadedFile) {
      setFile(location.state.uploadedFile);
      setUploadedFileInfo({
        name: location.state.uploadedFile.name,
        size: location.state.uploadedFile.size,
        type: location.state.uploadedFile.type,
        uploadDate: new Date().toISOString()
      });
    }
  }, [location.state]);

  // ✅ Fonction pour extraire un document (Drag & Drop dans GeneralTab)
  const handleExtractDocument = async (file) => {
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    
    try {
      const response = await extractConvention(formDataFile);
      return response.data;
    } catch (error) {
      console.error('Erreur extraction:', error);
      throw error;
    }
  };

  // ✅ Fonction pour mettre à jour toutes les données après extraction
  const handleExtractedData = (data) => {
    setFormData(prev => ({
      ...prev,
      intitule: data.intitule || '',
      type: data.type || '',
      date_signature: data.date_signature || '',
      date_expiration: data.date_expiration || '',
      mode_renouvellement: data.mode_renouvellement || '',
      avec_budget: data.avec_budget || false,
      validation_conseil: data.validation_conseil || false,
      formation_continue: data.formation_continue || false,
      mots_cles: data.mots_cles || [],
      signataire_um5: data.signataire_um5 || '',
      signataire_um5_autre: data.signataire_um5_autre || '',
      signataire_partenaire: data.signataire_partenaire || '',
      signataire_partenaire_autre: data.signataire_partenaire_autre || '',
      articles: data.articles || {},
      articles_personnalises: data.articles_personnalises || [],
      articles_masques: [],
      statut: data.statut || 'EN_COURS'
    }));

    if (data.partenaires && data.partenaires.length > 0) {
      setPartenaires(data.partenaires.map(p => ({
        nom: p.nom || '',
        type: p.type || '',
        ville: p.ville || '',
        region: p.region || '',
        pays: p.pays || 'Maroc',
        signataire: p.signataire || ''
      })));
    }

    if (data.comites && data.comites.length > 0) {
      setCommittees(data.comites.map(c => ({
        ...c,
        id: Date.now() + Math.random(),
        expanded: false,
        reunions: c.reunions || []
      })));
    }

    if (data.budget) {
      setBudgetData(data.budget);
    }

    if (data.alertes) {
      setAlertsData({
        auto: data.alertes.auto || [],
        manual: data.alertes.manual || []
      });
    }

    setIsFromUpload(true);
    
    // Mettre à jour les infos du fichier
    if (file) {
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      });
    }
  };

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
      
      if (!canEdit) {
        setIsEditing(false);
      } else {
        setIsEditing(false);
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
      fetchConventionData();
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

  // Exportation vers Word
  const handleExportWord = async () => {
    try {
      const result = await exportConventionToWord(
        formData,
        partenaires,
        committees,
        budgetData,
        alertsData,
        uploadedFileInfo,
        `Convention_${formData.intitule || 'sans_titre'}_${new Date().toISOString().split('T')[0]}.docx`
      );
      
      if (result.success) {
        console.log('✅ Exportation Word réussie !');
      } else {
        setError('Erreur lors de l\'exportation: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Erreur export:', err);
      setError('Erreur lors de l\'exportation du document');
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
        // ✅ Mise à jour
        const response = await updateConvention(id, dataToSend);
        conventionId = id;
        
        // Mise à jour des partenaires
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

        // ✅ Upload du fichier (si présent) - AJOUTÉ POUR MISE À JOUR
        console.log('🔍 Vérification avant upload:');
        console.log('📄 file:', file);
        console.log('🆔 conventionId:', conventionId);
        console.log('📋 type de conventionId:', typeof conventionId);
        console.log('🔑 id du paramètre:', id);


        if (file) {
          console.log('📤 Upload du fichier (mise à jour) avec convention_id:', conventionId);
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          formDataFile.append('convention_id', conventionId);
          await uploadFichier(formDataFile);
        }

      } else {
        // ✅ Création
        const convResponse = await createConvention(dataToSend);
        conventionId = convResponse.data?.id || convResponse.id;  // ✅ Support des deux formats

        if (!conventionId) {
          console.error('❌ Impossible de récupérer l\'ID de la convention');
          setError('Erreur lors de la création de la convention');
          setSaving(false);
          return;
        }

        console.log('✅ Convention créée avec ID:', conventionId);

        // Création des partenaires
        for (const partenaire of partenaires) {
          if (partenaire.nom) {
            await createPartenaire({
              ...partenaire,
              convention_id: conventionId
            });
          }
        }

        // Upload du fichier (si présent)
        if (file) {
          console.log('📤 Upload du fichier (création) avec convention_id:', conventionId);
          const formDataFile = new FormData();
          formDataFile.append('file', file);
          formDataFile.append('convention_id', conventionId);
          await uploadFichier(formDataFile);
        }
      }

      setIsEditing(false);
      
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
          {id && !isEditing && (
            <>
              {/* Bouton Exporter Word */}
              <Button 
                onClick={handleExportWord} 
                variant="success"
                className="flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Exporter Word
              </Button>
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
                readOnly={!isEditing}
                onExtractDocument={handleExtractDocument}
                onExtractedData={handleExtractedData}
                conventionId={id}
                isFromUpload={isFromUpload}
                uploadedFile={file}
                uploadedFileInfo={uploadedFileInfo}
              />
            )}
            {activeTab === 'committees' && (
              <CommitteesTab 
                readOnly={!isEditing}
                initialCommittees={committees}
                onChange={setCommittees}
                conventionId={id}
              />
            )}
            
            {activeTab === 'budget' && (
              <BudgetTab 
                readOnly={!isEditing}
                initialBudget={budgetData}
                onChange={setBudgetData}
              />
            )}
            
            {activeTab === 'alerts' && (
              <AlertsTab 
                readOnly={!isEditing}
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