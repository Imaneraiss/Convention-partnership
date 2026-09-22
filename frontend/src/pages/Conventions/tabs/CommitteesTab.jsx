import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, ChevronRight, Plus, Download, FileText, Users, User,
  Mail, Briefcase, CheckSquare, Clock, Upload, Trash2, Save, X
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
// ⬇️ MODIFICATION : Ajout ETABLISSEMENTS_UM5 et optionsBilingues
import { TYPES_COMITE, FREQUENCES_REUNION, ETABLISSEMENTS_UM5, optionsBilingues } from '../../../utils/constants';
import { uploadFichier, deleteFichier } from '../../../services/fichierService';
import { createComite, updateComite, deleteComite, getComitesByConvention } from '../../../services/comiteService';
import DownloadButton from '../../../components/common/DownloadButton';

// Jours fériés au Maroc
const JOURS_FERIES = [
  '2026-01-01', '2026-01-11', '2026-05-01', '2026-07-30',
  '2026-08-14', '2026-08-20', '2026-08-21', '2026-11-06', '2026-11-18',
];

export default function CommitteesTab({ 
  readOnly, 
  initialCommittees = [], 
  onChange,
  conventionId,
  extractedTaches = [],
  dateSignature = null 
}) {
  const { t } = useTranslation();
  const [committees, setCommittees] = useState(initialCommittees || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [newCommittee, setNewCommittee] = useState({
    type: '', frequence: '', membresUm5: [], membresPartenaires: [], taches: []
  });
  
  const [newMembreUm5, setNewMembreUm5] = useState({ nom: '', email: '', etablissement: '' });
  const [newMembrePartenaire, setNewMembrePartenaire] = useState({ nom: '', email: '', organisme: '' });
  const [newTache, setNewTache] = useState('');

  const frequenceOptions = FREQUENCES_REUNION || ['Hebdomadaire', 'Mensuelle', 'Bimestrielle', 'Trimestrielle', 'Semestrielle', 'Annuelle'];
  const typeOptions = TYPES_COMITE || ['PILOTAGE', 'SUIVI', 'TECHNIQUE', 'SCIENTIFIQUE'];
  // ⬇️ MODIFICATION : Utiliser ETABLISSEMENTS_UM5 depuis constants
  const etablissementsOptions = ETABLISSEMENTS_UM5 || ['UM5R', 'FLSH', 'FMD', 'FMPH', 'ENS', 'ENSAM', 'ENSET', 'EST', 'FSR', 'FSJES AGDAL', 'FSJES SOUISSI', 'FSJES SALE', 'EST SALE', 'EMI', 'ENSIAS', 'IS'];

  // ✅ Fonction pour télécharger
  const downloadFile = async (fichierId, nomFichier) => {
    try {
      const response = await fetch(`/api/fichiers/${fichierId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Erreur');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomFichier || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    }
  };

  // Init comités
  useEffect(() => {
    if (initialCommittees?.length > 0 && dateSignature) {
      const hasExistingDates = initialCommittees.some(c => c.date_debut || c.prochaineReunion);
      if (!hasExistingDates) {
        const updated = initialCommittees.map(c => ({
          ...c, date_debut: dateSignature,
          prochaineReunion: calculerProchaineReunion(dateSignature, c.frequence),
          _modified: true
        }));
        updateCommittees(updated);
      }
    }
  }, [initialCommittees, dateSignature]);

  useEffect(() => {
    if (conventionId && !initialCommittees.length) chargerComites();
  }, [conventionId]);

  const chargerComites = async () => {
    try {
      const response = await getComitesByConvention(conventionId);
      const comites = response.data.map(c => ({ ...c, expanded: false, reunions: [], _existing: true }));
      updateCommittees(comites);
    } catch (error) { console.error(error); }
  };

  const updateCommittees = useCallback((newCommittees) => {
    setCommittees(newCommittees);
    if (onChange) onChange(newCommittees);
  }, [onChange]);

  const toggleExpand = (id) => {
    updateCommittees(committees.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c));
  };

  const estJourFerie = (date) => JOURS_FERIES.includes(date.toISOString().split('T')[0]);
  const estWeekend = (date) => [5, 6].includes(date.getDay());

  const prochainJourOuvrable = (date) => {
    const newDate = new Date(date);
    while (estWeekend(newDate) || estJourFerie(newDate)) newDate.setDate(newDate.getDate() + 1);
    return newDate;
  };

  const calculerProchaineReunion = (dateDebut, frequence) => {
    if (!dateDebut || !frequence) return '';
    const date = new Date(dateDebut);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    while (date < aujourdhui) {
      switch (frequence) {
        case 'Hebdomadaire': date.setDate(date.getDate() + 7); break;
        case 'Mensuelle': date.setMonth(date.getMonth() + 1); break;
        case 'Bimestrielle': date.setMonth(date.getMonth() + 2); break;
        case 'Trimestrielle': date.setMonth(date.getMonth() + 3); break;
        case 'Semestrielle': date.setMonth(date.getMonth() + 6); break;
        case 'Annuelle': date.setFullYear(date.getFullYear() + 1); break;
        default: break;
      }
    }
    return prochainJourOuvrable(date).toISOString().split('T')[0];
  };

  const prepareDataForApi = (committee) => ({
    type: committee.type,
    frequence: committee.frequence,
    convention_id: conventionId,
    date_debut: committee.date_debut || dateSignature,
    prochaine_reunion: committee.prochaineReunion || committee.prochaine_reunion,
    taches: (committee.taches || []).map(t => typeof t === 'string' ? t : t.description || t),
    membres_um5: (committee.membres_um5 || committee.membresUm5 || []).map(m => ({
      id: m.id || String(Date.now()), nom: m.nom, email: m.email, etablissement: m.etablissement || ''
    })),
    membres_partenaires: (committee.membres_partenaires || committee.membresPartenaires || []).map(m => ({
      id: m.id || String(Date.now()), nom: m.nom, email: m.email, organisme: m.organisme || ''
    })),
    reunions: (committee.reunions || []).map(r => ({ id: r.id, date: r.date, pv: r.pv || null }))
  });

  const sauvegarderTousLesComites = async () => {
    if (!conventionId) { alert(t('committees.saveFirst')); return; }
    setSaving(true);
    try {
      const results = [];
      for (const committee of committees) {
        const apiData = prepareDataForApi(committee);
        if (committee._new) {
          const response = await createComite(apiData);
          committee.id = response.data.id;
          committee._new = false; committee._existing = true;
          results.push({ id: committee.id, action: 'created' });
        } else if (committee._modified || committee._updated) {
          await updateComite(committee.id, apiData);
          committee._modified = false; committee._updated = false;
          results.push({ id: committee.id, action: 'updated' });
        }
      }
      updateCommittees([...committees]);
      alert(`✅ ${results.length} ${t('committees.savedCount')}`);
    } catch (error) {
      console.error(error);
      alert(`❌ ${t('common.error')}`);
    } finally { setSaving(false); }
  };

  const addCommittee = () => {
    if (newCommittee.type) {
      const dateDebut = dateSignature || new Date().toISOString().split('T')[0];
      const newComm = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: newCommittee.type, frequence: newCommittee.frequence,
        convention_id: conventionId, nom: newCommittee.type,
        date_debut: dateDebut,
        prochaineReunion: calculerProchaineReunion(dateDebut, newCommittee.frequence),
        prochaine_reunion: calculerProchaineReunion(dateDebut, newCommittee.frequence),
        taches: extractedTaches.length > 0 ? extractedTaches : [],
        membres_um5: newCommittee.membresUm5 || [],
        membres_partenaires: newCommittee.membresPartenaires || [],
        reunions: [], expanded: false, _new: true, _modified: true
      };
      updateCommittees([...committees, newComm]);
      setNewCommittee({ type: '', frequence: '', membresUm5: [], membresPartenaires: [], taches: [] });
      setIsModalOpen(false);
    }
  };

  const removeCommittee = async (id) => {
    if (!window.confirm(t('committees.confirmDelete'))) return;
    try {
      const committee = committees.find(c => c.id === id);
      if (committee && !committee._new && committee._existing) await deleteComite(id);
      updateCommittees(committees.filter(c => c.id !== id));
    } catch (error) { console.error(error); alert(t('common.error')); }
  };

  // MEMBRES UM5
  const addMembreUm5 = (committeeId) => {
    if (newMembreUm5.nom && newMembreUm5.email) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, membres_um5: [...(c.membres_um5 || c.membresUm5 || []), { ...newMembreUm5, id: String(Date.now()) }], _modified: true }
          : c
      ));
      setNewMembreUm5({ nom: '', email: '', etablissement: '' });
    }
  };

  const removeMembreUm5 = (committeeId, membreId) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, membres_um5: (c.membres_um5 || c.membresUm5 || []).filter(m => m.id !== membreId), _modified: true }
        : c
    ));
  };

  // MEMBRES PARTENAIRES
  const addMembrePartenaire = (committeeId) => {
    if (newMembrePartenaire.nom && newMembrePartenaire.email) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, membres_partenaires: [...(c.membres_partenaires || c.membresPartenaires || []), { ...newMembrePartenaire, id: String(Date.now()) }], _modified: true }
          : c
      ));
      setNewMembrePartenaire({ nom: '', email: '', organisme: '' });
    }
  };

  const removeMembrePartenaire = (committeeId, membreId) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, membres_partenaires: (c.membres_partenaires || c.membresPartenaires || []).filter(m => m.id !== membreId), _modified: true }
        : c
    ));
  };

  // TÂCHES
  const addTache = (committeeId) => {
    if (newTache.trim()) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, taches: [...(c.taches || []), newTache.trim()], _modified: true }
          : c
      ));
      setNewTache('');
    }
  };

  const removeTache = (committeeId, tacheIndex) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, taches: (c.taches || []).filter((_, i) => i !== tacheIndex), _modified: true }
        : c
    ));
  };

  // UPLOAD PV
  const uploadPV = async (committeeId, file) => {
    if (!conventionId) { alert(t('committees.saveFirst')); return; }
    setUploading(prev => ({ ...prev, [committeeId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('comite_id', committeeId);
      const response = await uploadFichier(formData);
      const committee = committees.find(c => c.id === committeeId);
      const dateStr = new Date().toISOString().split('T')[0];
      const newReunion = {
        id: `reunion_${Date.now()}`, date: dateStr,
        pv: { id: response.data.id, nom: file.name, titre: `PV_${committee?.type || 'Comite'}_${dateStr}`, date: dateStr }
      };
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, reunions: [...(c.reunions || []), newReunion], _modified: true }
          : c
      ));
      alert(t('committees.pvUploaded'));
    } catch (error) {
      console.error(error);
      alert(`❌ ${t('common.error')}`);
    } finally { setUploading(prev => ({ ...prev, [committeeId]: false })); }
  };

  const handleDeletePV = async (committeeId, reunionId, fichierId) => {
    if (!window.confirm(t('committees.confirmDeletePv'))) return;
    try {
      if (fichierId) await deleteFichier(fichierId);
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, reunions: (c.reunions || []).filter(r => r.id !== reunionId) }
          : c
      ));
    } catch (error) { console.error(error); alert(t('common.error')); }
  };

  // DROPZONE
  const DropzonePV = ({ committeeId }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => { const file = files[0]; if (file) uploadPV(committeeId, file); },
      accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
      maxFiles: 1,
      disabled: readOnly || uploading[committeeId]
    });

    return (
      <div {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'} ${uploading[committeeId] ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input {...getInputProps()} />
        <Upload className="mx-auto text-gray-400" size={28} />
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          {uploading[committeeId] ? t('committees.uploading') :
           isDragActive ? t('committees.dropPv') : t('committees.dragDropPv')}
        </p>
        <p className="text-xs text-gray-400">PDF, DOC, DOCX</p>
      </div>
    );
  };

  const getMembresUm5 = (c) => c.membres_um5 || c.membresUm5 || [];
  const getMembresPartenaires = (c) => c.membres_partenaires || c.membresPartenaires || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('committees.title')}</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {!readOnly && (
            <>
              <Button onClick={sauvegarderTousLesComites} disabled={saving} className="flex items-center gap-2 text-xs sm:text-sm">
                <Save size={16} />
                <span className="hidden sm:inline">{saving ? t('committees.saving') : t('committees.saveAll')}</span>
                <span className="sm:hidden">{saving ? '...' : t('common.save')}</span>
              </Button>
              <button type="button" onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors">
                <Plus size={16} /> {t('committees.add')}
              </button>
            </>
          )}
        </div>
      </div>

      {committees.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-6 sm:py-8">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{t('committees.none')}</p>
            {!readOnly && <p className="text-xs sm:text-sm mt-2">{t('committees.clickToStart')}</p>}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {committees.map((committee) => (
            <Card key={committee.id} className="overflow-hidden">
              {/* ACCORDÉON HEADER */}
              <div className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 transition-colors gap-2">
                <button type="button" onClick={() => toggleExpand(committee.id)} className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0">
                  {committee.expanded ? <ChevronDown size={20} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />}
                  <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{committee.nom || committee.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                    {committee.type || t('committees.notDefined')}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">({committee.frequence || t('committees.freqNotDefined')})</span>
                  {committee._new && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 flex-shrink-0">{t('common.new')}</span>}
                  {committee._modified && !committee._new && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">{t('common.modified')}</span>}
                </button>
                {!readOnly && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeCommittee(committee.id); }}
                    className="text-red-600 hover:text-red-700 p-1 flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* ACCORDÉON CONTENU */}
              {committee.expanded && (
                <div className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6 border-t border-gray-100 pt-4">
                  
                  {/* MEMBRES UM5 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User size={16} /> {t('committees.membersUM5')}
                      </h4>
                      {!readOnly && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input value={newMembreUm5.nom} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, nom: e.target.value })} placeholder={t('committees.name')} className="text-sm w-24 sm:w-28" />
                          <Input value={newMembreUm5.email} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, email: e.target.value })} placeholder={t('committees.email')} className="text-sm w-32 sm:w-40" />
                          <select value={newMembreUm5.etablissement} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, etablissement: e.target.value })}
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-28 sm:w-32">
                            <option value="">{t('committees.establishment')}</option>
                            {/* ⬇️ DROPDOWN BILINGUE ⬇️ */}
                            {optionsBilingues(etablissementsOptions).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <Button size="sm" onClick={() => addMembreUm5(committee.id)} disabled={!newMembreUm5.nom || !newMembreUm5.email} className="text-xs">{t('common.add')}</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getMembresUm5(committee).map((membre) => (
                        <span key={membre.id} className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs sm:text-sm">
                          <Mail size={12} /> {membre.nom} ({membre.email})
                          {membre.etablissement && <span className="text-xs text-gray-500 hidden sm:inline">- {membre.etablissement}</span>}
                          {!readOnly && <button onClick={() => removeMembreUm5(committee.id, membre.id)} className="text-green-600 hover:text-green-800 ml-1"><X size={14} /></button>}
                        </span>
                      ))}
                      {getMembresUm5(committee).length === 0 && <span className="text-xs sm:text-sm text-gray-400">{t('committees.noMembersUM5')}</span>}
                    </div>
                  </div>

                  {/* MEMBRES PARTENAIRES */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Briefcase size={16} /> {t('committees.membersPartners')}
                      </h4>
                      {!readOnly && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input value={newMembrePartenaire.nom} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, nom: e.target.value })} placeholder={t('committees.name')} className="text-sm w-24 sm:w-28" />
                          <Input value={newMembrePartenaire.email} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, email: e.target.value })} placeholder={t('committees.email')} className="text-sm w-32 sm:w-40" />
                          <Input value={newMembrePartenaire.organisme} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, organisme: e.target.value })} placeholder={t('committees.organization')} className="text-sm w-24 sm:w-32" />
                          <Button size="sm" onClick={() => addMembrePartenaire(committee.id)} disabled={!newMembrePartenaire.nom || !newMembrePartenaire.email} className="text-xs">{t('common.add')}</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getMembresPartenaires(committee).map((membre) => (
                        <span key={membre.id} className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs sm:text-sm">
                          <Mail size={12} /> {membre.nom} ({membre.email})
                          {membre.organisme && <span className="text-xs text-gray-500 hidden sm:inline">- {membre.organisme}</span>}
                          {!readOnly && <button onClick={() => removeMembrePartenaire(committee.id, membre.id)} className="text-orange-600 hover:text-orange-800 ml-1"><X size={14} /></button>}
                        </span>
                      ))}
                      {getMembresPartenaires(committee).length === 0 && <span className="text-xs sm:text-sm text-gray-400">{t('committees.noPartners')}</span>}
                    </div>
                  </div>

                  {/* PROCHAINE RÉUNION */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock size={16} /> {t('committees.nextMeeting')}
                    </h4>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-700">
                        {committee.prochaineReunion || committee.prochaine_reunion ?
                          `📅 ${new Date(committee.prochaineReunion || committee.prochaine_reunion).toLocaleDateString()}` :
                          t('committees.notPlanned')}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">{t('committees.frequency')}: {committee.frequence || t('committees.freqNotDefined')}</p>
                    </div>
                  </div>

                  {/* TÂCHES */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckSquare size={16} /> {t('committees.tasks')} ({committee.taches?.length || 0})
                    </h4>
                    <div className="space-y-1 mt-2">
                      {(committee.taches || []).map((tache, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs sm:text-sm text-gray-700 flex-1">• {tache}</span>
                          {!readOnly && <button type="button" onClick={() => removeTache(committee.id, index)} className="text-red-600 hover:text-red-700 ml-2"><X size={14} /></button>}
                        </div>
                      ))}
                      {(committee.taches || []).length === 0 && <p className="text-xs sm:text-sm text-gray-400">{t('committees.noTasks')}</p>}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input value={newTache} onChange={(e) => setNewTache(e.target.value)} placeholder={t('committees.newTask')} className="text-sm flex-1"
                          onKeyPress={(e) => { if (e.key === 'Enter') addTache(committee.id); }} />
                        <Button size="sm" onClick={() => addTache(committee.id)} disabled={!newTache.trim()} className="text-xs">{t('common.add')}</Button>
                      </div>
                    )}
                  </div>

                  {/* HISTORIQUE RÉUNIONS */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={16} /> {t('committees.meetingHistory')}
                    </h4>
                    {!readOnly && <div className="mb-4"><DropzonePV committeeId={committee.id} /></div>}
                    {(committee.reunions || []).length === 0 ? (
                      <p className="text-xs sm:text-sm text-gray-400">{t('committees.noPv')}</p>
                    ) : (
                      <div className="space-y-2">
                        {(committee.reunions || []).map((reunion) => (
                          <div key={reunion.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <FileText size={18} className="text-blue-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{reunion.pv?.titre || `PV_${reunion.date}`}</p>
                                <p className="text-xs text-gray-500 truncate">{reunion.pv?.nom || t('common.file')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <DownloadButton fichierId={reunion.pv?.id} nomFichier={reunion.pv?.nom} />
                              {!readOnly && (
                                <button className="text-red-600 hover:text-red-700 p-1" onClick={() => handleDeletePV(committee.id, reunion.id, reunion.pv?.id)}>
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* MODAL AJOUT COMITÉ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('committees.add')}</h3>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('committees.type')}</label>
            <select value={newCommittee.type} onChange={(e) => setNewCommittee({ ...newCommittee, type: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <option value="">{t('common.select')}</option>
              {/* ⬇️ DROPDOWN BILINGUE ⬇️ */}
              {optionsBilingues(typeOptions).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('committees.frequency')}</label>
            <select value={newCommittee.frequence} onChange={(e) => setNewCommittee({ ...newCommittee, frequence: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <option value="">{t('common.select')}</option>
              {/* ⬇️ DROPDOWN BILINGUE ⬇️ */}
              {optionsBilingues(frequenceOptions).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={addCommittee} disabled={!newCommittee.type}>{t('common.add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}