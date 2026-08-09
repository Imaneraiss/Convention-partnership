import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { createConvention, updateConvention, getConvention, deleteConvention } from '../../services/conventionService';
import { uploadFichier, extractConvention, getFichiersByConvention as getFichiersConvention } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import GeneralTab from './tabs/GeneralTab';
import CommitteesTab from './tabs/CommitteesTab';
import BudgetTab from './tabs/BudgetTab';
import AlertsTab from './tabs/AlertsTab';
import { createPartenaire, updatePartenaire } from '../../services/partenaireService';
import { exportConventionToWord } from '../../services/wordExportService';
import { FileDown } from 'lucide-react';
import { createComite, updateComite, getComites } from '../../services/comiteService';
import { createBudget, updateBudget, getBudget } from '../../services/budgetService';
import { getComitesByConvention } from '../../services/comiteService';
import { createAlerte, updateAlerte, getAlertesByConvention } from '../../services/alerteService';

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
  const [file, setFile] = useState(null);

  const handleCommitteesChange = useCallback((newCommittees) => {
    setCommittees(newCommittees);
  }, []);
  // ✅ REF POUR LE FICHIER (persiste entre les renders)
  const fileRef = useRef(null);

  const canEdit = user?.role === ROLES.CHARGE;
  const isExisting = !!id;

  const [isEditing, setIsEditing] = useState(!isExisting ? true : (isExisting && !canEdit ? false : false));

  const [formData, setFormData] = useState({
    intitule: '',
    type: '',
    numero_reference: '',
    date_signature: '',
    date_expiration: '',
    duree_annees: '', // ✅ AJOUT DE LA DURÉE
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
    statut: 'EN_COURS',
    signe: false,
    expiree_manuellement: false
  });

  const [partenaires, setPartenaires] = useState([
    { nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }
  ]);
  const [motCle, setMotCle] = useState('');

  // ✅ RESTAURER LES DONNÉES DEPUIS SESSIONSTORAGE AU CHARGEMENT
  useEffect(() => {
    const savedFileInfo = sessionStorage.getItem('uploadedFileInfo');
    const savedIsFromUpload = sessionStorage.getItem('isFromUpload');

    if (savedFileInfo) {
      try {
        const parsed = JSON.parse(savedFileInfo);
        setUploadedFileInfo(parsed);
        const fakeFile = {
          name: parsed.name,
          size: parsed.size,
          type: parsed.type,
          uploadDate: parsed.uploadDate,
          id: parsed.id
        };
        fileRef.current = fakeFile;
        setFile(fakeFile);
        console.log('📂 Fichier restauré depuis sessionStorage:', parsed);
      } catch (e) {
        console.error('Erreur parsing:', e);
      }
    }

    if (savedIsFromUpload === 'true') {
      setIsFromUpload(true);
    }
  }, []);

  useEffect(() => {
    // ✅ Si c'est une nouvelle convention (pas d'id), nettoyer sessionStorage
    if (!id) {
      sessionStorage.removeItem('uploadedFileInfo');
      sessionStorage.removeItem('isFromUpload');
      setIsFromUpload(false);
      setUploadedFileInfo(null);
      setFile(null);
      fileRef.current = null;
      console.log('🧹 Nouvelle convention - sessionStorage nettoyé');
    }
  }, [id]); 

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
          duree_annees: extracted.duree_annees || '', // ✅ EXTRACTION DE LA DURÉE
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
            id:`temp_${Date.now()}_${index}`,
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
      const uploaded = location.state.uploadedFile;
      fileRef.current = uploaded;
      setFile(uploaded);
      setUploadedFileInfo({
        name: uploaded.name,
        size: uploaded.size,
        type: uploaded.type,
        uploadDate: new Date().toISOString()
      });
      sessionStorage.setItem('uploadedFileInfo', JSON.stringify({
        name: uploaded.name,
        size: uploaded.size,
        type: uploaded.type,
        uploadDate: new Date().toISOString()
      }));
      sessionStorage.setItem('isFromUpload', 'true');
      setIsFromUpload(true);
    }
  }, [location.state]);

  // ✅ Fonction pour extraire un document (Drag & Drop dans GeneralTab)
  const handleExtractDocument = async (file) => {
    const formDataFile = new FormData();
    formDataFile.append('file', file);

    try {
      const response = await extractConvention(formDataFile);
      // ✅ Retourner les données ET le fichier
      return {
        data: response.data,
        file: file
      };
    } catch (error) {
      console.error('Erreur extraction:', error);
      throw error;
    }
  };

  // ✅ Fonction pour mettre à jour toutes les données après extraction
  const handleExtractedData = (data, uploadedFile) => {
    console.log('📥 handleExtractedData - data:', data);
    console.log('📥 handleExtractedData - uploadedFile:', uploadedFile);

    // ✅ Si data a une propriété 'data', c'est qu'on a passé l'objet complet
    const extractedData = data && data.data ? data.data : data;

    if (!extractedData || Object.keys(extractedData).length === 0) {
      console.warn('⚠️ Aucune donnée extraite !');
      setError('Aucune donnée n\'a été extraite du document');
      return;
    }

    // ✅ Sauvegarder le fichier
    if (uploadedFile) {
      fileRef.current = uploadedFile;
      setFile(uploadedFile);

      const fileInfo = {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        uploadDate: new Date().toISOString(),
        conventionId: id // ✅ AJOUTER L'ID DE LA CONVENTION
      };
      setUploadedFileInfo(fileInfo);
      sessionStorage.setItem('uploadedFileInfo', JSON.stringify(fileInfo));
      sessionStorage.setItem('isFromUpload', 'true');
      console.log('💾 Nouveau fichier sauvegardé:', fileInfo);
    }

    // ✅ Mettre à jour le formulaire avec les données extraites
    setFormData(prev => ({
      ...prev,
      intitule: extractedData.intitule || '',
      type: extractedData.type || '',
      date_signature: extractedData.date_signature || '',
      date_expiration: extractedData.date_expiration || '',
      duree_annees: extractedData.duree_annees || '',
      mode_renouvellement: extractedData.mode_renouvellement || '',
      avec_budget: extractedData.avec_budget || false,
      validation_conseil: extractedData.validation_conseil || false,
      formation_continue: extractedData.formation_continue || false,
      mots_cles: extractedData.mots_cles || [],
      signataire_um5: extractedData.signataire_um5 || '',
      signataire_um5_autre: extractedData.signataire_um5_autre || '',
      signataire_partenaire: extractedData.signataire_partenaire || '',
      signataire_partenaire_autre: extractedData.signataire_partenaire_autre || '',
      articles: extractedData.articles || {},
      articles_personnalises: extractedData.articles_personnalises || [],
      articles_masques: [],
      statut: extractedData.statut || 'EN_COURS',
      expiree_manuellement: extractedData.expiree_manuellement || false,
      signe: !!uploadedFile || extractedData.signe || false
    }));

    // ✅ Mettre à jour les partenaires
    if (extractedData.partenaires && extractedData.partenaires.length > 0) {
      setPartenaires(extractedData.partenaires.map(p => ({
        nom: p.nom || '',
        type: p.type || '',
        ville: p.ville || '',
        region: p.region || '',
        pays: p.pays || 'Maroc',
        signataire: p.signataire || ''
      })));
    }

    // ✅ Mettre à jour les comités (avec leurs tâches)
    if (extractedData.comites && extractedData.comites.length > 0) {
      const comitesAvecTaches = extractedData.comites.map(c => ({
        ...c,
        id:`temp_${Date.now()}_${index}`,
        expanded: false,
        reunions: c.reunions || [],
        // ✅ Les tâches sont déjà dans c.taches (extraites par Groq)
        taches: c.taches || []
      }));
      setCommittees(comitesAvecTaches);
      console.log('📋 Comités mis à jour avec leurs tâches:', comitesAvecTaches);
    }

    // ✅ Mettre à jour le budget
    if (extractedData.budget) {
      setBudgetData(extractedData.budget);
      console.log('💰 Budget mis à jour:', extractedData.budget);
    }

    // ✅ Mettre à jour les alertes
    if (extractedData.alertes) {
      setAlertsData({
        auto: extractedData.alertes.auto || [],
        manual: extractedData.alertes.manual || []
      });
    }

    setIsFromUpload(true);
  };

  const fetchConventionData = async () => {
    setLoading(true);
    try {
      const response = await getConvention(id);
      const data = response.data;

      // ✅ Vérifier si des fichiers existent
      let hasFile = false;
      let fileInfo = null;

      try {
        const fichiersResponse = await getFichiersConvention(id);
        if (fichiersResponse.data && fichiersResponse.data.length > 0) {
          hasFile = true;
          const dernierFichier = fichiersResponse.data[fichiersResponse.data.length - 1];
          fileInfo = {
            id: dernierFichier.id,
            name: dernierFichier.nom_fichier || 'Document',
            size: dernierFichier.taille || 0,
            type: dernierFichier.type_fichier || 'application/pdf',
            uploadDate: dernierFichier.uploaded_at || new Date().toISOString(),
            chemin: dernierFichier.chemin
          };
          setUploadedFileInfo(fileInfo);
          setIsFromUpload(true);
          console.log('📂 Fichier existant chargé:', fileInfo);
        }
      } catch (fichiersErr) {
        console.error('Erreur chargement fichiers:', fichiersErr);
      }

      setFormData({
        intitule: data.intitule || '',
        type: data.type || '',
        numero_reference: data.numero_reference || '',
        date_signature: data.date_signature || '',
        date_expiration: data.date_expiration || '',
        duree_annees: data.duree_annees || '',
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
        statut: data.statut || 'EN_COURS',
        expiree_manuellement: data.expiree_manuellement || false,
        signe: hasFile || data.signe || false
      });

      setPartenaires(data.partenaires?.length > 0
        ? data.partenaires
        : [{ nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }]
      );

      // ✅ CHARGER LES COMITÉS
      try {
        const comitesResponse = await getComitesByConvention(id);
        const comitesFiltres = comitesResponse.data;
        if (comitesFiltres && comitesFiltres.length > 0) {
          setCommittees(comitesFiltres.map(c => ({
            ...c,
            expanded: false,
            reunions: c.reunions || [],
            taches: c.taches || [],
            membres_um5: c.membres_um5 || [],  
            membres_partenaires: c.membres_partenaires || [],  
            _existing: true
          })));
          console.log('📋 Comités chargés:', comitesFiltres.length);
        } else {
          setCommittees([]);
        }
      } catch (err) {
        console.error('Erreur chargement comités:', err);
        setCommittees([]);
      }

      // ✅ CHARGER LE BUDGET
      try {
        console.log('💰 Chargement du budget pour la convention:', id);
        const budgetResponse = await getBudget(id);
        
        if (budgetResponse.data) {
          const budgetData = budgetResponse.data;
          
          const mappedBudget = {
            id: budgetData.id,
            modalitePaiement: budgetData.modalites_paiement || '',
            devise: budgetData.devise || 'MAD',
            montantTotal: budgetData.montant || 0,
            montantRecu: budgetData.budget_recu === 'OUI' ? 
              parseFloat(budgetData.montant) || 0 : 0,
            montantDepense: budgetData.montant_depense || 0,
            commentaire: budgetData.commentaire || '',
            justificatifs: []
          };
          
          // ✅ Charger les justificatifs
          try {
            const fichiersResponse = await getFichiersConvention(id);
            const justificatifs = (fichiersResponse.data || [])
              .filter(f => f.type_fichier?.includes('image') || 
                          f.nom_fichier?.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i))
              .map(f => ({
                id: f.id,
                nom: f.nom_fichier,
                uploadDate: f.uploaded_at?.split('T')[0] || new Date().toISOString().split('T')[0]
              }));
            
            mappedBudget.justificatifs = justificatifs;
            console.log('📂 Justificatifs chargés:', justificatifs.length);
            
          } catch (fichiersErr) {
            console.warn('⚠️ Erreur chargement justificatifs:', fichiersErr.message);
          }
          
          console.log('💰 Budget final:', mappedBudget);
          setBudgetData(mappedBudget);
          
        } else {
          setBudgetData(null);
        }
        
      } catch (err) {
        if (err.response?.status === 404) {
          console.log('ℹ️ Aucun budget pour cette convention');
          setBudgetData(null);
        } else {
          console.error('❌ Erreur chargement budget:', err);
          setError('Erreur lors du chargement du budget');
        }
      }

      // ✅ CHARGER LES ALERTES MANUELLES
// ✅ CHARGER LES ALERTES MANUELLES
    try {
      const alertesResponse = await getAlertesByConvention(id);
      console.log('🔔 Alertes chargées:', alertesResponse.data);
      
      if (alertesResponse.data && alertesResponse.data.length > 0) {
        // ✅ Filtrer les alertes manuelles
        const manualAlerts = alertesResponse.data
          .filter(a => a.type_alerte === "MANUELLE")
          .map(a => ({
            id: a.id,
            titre: a.objet || 'Alerte manuelle',
            description: a.objet || '',
            date: a.date_declenchement,
            niveau: 'info',
            active: !a.traitee,
            auto: false,
            _new: false,
            _deleted: false
          }));
        
        console.log('🔔 Alertes manuelles chargées:', manualAlerts);
        
        setAlertsData(prev => ({
          ...prev,
          manual: manualAlerts
        }));
      }
    } catch (err) {
      console.error('❌ Erreur chargement alertes:', err);
    }
      setIsEditing(false);

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
      sessionStorage.removeItem('uploadedFileInfo');
      sessionStorage.removeItem('isFromUpload');
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
    setError(`Veuillez remplir les champs obligatoires : ${missingFields.map(f => f.label).join(', ')}`);
    setSaving(false);
    return;
  }

  const dataToSend = {
    intitule: formData.intitule,
    type: formData.type,
    date_signature: formData.date_signature,
    date_expiration: formData.date_expiration || null,
    duree_annees: formData.duree_annees || null,
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
    statut: formData.statut || 'EN_COURS',
    expiree_manuellement: formData.expiree_manuellement || false,
    signe: formData.signe || false
  };

  try {
    let conventionId;

    if (id) {
      // ── UPDATE ──
      await updateConvention(id, dataToSend);
      conventionId = id;

      // ── PARTENAIRES ──
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
            });
          } else {
            await createPartenaire({ ...partenaire, convention_id: conventionId });
          }
        }
      }

      // ── COMITÉS ──
      console.log('📋 Comités à sauvegarder:', committees);

      // 1. Supprimer les comités marqués _deleted
      const toDelete = committees.filter(c => c._deleted && c.id && !c.id.toString().startsWith('temp_'));
      for (const comite of toDelete) {
        try {
          await deleteComite(comite.id);
          console.log('🗑️ Comité supprimé:', comite.id);
        } catch (err) {
          console.error('❌ Erreur suppression comité:', err);
        }
      }

      // 2. Créer ou mettre à jour les comités
      const toSave = committees.filter(c => !c._deleted);
      for (const comite of toSave) {
        if (!comite.type) continue;

        // ✅ Préparer les données avec la nouvelle structure JSON
        const comiteData = {
          type: comite.type,
          frequence: comite.frequence || null,
          date_debut: comite.date_debut || null,
          prochaine_reunion: comite.prochaineReunion || comite.prochaine_reunion || null,
          convention_id: conventionId,
          taches: (comite.taches || []).map(t => typeof t === 'string' ? t : t.description || t),
          membres_um5: (comite.membres_um5 || comite.membresUm5 || []).map(m => ({
            id: m.id || String(Date.now()),
            nom: m.nom,
            email: m.email,
            etablissement: m.etablissement || ''
          })),
          membres_partenaires: (comite.membres_partenaires || comite.membresPartenaires || []).map(m => ({
            id: m.id || String(Date.now()),
            nom: m.nom,
            email: m.email,
            organisme: m.organisme || ''
          }))
        };

        const isTemp = !comite.id || comite.id.toString().startsWith('temp_');

        if (!isTemp && comite._existing) {
          // ✅ Mise à jour
          console.log('✏️ Update comité:', comite.id);
          await updateComite(comite.id, comiteData);
          comite._modified = false;
        } else {
          // ✅ Création
          console.log('➕ Création comité:', comite.type);
          const response = await createComite(comiteData);
          comite.id = response.data?.id || response.id;
          comite._new = false;
          comite._existing = true;
        }
      }

      // ── BUDGET ──
      if (budgetData) {
        const budgetToSend = {
          montant: budgetData.montantTotal || budgetData.montant || 0,
          modalites_paiement: budgetData.modalitePaiement || budgetData.modalites_paiement || '',
          budget_recu: budgetData.montantRecu && budgetData.montantRecu > 0 ? 'OUI' : 'NON',
          montant_depense: budgetData.montantDepense || 0,
          reste_a_payer: (budgetData.montantTotal || 0) - (budgetData.montantRecu || 0),
          commentaire: budgetData.commentaire || '',
          devise: budgetData.devise || 'MAD',
          convention_id: conventionId,
          justificatifs: budgetData.justificatifs || []
        };

        if (budgetData.id) {
          console.log('💰 Update budget:', budgetData.id);
          await updateBudget(budgetData.id, budgetToSend);
        } else {
          console.log('💰 Création budget');
          const newBudget = await createBudget(budgetToSend);
          budgetData.id = newBudget.data?.id || newBudget.id;
        }
      }

      // ── ALERTES MANUELLES ──
      if (alertsData && alertsData.manual && alertsData.manual.length > 0) {
        console.log('🔔 Sauvegarde des alertes manuelles:', alertsData.manual);
        
        for (const alerte of alertsData.manual) {
          if (alerte._deleted) continue;
          
          try {
            const alerteData = {
              type_alerte: "MANUELLE",
              objet: alerte.titre || 'Alerte manuelle',
              date_declenchement: alerte.date || new Date().toISOString().split('T')[0],
              convention_id: conventionId,
              envoyee: false,
              traitee: !alerte.active,
              destinataires: alerte.destinataires || []
            };

            const isTemp = !alerte.id || alerte.id.toString().startsWith('temp_');
            
            if (!isTemp) {
              console.log('✏️ Update alerte:', alerte.id);
              await updateAlerte(alerte.id, alerteData);
            } else {
              console.log('➕ Création alerte manuelle');
              const newAlerte = await createAlerte(alerteData);
              alerte.id = newAlerte.data?.id || newAlerte.id;
              alerte._new = false;
            }
          } catch (err) {
            console.error('❌ Erreur sauvegarde alerte:', err);
          }
        }
      }

    } else {
      // ── CREATE ──
      const convResponse = await createConvention(dataToSend);
      conventionId = convResponse.data?.id;

      if (!conventionId) {
        setError('Erreur lors de la création de la convention');
        setSaving(false);
        return;
      }

      console.log('✅ Convention créée avec ID:', conventionId);

      // ── PARTENAIRES ──
      for (const partenaire of partenaires) {
        if (partenaire.nom) {
          await createPartenaire({ ...partenaire, convention_id: conventionId });
        }
      }

      // ── COMITÉS ──
      const toSave = committees.filter(c => !c._deleted);
      for (const comite of toSave) {
        if (!comite.type) continue;

        // ✅ Utiliser la nouvelle structure JSON
        const comiteData = {
          type: comite.type,
          frequence: comite.frequence || null,
          date_debut: comite.date_debut || null,
          prochaine_reunion: comite.prochaineReunion || comite.prochaine_reunion || null,
          convention_id: conventionId,
          taches: (comite.taches || []).map(t => typeof t === 'string' ? t : t.description || t),
          membres_um5: (comite.membres_um5 || comite.membresUm5 || []).map(m => ({
            id: m.id || String(Date.now()),
            nom: m.nom,
            email: m.email,
            etablissement: m.etablissement || ''
          })),
          membres_partenaires: (comite.membres_partenaires || comite.membresPartenaires || []).map(m => ({
            id: m.id || String(Date.now()),
            nom: m.nom,
            email: m.email,
            organisme: m.organisme || ''
          }))
        };

        console.log('➕ Création comité:', comite.type);
        const newComite = await createComite(comiteData);
        comite.id = newComite.data?.id || newComite.id;
        comite._new = false;
        comite._existing = true;
      }

      // ── BUDGET ──
      if (budgetData) {
        const budgetToSend = {
          montant: budgetData.montantTotal || budgetData.montant || 0,
          modalites_paiement: budgetData.modalitePaiement || '',
          budget_recu: budgetData.montantRecu && budgetData.montantRecu > 0 ? 'OUI' : 'NON',
          montant_depense: budgetData.montantDepense || 0,
          reste_a_payer: (budgetData.montantTotal || 0) - (budgetData.montantRecu || 0),
          commentaire: budgetData.commentaire || '',
          devise: budgetData.devise || 'MAD',
          convention_id: conventionId,
          justificatifs: budgetData.justificatifs || []
        };

        console.log('💰 Création budget');
        const newBudget = await createBudget(budgetToSend);
        budgetData.id = newBudget.data?.id || newBudget.id;
      }

      // ── ALERTES MANUELLES ──
      if (alertsData && alertsData.manual && alertsData.manual.length > 0) {
        for (const alerte of alertsData.manual) {
          if (alerte._deleted) continue;
          
          try {
            const alerteData = {
              type_alerte: "MANUELLE",
              objet: alerte.titre || 'Alerte manuelle',
              date_declenchement: alerte.date || new Date().toISOString().split('T')[0],
              convention_id: conventionId,
              envoyee: false,
              traitee: !alerte.active,
              destinataires: alerte.destinataires || []
            };

            console.log('➕ Création alerte manuelle');
            const newAlerte = await createAlerte(alerteData);
            alerte.id = newAlerte.data?.id || newAlerte.id;
            alerte._new = false;
          } catch (err) {
            console.error('❌ Erreur sauvegarde alerte:', err);
          }
        }
      }
    }

    // ── UPLOAD FICHIER ──
    const fileToUpload = fileRef.current || file;
    if (fileToUpload instanceof File) {
      const formDataFile = new FormData();
      formDataFile.append('file', fileToUpload);
      formDataFile.append('convention_id', conventionId);
      await uploadFichier(formDataFile);
      sessionStorage.removeItem('uploadedFileInfo');
      sessionStorage.removeItem('isFromUpload');
      fileRef.current = null;
      setFile(null);
    }

    setIsEditing(false);
    navigate(`/conventions/${conventionId}`, { replace: true });

  } catch (err) {
    console.error('❌ Erreur:', err);
    console.error('📋 Réponse:', err.response?.data);
    const detail = err.response?.data?.detail;
    setError(
      typeof detail === 'string' ? detail :
      detail ? JSON.stringify(detail) :
      "Erreur lors de l'enregistrement"
    );
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
                onFileChange={(newFile) => setFile(newFile)}
              />
            )}
            {activeTab === 'committees' && (
              <CommitteesTab
                readOnly={!isEditing}
                initialCommittees={committees}
                onChange={handleCommitteesChange}
                conventionId={id}
                dateSignature={formData.date_signature} 
              />
            )}

            {activeTab === 'budget' && (
              <BudgetTab
                readOnly={!isEditing}
                initialBudget={budgetData}
                onChange={setBudgetData}
                conventionId={id}
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
                initialManualAlerts={alertsData.manual}
                onChange={setAlertsData}
              />
            )}
          </form>
        </div>
      </Card>
    </div>
  );
}