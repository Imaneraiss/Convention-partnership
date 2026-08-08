import { useState, useCallback , useEffect} from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Download, 
  FileText, 
  Users, 
  User,
  Mail,
  Briefcase,
  CheckSquare,
  Clock,
  Upload,
  Trash2
} from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';
import { TYPES_COMITE, FREQUENCES_REUNION } from '../../../utils/constants';
import { uploadFichier, deleteFichier } from '../../../services/fichierService';

// ✅ Jours fériés au Maroc (à adapter selon tes besoins)
const JOURS_FERIES = [
  '2026-01-01', // Nouvel An
  '2026-01-11', // Manifeste de l'Indépendance
  '2026-05-01', // Fête du Travail
  '2026-07-30', // Fête du Trône
  '2026-08-14', // Oued Ed-Dahab
  '2026-08-20', // Révolution du Roi et du Peuple
  '2026-08-21', // Fête de la Jeunesse
  '2026-11-06', // Marche Verde
  '2026-11-18', // Fête de l'Indépendance
];

export default function CommitteesTab({ 
  readOnly, 
  initialCommittees = [], 
  onChange,
  conventionId,
  extractedTaches = [],
  dateSignature = null 
}) {
  const [committees, setCommittees] = useState(initialCommittees || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState({});
  const [newCommittee, setNewCommittee] = useState({
    type: '',
    frequence: '',
    membresUm5: [],
    membresPartenaires: [],
    taches: []
  });
  
  const [newMembreUm5, setNewMembreUm5] = useState({ nom: '', email: '', etablissement: '' });
  const [newMembrePartenaire, setNewMembrePartenaire] = useState({ nom: '', email: '', organisme: '' });
  const [newTache, setNewTache] = useState('');

  const frequenceOptions = FREQUENCES_REUNION || ['Hebdomadaire', 'Mensuelle', 'Bimestrielle', 'Trimestrielle', 'Semestrielle', 'Annuelle'];
  const typeOptions = TYPES_COMITE || ['PILOTAGE', 'SUIVI', 'TECHNIQUE', 'SCIENTIFIQUE'];
  const etablissementsOptions = ['UM5R', 'FLSH', 'FMD', 'FMPH', 'ENS', 'ENSAM', 'ENSET', 'EST', 'FSR', 'FSJES AGDAL', 'FSJES SOUISSI', 'FSJES SALE', 'EST SALE', 'EMI', 'ENSIAS', 'IS'];

  useEffect(() => {
    if (initialCommittees && initialCommittees.length > 0 && dateSignature) {
      const updatedCommittees = initialCommittees.map(committee => {
        if (!committee.date_debut) {
          return {
            ...committee,
            date_debut: dateSignature,
            prochaineReunion: calculerProchaineReunion(dateSignature, committee.frequence)
          };
        }
        if (committee.date_debut && !committee.prochaineReunion) {
          return {
            ...committee,
            prochaineReunion: calculerProchaineReunion(committee.date_debut, committee.frequence)
          };
        }
        return committee;
      });
      setCommittees(updatedCommittees);
    }
  }, [initialCommittees, dateSignature]);
  
  const updateCommittees = (newCommittees) => {
    setCommittees(newCommittees);
    if (onChange) onChange(newCommittees);
  };

  const toggleExpand = (id) => {
    updateCommittees(committees.map(c => 
      c.id === id ? { ...c, expanded: !c.expanded } : c
    ));
  };

  // ✅ Vérifier si une date est un jour férié
  const estJourFerie = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return JOURS_FERIES.includes(dateStr);
  };

  // ✅ Vérifier si une date est un week-end
  const estWeekend = (date) => {
    const jour = date.getDay();
    return jour === 5 || jour === 6; // Vendredi (5) ou Samedi (6)
  };

  // ✅ Trouver le prochain jour ouvrable
  const prochainJourOuvrable = (date) => {
    const newDate = new Date(date);
    while (estWeekend(newDate) || estJourFerie(newDate)) {
      newDate.setDate(newDate.getDate() + 1);
    }
    return newDate;
  };

  // ✅ Calcul de la prochaine réunion avec gestion des week-ends et jours fériés
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
    
    const dateFinale = prochainJourOuvrable(date);
    return dateFinale.toISOString().split('T')[0];
  };

  // ─── COMITÉ ───
  const addCommittee = () => {
    if (newCommittee.type) {
      const dateDebut = dateSignature || new Date().toISOString().split('T')[0];
      
      const newComm = {
        ...newCommittee,
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // ✅ ID temporaire
        nom: newCommittee.type,
        date_debut: dateDebut,
        prochaineReunion: calculerProchaineReunion(dateDebut, newCommittee.frequence),
        reunions: [],
        expanded: false,
        taches: extractedTaches.length > 0 ? extractedTaches.map(t => ({ id: Date.now() + Math.random(), description: t })) : [],
        _new: true // ✅ Marquer comme nouveau
      };
      updateCommittees([...committees, newComm]);
      setNewCommittee({ type: '', frequence: '', membresUm5: [], membresPartenaires: [], taches: [] });
      setIsModalOpen(false);
    }
  };

  const removeCommittee = (id) => {
    updateCommittees(committees.filter(c => c.id !== id));
  };

  // ─── MEMBRES UM5 ───
  const addMembreUm5 = (committeeId) => {
    if (newMembreUm5.nom && newMembreUm5.email) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, membresUm5: [...(c.membresUm5 || []), { ...newMembreUm5, id: Date.now() }] }
          : c
      ));
      setNewMembreUm5({ nom: '', email: '', etablissement: '' });
    }
  };

  const removeMembreUm5 = (committeeId, membreId) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, membresUm5: (c.membresUm5 || []).filter(m => m.id !== membreId) }
        : c
    ));
  };

  // ─── MEMBRES PARTENAIRES ───
  const addMembrePartenaire = (committeeId) => {
    if (newMembrePartenaire.nom && newMembrePartenaire.email) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, membresPartenaires: [...(c.membresPartenaires || []), { ...newMembrePartenaire, id: Date.now() }] }
          : c
      ));
      setNewMembrePartenaire({ nom: '', email: '', organisme: '' });
    }
  };

  const removeMembrePartenaire = (committeeId, membreId) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, membresPartenaires: (c.membresPartenaires || []).filter(m => m.id !== membreId) }
        : c
    ));
  };

  // ─── TÂCHES ───
  const addTache = (committeeId) => {
    if (newTache.trim()) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, taches: [...(c.taches || []), newTache.trim()] }
          : c
      ));
      setNewTache('');
    }
  };

  const removeTache = (committeeId, tacheIndex) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { 
            ...c, 
            taches: (c.taches || []).filter((_, i) => i !== tacheIndex) 
          }
        : c
    ));
  };

  // ─── UPLOAD PV ───
  const uploadPV = async (committeeId, file) => {
    if (!conventionId) {
      alert('Veuillez d\'abord enregistrer la convention avant d\'uploader des PV.');
      return;
    }

    setUploading(prev => ({ ...prev, [committeeId]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('convention_id', conventionId);
      
      const response = await uploadFichier(formData);
      
      const committee = committees.find(c => c.id === committeeId);
      const dateStr = new Date().toISOString().split('T')[0];
      const titre = `PV_${committee?.type || 'Comite'}_${dateStr}`;
      
      const newReunion = {
        id: Date.now(),
        date: dateStr,
        pv: {
          id: response.data.id,
          nom: file.name,
          titre: titre,
          date: dateStr
        }
      };
      
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, reunions: [...(c.reunions || []), newReunion] }
          : c
      ));
      
    } catch (error) {
      console.error('Erreur upload:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Erreur inconnue';
      alert(`Erreur lors de l'upload du PV: ${errorMsg}`);
    } finally {
      setUploading(prev => ({ ...prev, [committeeId]: false }));
    }
  };

  const handleDeletePV = async (committeeId, reunionId, fichierId) => {
    if (!window.confirm('Supprimer ce PV ?')) return;
    
    try {
      if (fichierId) {
        await deleteFichier(fichierId);
      }
      
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, reunions: (c.reunions || []).filter(r => r.id !== reunionId) }
          : c
      ));
      
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression du PV');
    }
  };

  // ─── DROPZONE ───
  const DropzonePV = ({ committeeId }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => {
        const file = files[0];
        if (file) uploadPV(committeeId, file);
      },
      accept: {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      },
      maxFiles: 1,
      disabled: readOnly || uploading[committeeId]
    });

    return (
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading[committeeId] ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto text-gray-400" size={32} />
        <p className="mt-2 text-sm text-gray-600">
          {uploading[committeeId] ? 'Upload en cours...' : 
           isDragActive ? 'Déposez le PV ici' : 'Glissez-déposez un PV'}
        </p>
        <p className="text-xs text-gray-400">PDF, DOC, DOCX</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Comités</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Ajouter un comité
          </button>
        )}
      </div>

      {committees.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-8">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p>Aucun comité configuré</p>
            {!readOnly && (
              <p className="text-sm mt-2">Cliquez sur "Ajouter un comité" pour commencer</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {committees.map((committee) => (
            <Card key={committee.id} className="overflow-hidden">
              {/* ✅ ACCORDÉON HEADER - CORRIGÉ */}
              <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleExpand(committee.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {committee.expanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                  <span className="font-semibold text-gray-900">{committee.nom}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {committee.type || 'Non défini'}
                  </span>
                  <span className="text-sm text-gray-500">({committee.frequence || 'Fréquence non définie'})</span>
                </button>
                
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      removeCommittee(committee.id); 
                    }}
                    className="text-red-600 hover:text-red-700 text-sm ml-4 flex-shrink-0"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              {/* ACCORDÉON CONTENU */}
              {committee.expanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
                  
                  {/* MEMBRES UM5 */}
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User size={16} /> Membres UM5 / Établissements
                      </h4>
                      {!readOnly && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input value={newMembreUm5.nom} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, nom: e.target.value })} placeholder="Nom" className="text-sm w-28" />
                          <Input value={newMembreUm5.email} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, email: e.target.value })} placeholder="Email" className="text-sm w-32" />
                          <select value={newMembreUm5.etablissement} onChange={(e) => setNewMembreUm5({ ...newMembreUm5, etablissement: e.target.value })} className="text-sm border border-gray-300 rounded-lg px-2 py-1 w-28">
                            <option value="">Établissement</option>
                            {etablissementsOptions.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                          <Button size="sm" onClick={() => addMembreUm5(committee.id)} disabled={!newMembreUm5.nom || !newMembreUm5.email}>Ajouter</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(committee.membresUm5 || []).map((membre) => (
                        <span key={membre.id} className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                          <Mail size={12} /> {membre.nom} ({membre.email})
                          {membre.etablissement && <span className="text-xs text-gray-500">- {membre.etablissement}</span>}
                          {!readOnly && <button onClick={() => removeMembreUm5(committee.id, membre.id)} className="text-green-600 hover:text-green-800">×</button>}
                        </span>
                      ))}
                      {(committee.membresUm5 || []).length === 0 && <span className="text-sm text-gray-400">Aucun membre UM5</span>}
                    </div>
                  </div>

                  {/* MEMBRES PARTENAIRES */}
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Briefcase size={16} /> Membres Partenaires
                      </h4>
                      {!readOnly && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input value={newMembrePartenaire.nom} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, nom: e.target.value })} placeholder="Nom" className="text-sm w-28" />
                          <Input value={newMembrePartenaire.email} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, email: e.target.value })} placeholder="Email" className="text-sm w-32" />
                          <Input value={newMembrePartenaire.organisme} onChange={(e) => setNewMembrePartenaire({ ...newMembrePartenaire, organisme: e.target.value })} placeholder="Organisme" className="text-sm w-28" />
                          <Button size="sm" onClick={() => addMembrePartenaire(committee.id)} disabled={!newMembrePartenaire.nom || !newMembrePartenaire.email}>Ajouter</Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(committee.membresPartenaires || []).map((membre) => (
                        <span key={membre.id} className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                          <Mail size={12} /> {membre.nom} ({membre.email})
                          {membre.organisme && <span className="text-xs text-gray-500">- {membre.organisme}</span>}
                          {!readOnly && <button onClick={() => removeMembrePartenaire(committee.id, membre.id)} className="text-orange-600 hover:text-orange-800">×</button>}
                        </span>
                      ))}
                      {(committee.membresPartenaires || []).length === 0 && <span className="text-sm text-gray-400">Aucun membre partenaire</span>}
                    </div>
                  </div>

                  {/* PROCHAINE RÉUNION */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock size={16} /> Prochaine réunion
                    </h4>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {committee.prochaineReunion ? `📅 ${new Date(committee.prochaineReunion).toLocaleDateString('fr-FR')}` : 'Non planifiée'}
                      </p>
                      <p className="text-xs text-blue-500 mt-1">Fréquence: {committee.frequence || 'Non définie'}</p>
                      {committee.prochaineReunion && (
                        <p className="text-xs text-blue-400 mt-2 italic">
                          🔔 Alerte automatique 7 jours avant
                        </p>
                      )}
                    </div>
                  </div>

                  {/* TÂCHES */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CheckSquare size={16} /> Tâches ({committee.taches?.length || 0})
                    </h4>

                    <div className="space-y-1 mt-2">
                      {(committee.taches || []).map((tache, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 flex-1">• {tache}</span>
                          {!readOnly && (
                            <button 
                              type="button"
                              onClick={() => removeTache(committee.id, index)} 
                              className="text-red-600 hover:text-red-700 text-sm ml-2"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {(committee.taches || []).length === 0 && (
                        <p className="text-sm text-gray-400">Aucune tâche définie</p>
                      )}
                    </div>
                  </div>

                  {/* HISTORIQUE RÉUNIONS AVEC DRAG & DROP */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <FileText size={16} /> Historique des réunions
                    </h4>

                    {!readOnly && (
                      <div className="mb-4">
                        <DropzonePV committeeId={committee.id} />
                      </div>
                    )}

                    {(committee.reunions || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Aucun PV uploadé</p>
                    ) : (
                      <div className="space-y-2">
                        {(committee.reunions || []).map((reunion) => (
                          <div key={reunion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText size={18} className="text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {reunion.pv?.titre || `PV_${reunion.date}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {reunion.pv?.nom || 'Fichier'} 
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                className="text-blue-600 hover:text-blue-700 p-1"
                                onClick={() => {
                                  console.log('Télécharger:', reunion.pv);
                                }}
                              >
                                <Download size={16} />
                              </button>
                              {!readOnly && (
                                <button 
                                  className="text-red-600 hover:text-red-700 p-1"
                                  onClick={() => handleDeletePV(committee.id, reunion.id, reunion.pv?.id)}
                                >
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
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Ajouter un comité</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de comité</label>
            <select value={newCommittee.type} onChange={(e) => setNewCommittee({ ...newCommittee, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {typeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence des réunions</label>
            <select value={newCommittee.frequence} onChange={(e) => setNewCommittee({ ...newCommittee, frequence: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {frequenceOptions.map(freq => <option key={freq} value={freq}>{freq}</option>)}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={addCommittee}>Ajouter</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}