import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { createConvention, updateConvention, getConvention, deleteConvention } from '../../services/conventionService';
import { uploadFichier, extractConvention, getFichiersByConvention as getFichiersConvention, getFichiersByBudget } from '../../services/fichierService';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import GeneralTab from './tabs/GeneralTab';
import CommitteesTab from './tabs/CommitteesTab';
import BudgetTab from './tabs/BudgetTab';
import AlertsTab from './tabs/AlertsTab';
import { createPartenaire, updatePartenaire } from '../../services/partenaireService';
import { FileDown, ArrowLeft } from 'lucide-react';
import { createComite, updateComite, deleteComite } from '../../services/comiteService';
import { createBudget, updateBudget, getBudget } from '../../services/budgetService';
import { getComitesByConvention } from '../../services/comiteService';
import { createAlerte, updateAlerte, getAlertesByConvention } from '../../services/alerteService';
import api from '../../services/api'; 

export default function ConventionForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // ✅ Tabs traduits (dynamic)
  const TABS = [
    { id: 'general', labelKey: 'conventions.tabGeneral' },
    { id: 'committees', labelKey: 'conventions.tabCommittees' },
    { id: 'budget', labelKey: 'conventions.tabBudget' },
    { id: 'alerts', labelKey: 'conventions.tabAlerts' }
  ];

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
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  const handleCommitteesChange = useCallback((newCommittees) => {
    setCommittees(newCommittees);
  }, []);

  const fileRef = useRef(null);
  const isAdmin = user?.is_admin === true;
  const role = user?.role;
  const canEdit = role === ROLES.CHARGE || isAdmin;
  const canEditBudget = role === ROLES.SG;


  const isExisting = !!id;

  const [isEditing, setIsEditing] = useState(!id);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const budgetEditable = isEditing || isEditingBudget;


  const [formData, setFormData] = useState({
    intitule: '', type: '', numero_reference: '', date_signature: '', date_expiration: '',
    duree_annees: '', mode_renouvellement: '', signataire_um5: '', signataire_um5_autre: '',
    signataire_partenaire: '', signataire_partenaire_autre: '', avec_budget: false,
    validation_conseil: false, formation_continue: false, mots_cles: [], articles: {},
    articles_personnalises: [], articles_masques: [], statut: 'EN_COURS',
    signe: false, expiree_manuellement: false, _modified: false
  });

  const [partenaires, setPartenaires] = useState([
    { nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }
  ]);
  const [motCle, setMotCle] = useState('');

  // ✅ RESTAURER LES DONNÉES DEPUIS SESSIONSTORAGE
  useEffect(() => {
    const savedFileInfo = sessionStorage.getItem('uploadedFileInfo');
    const savedIsFromUpload = sessionStorage.getItem('isFromUpload');
    if (savedFileInfo) {
      try {
        const parsed = JSON.parse(savedFileInfo);
        setUploadedFileInfo(parsed);
        const fakeFile = { name: parsed.name, size: parsed.size, type: parsed.type, uploadDate: parsed.uploadDate, id: parsed.id };
        fileRef.current = fakeFile;
        setFile(fakeFile);
      } catch (e) { console.error('Erreur parsing:', e); }
    }
    if (savedIsFromUpload === 'true') setIsFromUpload(true);
  }, []);

  useEffect(() => {
    if (!id) {
      sessionStorage.removeItem('uploadedFileInfo');
      sessionStorage.removeItem('isFromUpload');
      setIsFromUpload(false);
      setUploadedFileInfo(null);
      setFile(null);
      fileRef.current = null;
    }
  }, [id]);

  useEffect(() => { if (id) fetchConventionData(); }, [id]);

  // ✅ Récupération des données extraites par OCR + Groq
  useEffect(() => {
    if (location.state?.extractedData) {
      const extracted = location.state.extractedData;
      if (!extracted.error) {
        setFormData(prev => ({
          ...prev,
          intitule: extracted.intitule || '', type: extracted.type || '',
          date_signature: extracted.date_signature || '', date_expiration: extracted.date_expiration || '',
          duree_annees: extracted.duree_annees || '', mode_renouvellement: extracted.mode_renouvellement || '',
          avec_budget: extracted.avec_budget || false, validation_conseil: extracted.validation_conseil || false,
          formation_continue: extracted.formation_continue || false, mots_cles: extracted.mots_cles || [],
          signataire_um5: extracted.signataire_um5 || '', signataire_um5_autre: extracted.signataire_um5_autre || '',
          signataire_partenaire: extracted.signataire_partenaire || '', signataire_partenaire_autre: extracted.signataire_partenaire_autre || '',
          articles: extracted.articles || {}, articles_personnalises: extracted.articles_personnalises || [],
          statut: extracted.statut || 'EN_COURS'
        }));

        if (extracted.partenaires?.length > 0) {
          setPartenaires(extracted.partenaires.map(p => ({
            nom: p.nom || '', type: p.type || '', ville: p.ville || '',
            region: p.region || '', pays: p.pays || 'Maroc', signataire: p.signataire || ''
          })));
        }
        if (extracted.comites?.length > 0) {
          setCommittees(extracted.comites.map((c, index) => ({
            ...c, id: `temp_${Date.now()}_${index}`, expanded: false, reunions: c.reunions || []
          })));
        }
        if (extracted.budget) setBudgetData(extracted.budget);
        if (extracted.alertes) setAlertsData({ auto: extracted.alertes.auto || [], manual: extracted.alertes.manual || [] });
        setIsFromUpload(true);
      } else {
        setError(t('common.error'));
      }
    }
    if (location.state?.uploadedFile) {
      const uploaded = location.state.uploadedFile;
      fileRef.current = uploaded;
      setFile(uploaded);
      setUploadedFileInfo({ name: uploaded.name, size: uploaded.size, type: uploaded.type, uploadDate: new Date().toISOString() });
      sessionStorage.setItem('uploadedFileInfo', JSON.stringify({ name: uploaded.name, size: uploaded.size, type: uploaded.type, uploadDate: new Date().toISOString() }));
      sessionStorage.setItem('isFromUpload', 'true');
      setIsFromUpload(true);
    }
  }, [location.state]);

  const handleExtractDocument = async (file) => {
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    try {
      const response = await extractConvention(formDataFile);
      return { data: response.data, file: file };
    } catch (error) { console.error('Erreur extraction:', error); throw error; }
  };

  const handleExtractedData = (data, uploadedFile) => {
    const extractedData = data && data.data ? data.data : data;
    if (!extractedData || Object.keys(extractedData).length === 0) {
      setError(t('common.error'));
      return;
    }
    if (uploadedFile) {
      fileRef.current = uploadedFile;
      setFile(uploadedFile);
      const fileInfo = { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type, uploadDate: new Date().toISOString(), conventionId: id };
      setUploadedFileInfo(fileInfo);
      sessionStorage.setItem('uploadedFileInfo', JSON.stringify(fileInfo));
      sessionStorage.setItem('isFromUpload', 'true');
    }
    setFormData(prev => ({
      ...prev,
      intitule: extractedData.intitule || '', type: extractedData.type || '',
      date_signature: extractedData.date_signature || '', date_expiration: extractedData.date_expiration || '',
      duree_annees: extractedData.duree_annees || '', mode_renouvellement: extractedData.mode_renouvellement || '',
      avec_budget: extractedData.avec_budget || false, validation_conseil: extractedData.validation_conseil || false,
      formation_continue: extractedData.formation_continue || false, mots_cles: extractedData.mots_cles || [],
      signataire_um5: extractedData.signataire_um5 || '', signataire_um5_autre: extractedData.signataire_um5_autre || '',
      signataire_partenaire: extractedData.signataire_partenaire || '', signataire_partenaire_autre: extractedData.signataire_partenaire_autre || '',
      articles: extractedData.articles || {}, articles_personnalises: extractedData.articles_personnalises || [],
      articles_masques: [], statut: extractedData.statut || 'EN_COURS',
      expiree_manuellement: extractedData.expiree_manuellement || false,
      signe: !!uploadedFile || extractedData.signe || false
    }));
    if (extractedData.partenaires?.length > 0) {
      setPartenaires(extractedData.partenaires.map(p => ({
        nom: p.nom || '', type: p.type || '', ville: p.ville || '',
        region: p.region || '', pays: p.pays || 'Maroc', signataire: p.signataire || ''
      })));
    }
    if (extractedData.comites?.length > 0) {
      setCommittees(extractedData.comites.map((c, index) => ({
        ...c, id: `temp_${Date.now()}_${index}`, expanded: false,
        reunions: c.reunions || [], taches: c.taches || []
      })));
    }
    if (extractedData.budget) setBudgetData(extractedData.budget);
    if (extractedData.alertes) setAlertsData({ auto: extractedData.alertes.auto || [], manual: extractedData.alertes.manual || [] });
    setIsFromUpload(true);
    if (canEdit) setIsEditing(true);
  };

  const fetchConventionData = async () => {
    setLoading(true);
    try {
      const response = await getConvention(id);
      const data = response.data;
      let hasFile = false;
      let fileInfo = null;

      try {
        const fichiersResponse = await getFichiersConvention(id);
        // ✅ FILTRER : prendre UNIQUEMENT les fichiers de la convention
        // (ceux qui n'ont NI budget_id NI comite_id)
        const fichiersConvention = (fichiersResponse.data || []).filter(
            f => !f.budget_id && !f.comite_id
        );

        if (fichiersConvention.length > 0) {
            hasFile = true;
            const dernierFichier = fichiersConvention[fichiersConvention.length - 1];
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
        }
      } catch (fichiersErr) { console.error('Erreur chargement fichiers:', fichiersErr); }

      setFormData({
        intitule: data.intitule || '', type: data.type || '', numero_reference: data.numero_reference || '',
        date_signature: data.date_signature || '', date_expiration: data.date_expiration || '',
        duree_annees: data.duree_annees || '', mode_renouvellement: data.mode_renouvellement || '',
        signataire_um5: data.signataire_um5 || '', signataire_um5_autre: data.signataire_um5_autre || '',
        signataire_partenaire: data.signataire_partenaire || '', signataire_partenaire_autre: data.signataire_partenaire_autre || '',
        avec_budget: data.avec_budget || false, validation_conseil: data.validation_conseil || false,
        formation_continue: data.formation_continue || false, mots_cles: data.mots_cles || [],
        articles: data.articles || {}, articles_personnalises: data.articles_personnalises || [],
        statut: data.statut || 'EN_COURS', expiree_manuellement: data.expiree_manuellement || false,
        signe: hasFile || data.signe || false
      });

      setPartenaires(data.partenaires?.length > 0 ? data.partenaires : [{ nom: '', type: '', ville: '', region: '', pays: 'Maroc', signataire: '' }]);

      try {
        const comitesResponse = await getComitesByConvention(id);
        if (comitesResponse.data?.length > 0) {
          setCommittees(comitesResponse.data.map(c => ({
            ...c, expanded: false, reunions: c.reunions || [], taches: c.taches || [],
            membres_um5: c.membres_um5 || [], membres_partenaires: c.membres_partenaires || [], _existing: true
          })));
        } else { setCommittees([]); }
      } catch (err) { console.error('Erreur chargement comités:', err); setCommittees([]); }

      try {
        const budgetResponse = await getBudget(id);
        if (budgetResponse.data) {
          const budgetData = budgetResponse.data;
          const mappedBudget = {
            id: budgetData.id, modalitePaiement: budgetData.modalites_paiement || '',
            devise: budgetData.devise || 'MAD', montantTotal: budgetData.montant || 0,
            montantRecu: budgetData.budget_recu === 'OUI' ? parseFloat(budgetData.montant) || 0 : 0,
            montantDepense: budgetData.montant_depense || 0, commentaire: budgetData.commentaire || '', justificatifs: []
          };
          try {
            const budgetId = budgetData.id;  // ⬅️ L'ID du budget
            const fichiersResponse = await getFichiersByBudget(budgetId);   // ⬅️ Nouveau
            const justificatifs = (fichiersResponse.data || [])
              .map(f => ({
                id: f.id,
                nom: f.nom_fichier,
                uploadDate: f.uploaded_at?.split('T')[0] || new Date().toISOString().split('T')[0]
              }));
            mappedBudget.justificatifs = justificatifs;
          } catch (fichiersErr) {
            console.warn('Pas de justificatifs:', fichiersErr.message);
            mappedBudget.justificatifs = [];
          }
          setBudgetData(mappedBudget);
        } else { setBudgetData(null); }
      } catch (err) {
        if (err.response?.status === 404) setBudgetData(null);
        else { console.error('❌ Erreur chargement budget:', err); setError(t('common.error')); }
      }

      try {
        const alertesResponse = await getAlertesByConvention(id);
        if (alertesResponse.data?.length > 0) {
          const manualAlerts = alertesResponse.data
            .filter(a => a.type_alerte === "MANUELLE")
            .map(a => ({
              id: a.id, titre: a.objet || t('alerts.manual'), description: a.objet || '',
              date: a.date_declenchement, niveau: 'info', active: !a.traitee, auto: false, _new: false, _deleted: false
            }));
          setAlertsData(prev => ({ ...prev, manual: manualAlerts }));
        }
      } catch (err) { console.error('❌ Erreur chargement alertes:', err); }
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError(t('common.error'));
    } finally { setLoading(false); }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value, _modified: true }));
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
      setFormData(prev => ({ ...prev, mots_cles: [...prev.mots_cles, motCle.trim()] }));
      setMotCle('');
    }
  };

  const removeMotCle = (mc) => {
    setFormData(prev => ({ ...prev, mots_cles: prev.mots_cles.filter(m => m !== mc) }));
  };

  const handleCancel = () => {
    if (id) { setIsEditing(false); fetchConventionData(); }
    else navigate('/conventions');
  };

  const handleDelete = async () => {
    if (!window.confirm(t('conventions.confirmDelete'))) return;
    try {
      await deleteConvention(id);
      sessionStorage.removeItem('uploadedFileInfo');
      sessionStorage.removeItem('isFromUpload');
      navigate('/conventions');
    } catch (err) { console.error(err); setError(t('common.error')); }
  };

  const handleExportWord = async (langue) => {
      setIsWordModalOpen(false);
      
      try {
          console.log(`📄 Export Word en ${langue.toUpperCase()}...`);
          
          const response = await api.get(
              `/conventions/${id}/export-word`,
              {
                  params: { langue },
                  responseType: 'blob'    // ⬅️ Important pour télécharger le fichier
              }
          );
          
          // Créer un blob URL pour télécharger
          const blob = new Blob([response.data], {
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
          const url = window.URL.createObjectURL(blob);
          
          // Nom du fichier
          const intitule = (formData.intitule || 'convention').substring(0, 50).replace(/\s+/g, '_');
          const filename = `Convention_${intitule}_${langue.toUpperCase()}.docx`;
          
          // Télécharger
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          // Nettoyer
          window.URL.revokeObjectURL(url);
          
          console.log(`✅ Fichier téléchargé : ${filename}`);
      } catch (err) {
          console.error('❌ Erreur export Word:', err);
          setError(t('common.error'));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const requiredFields = [
      { field: 'intitule', label: t('conventions.intitule') },
      { field: 'type', label: t('conventions.type') },
      { field: 'date_signature', label: t('conventions.signatureDate') },
      { field: 'signataire_um5', label: t('conventions.signatoryUM5') }
    ];

    const missingFields = requiredFields.filter(f => !formData[f.field]);
    if (missingFields.length > 0) {
      setError(`${t('common.required')}: ${missingFields.map(f => f.label).join(', ')}`);
      setSaving(false);
      return;
    }

    const dataToSend = {
      intitule: formData.intitule, type: formData.type, date_signature: formData.date_signature,
      date_expiration: formData.date_expiration || null, duree_annees: formData.duree_annees || null,
      mode_renouvellement: formData.mode_renouvellement || null, signataire_um5: formData.signataire_um5,
      signataire_um5_autre: formData.signataire_um5_autre || null,
      signataire_partenaire: formData.signataire_partenaire || null,
      signataire_partenaire_autre: formData.signataire_partenaire_autre || null,
      avec_budget: formData.avec_budget || false, validation_conseil: formData.validation_conseil || false,
      formation_continue: formData.formation_continue || false, mots_cles: formData.mots_cles || [],
      articles: formData.articles || {}, articles_personnalises: formData.articles_personnalises || [],
      statut: formData.statut || 'EN_COURS', expiree_manuellement: formData.expiree_manuellement || false,
      signe: formData.signe || false
    };

    try {
      let conventionId;
      if (id) {
        if (formData._modified) { await updateConvention(id, dataToSend); formData._modified = false; }
        conventionId = id;

        for (const partenaire of partenaires) {
          if (partenaire.nom) {
            if (partenaire.id) await updatePartenaire(partenaire.id, { nom: partenaire.nom, type: partenaire.type, ville: partenaire.ville || '', region: partenaire.region || '', pays: partenaire.pays || 'Maroc', signataire: partenaire.signataire || '' });
            else await createPartenaire({ ...partenaire, convention_id: conventionId });
          }
        }

        const toDelete = committees.filter(c => c._deleted && c.id && !c.id.toString().startsWith('temp_'));
        for (const comite of toDelete) {
          try { await deleteComite(comite.id); } catch (err) { console.error(err); }
        }

        const toSave = committees.filter(c => !c._deleted);
        for (const comite of toSave) {
          if (!comite.type) continue;
          const hasChanges = comite._modified || comite._new;
          const isTemp = !comite.id || comite.id.toString().startsWith('temp_');
          if (!hasChanges && !isTemp) continue;

          const comiteData = {
            type: comite.type, frequence: comite.frequence || null, date_debut: comite.date_debut || null,
            prochaine_reunion: comite.prochaineReunion || comite.prochaine_reunion || null,
            convention_id: conventionId,
            taches: (comite.taches || []).map(t => typeof t === 'string' ? t : t.description || t),
            membres_um5: (comite.membres_um5 || comite.membresUm5 || []).map(m => ({ id: m.id || String(Date.now()), nom: m.nom, email: m.email, etablissement: m.etablissement || '' })),
            membres_partenaires: (comite.membres_partenaires || comite.membresPartenaires || []).map(m => ({ id: m.id || String(Date.now()), nom: m.nom, email: m.email, organisme: m.organisme || '' }))
          };

          if (!isTemp && comite._existing) { await updateComite(comite.id, comiteData); comite._modified = false; }
          else { const response = await createComite(comiteData); comite.id = response.data?.id || response.id; comite._new = false; comite._existing = true; comite._modified = false; }
        }

        if (budgetData) {
          const budgetHasChanges = budgetData._modified || budgetData._new;
          const budgetExists = budgetData.id && !budgetData.id.toString().startsWith('temp_');
          if (!budgetHasChanges && budgetExists) { /* rien */ }
          else {
            const budgetToSend = {
              montant: budgetData.montantTotal || budgetData.montant || 0,
              modalites_paiement: budgetData.modalitePaiement || budgetData.modalites_paiement || '',
              budget_recu: budgetData.montantRecu && budgetData.montantRecu > 0 ? 'OUI' : 'NON',
              montant_depense: budgetData.montantDepense || 0,
              reste_a_payer: (budgetData.montantTotal || 0) - (budgetData.montantRecu || 0),
              commentaire: budgetData.commentaire || '', devise: budgetData.devise || 'MAD',
              convention_id: conventionId, justificatifs: budgetData.justificatifs || []
            };
            if (budgetData.id && !budgetData.id.toString().startsWith('temp_')) { await updateBudget(budgetData.id, budgetToSend); budgetData._modified = false; }
            else { const newBudget = await createBudget(budgetToSend); budgetData.id = newBudget.data?.id || newBudget.id; budgetData._new = false; budgetData._modified = false; }
          }
        }

        if (alertsData?.manual?.length > 0) {
          for (const alerte of alertsData.manual) {
            if (alerte._deleted) continue;
            const alerteHasChanges = alerte._modified || alerte._new;
            const isTempAlerte = !alerte.id || alerte.id.toString().startsWith('temp_');
            if (!alerteHasChanges && !isTempAlerte) continue;
            try {
              const alerteData = { type_alerte: "MANUELLE", objet: alerte.titre || t('alerts.manual'), date_declenchement: alerte.date || new Date().toISOString().split('T')[0], convention_id: conventionId, envoyee: false, traitee: !alerte.active, destinataires: alerte.destinataires || [] };
              if (!isTempAlerte) { await updateAlerte(alerte.id, alerteData); alerte._modified = false; }
              else { const newAlerte = await createAlerte(alerteData); alerte.id = newAlerte.data?.id || newAlerte.id; alerte._new = false; alerte._modified = false; }
            } catch (err) { console.error(err); }
          }
        }
        alert(t('conventions.saveSuccess'));

      } else {
        const convResponse = await createConvention(dataToSend);
        conventionId = convResponse.data?.id;
        if (!conventionId) { setError(t('common.error')); setSaving(false); return; }

        for (const partenaire of partenaires) {
          if (partenaire.nom) await createPartenaire({ ...partenaire, convention_id: conventionId });
        }

        const toSave = committees.filter(c => !c._deleted);
        for (const comite of toSave) {
          if (!comite.type) continue;
          const comiteData = {
            type: comite.type, frequence: comite.frequence || null, date_debut: comite.date_debut || null,
            prochaine_reunion: comite.prochaineReunion || comite.prochaine_reunion || null,
            convention_id: conventionId,
            taches: (comite.taches || []).map(t => typeof t === 'string' ? t : t.description || t),
            membres_um5: (comite.membres_um5 || comite.membresUm5 || []).map(m => ({ id: m.id || String(Date.now()), nom: m.nom, email: m.email, etablissement: m.etablissement || '' })),
            membres_partenaires: (comite.membres_partenaires || comite.membresPartenaires || []).map(m => ({ id: m.id || String(Date.now()), nom: m.nom, email: m.email, organisme: m.organisme || '' }))
          };
          const newComite = await createComite(comiteData);
          comite.id = newComite.data?.id || newComite.id;
        }

        if (budgetData) {
          const budgetToSend = { montant: budgetData.montantTotal || budgetData.montant || 0, modalites_paiement: budgetData.modalitePaiement || '', budget_recu: budgetData.montantRecu && budgetData.montantRecu > 0 ? 'OUI' : 'NON', montant_depense: budgetData.montantDepense || 0, reste_a_payer: (budgetData.montantTotal || 0) - (budgetData.montantRecu || 0), commentaire: budgetData.commentaire || '', devise: budgetData.devise || 'MAD', convention_id: conventionId, justificatifs: budgetData.justificatifs || [] };
          const newBudget = await createBudget(budgetToSend);
          budgetData.id = newBudget.data?.id || newBudget.id;
        }

        if (alertsData?.manual?.length > 0) {
          for (const alerte of alertsData.manual) {
            if (alerte._deleted) continue;
            try {
              const alerteData = { type_alerte: "MANUELLE", objet: alerte.titre || t('alerts.manual'), date_declenchement: alerte.date || new Date().toISOString().split('T')[0], convention_id: conventionId, envoyee: false, traitee: !alerte.active, destinataires: alerte.destinataires || [] };
              const newAlerte = await createAlerte(alerteData);
              alerte.id = newAlerte.data?.id || newAlerte.id;
            } catch (err) { console.error(err); }
          }
        }
      }

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
      // ═══════════════════════════════════════════════════════════
      // ✅ NOTIFICATION AUX CHARGÉS si c'est le SG qui a modifié
      // ═══════════════════════════════════════════════════════════
      if (role === ROLES.SG && id) {
        try {
          await api.post(`/notifications/sg-update/${conventionId}`);
          console.log('✅ Notification SG envoyée aux chargés');
        } catch (notifError) {
          console.error('⚠️ Erreur notification SG (non bloquant):', notifError);
          // ⚠️ Ne pas bloquer — l'enregistrement a réussi
        }
      }

      setIsEditing(false);
      navigate(`/conventions/${conventionId}`, { replace: true });
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : t('common.error'));
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">{t('common.loading')}</div></div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/conventions')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
              {id ? `${t('conventions.tabGeneral')} - ${formData.intitule || ''}` : t('conventions.new')}
            </h1>
            {id && <p className="text-xs sm:text-sm text-gray-500">{t('conventions.reference')}: {formData.numero_reference}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {id && !isEditing && !isEditingBudget && (
            <>
              <Button onClick={() => setIsWordModalOpen(true)} variant="success" className="flex items-center gap-2 text-xs sm:text-sm">
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.exportWord')}</span>
              </Button>
              {canEdit && <Button onClick={() => setIsEditing(true)} className="text-xs sm:text-sm">{t('common.edit')}</Button>}
              {canEditBudget && <Button onClick={() => setIsEditingBudget(true)} className="text-xs sm:text-sm">{t('budget.editBudget')}</Button>}
              {canEdit && <Button variant="danger" onClick={handleDelete} className="text-xs sm:text-sm">{t('common.delete')}</Button>}
            </>
          )}
          {(isEditing || isEditingBudget) && (
            <>
              <Button variant="secondary" onClick={handleCancel} className="text-xs sm:text-sm">{t('common.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={saving} className="text-xs sm:text-sm">
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded"><p className="text-xs sm:text-sm text-red-600">{error}</p></div>}

      <Card>
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto px-3 sm:px-6 pt-4 gap-4 sm:gap-8">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-6">
          <form onSubmit={handleSubmit}>
            {activeTab === 'general' && <GeneralTab formData={formData} partenaires={partenaires} motCle={motCle} setMotCle={setMotCle} onFormChange={handleFormChange} onPartenaireChange={handlePartenaireChange} onAddPartenaire={addPartenaire} onRemovePartenaire={removePartenaire} onAddMotCle={addMotCle} onRemoveMotCle={removeMotCle} readOnly={!isEditing} onExtractDocument={handleExtractDocument} onExtractedData={handleExtractedData} conventionId={id} isFromUpload={isFromUpload} uploadedFile={file} uploadedFileInfo={uploadedFileInfo} onFileChange={(newFile) => setFile(newFile)} />}
            {activeTab === 'committees' && <CommitteesTab readOnly={!isEditing} initialCommittees={committees} onChange={handleCommitteesChange} conventionId={id} dateSignature={formData.date_signature} />}
            {activeTab === 'budget' && <BudgetTab readOnly={!budgetEditable} initialBudget={budgetData} onChange={(newBudget) => setBudgetData(newBudget)} conventionId={id} budgetId={budgetData?.id} />}
            {activeTab === 'alerts' && <AlertsTab readOnly={!isEditing} conventionData={{ date_expiration: formData.date_expiration, comites: committees, budget: budgetData }} initialManualAlerts={alertsData.manual} onChange={setAlertsData} />}
          </form>
        </div>
      </Card>
       {/* ═══ MODAL EXPORT WORD ═══ */}
      <Modal isOpen={isWordModalOpen} onClose={() => setIsWordModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <FileDown size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Exporter en Word
              </h3>
              <p className="text-sm text-gray-500">
                Choisissez la langue du document
              </p>
            </div>
          </div>

          {/* Choix de langue */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            
            {/* 🇫🇷 Français */}
            <button
              type="button"
              onClick={() => handleExportWord('fr')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
            >
              <div className="text-4xl mb-2">🇫🇷</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                Français
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Version FR
              </div>
            </button>

            {/* 🇲🇦 Arabe */}
            <button
              type="button"
              onClick={() => handleExportWord('ar')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center group"
            >
              <div className="text-4xl mb-2">🇲🇦</div>
              <div className="font-semibold text-gray-900 group-hover:text-green-600">
                العربية
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Version AR
              </div>
            </button>
          </div>

          {/* Annuler */}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsWordModalOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}