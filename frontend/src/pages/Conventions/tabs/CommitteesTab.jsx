import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Download, FileText, Users, Calendar } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';

export default function CommitteesTab({ readOnly, initialCommittees = [], onChange }) {
  const [committees, setCommittees] = useState(initialCommittees || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
  const [newCommittee, setNewCommittee] = useState({
    nom: '',
    frequence: '',
    responsables: []
  });
  const [newResponsable, setNewResponsable] = useState('');
  const [newReunion, setNewReunion] = useState({
    date: '',
    decisions: '',
    pv: null
  });

  // Mettre à jour le parent quand les comités changent
  const updateCommittees = (newCommittees) => {
    setCommittees(newCommittees);
    if (onChange) onChange(newCommittees);
  };

  const toggleExpand = (id) => {
    updateCommittees(committees.map(c => 
      c.id === id ? { ...c, expanded: !c.expanded } : c
    ));
  };

  const addCommittee = () => {
    if (newCommittee.nom) {
      const newComm = {
        ...newCommittee,
        id: Date.now(),
        prochaineReunion: '',
        reunions: [],
        expanded: false
      };
      updateCommittees([...committees, newComm]);
      setNewCommittee({ nom: '', frequence: '', responsables: [] });
      setIsModalOpen(false);
    }
  };

  const addResponsable = (committeeId) => {
    if (newResponsable.trim()) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, responsables: [...(c.responsables || []), newResponsable.trim()] }
          : c
      ));
      setNewResponsable('');
    }
  };

  const removeResponsable = (committeeId, responsable) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, responsables: (c.responsables || []).filter(r => r !== responsable) }
        : c
    ));
  };

  const addReunion = (committeeId) => {
    if (newReunion.date) {
      updateCommittees(committees.map(c =>
        c.id === committeeId
          ? { ...c, reunions: [...(c.reunions || []), { ...newReunion, id: Date.now() }] }
          : c
      ));
      setNewReunion({ date: '', decisions: '', pv: null });
      setSelectedCommitteeId(null);
    }
  };

  const removeReunion = (committeeId, reunionIndex) => {
    updateCommittees(committees.map(c =>
      c.id === committeeId
        ? { ...c, reunions: (c.reunions || []).filter((_, i) => i !== reunionIndex) }
        : c
    ));
  };

  const removeCommittee = (id) => {
    updateCommittees(committees.filter(c => c.id !== id));
  };

  const frequenceOptions = ['Hebdomadaire', 'Mensuelle', 'Bimestrielle', 'Trimestrielle', 'Semestrielle', 'Annuelle'];

  return (
    <div className="space-y-6">
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
              <p className="text-sm mt-2">
                Cliquez sur "Ajouter un comité" pour commencer
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {committees.map((committee) => (
            <Card key={committee.id} className="overflow-hidden">
              {/* En-tête accordéon */}
              <button
                type="button"
                onClick={() => toggleExpand(committee.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {committee.expanded ? (
                    <ChevronDown size={20} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-500" />
                  )}
                  <span className="font-semibold text-gray-900">{committee.nom}</span>
                  <span className="text-sm text-gray-500">({committee.frequence || 'Fréquence non définie'})</span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCommittee(committee.id);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Supprimer
                  </button>
                )}
              </button>

              {/* Contenu accordéon */}
              {committee.expanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
                  {/* Responsables */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Users size={16} />
                        Responsables
                      </h4>
                      {!readOnly && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newResponsable}
                            onChange={(e) => setNewResponsable(e.target.value)}
                            placeholder="Nom du responsable"
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => addResponsable(committee.id)}
                            disabled={!newResponsable.trim()}
                          >
                            Ajouter
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(committee.responsables || []).map((resp, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {resp}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => removeResponsable(committee.id, resp)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {(committee.responsables || []).length === 0 && (
                        <span className="text-sm text-gray-400">Aucun responsable défini</span>
                      )}
                    </div>
                  </div>

                  {/* Prochaine réunion */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      Prochaine réunion
                    </h4>
                    {readOnly ? (
                      <p className="text-sm text-gray-600">
                        {committee.prochaineReunion || 'Non planifiée'}
                      </p>
                    ) : (
                      <Input
                        type="date"
                        value={committee.prochaineReunion || ''}
                        onChange={(e) => {
                          updateCommittees(committees.map(c =>
                            c.id === committee.id
                              ? { ...c, prochaineReunion: e.target.value }
                              : c
                          ));
                        }}
                        className="max-w-xs"
                      />
                    )}
                  </div>

                  {/* Historique des réunions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FileText size={16} />
                        Historique des réunions
                      </h4>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => setSelectedCommitteeId(committee.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          + Ajouter une réunion
                        </button>
                      )}
                    </div>

                    {(committee.reunions || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Aucune réunion enregistrée</p>
                    ) : (
                      <div className="space-y-3">
                        {(committee.reunions || []).map((reunion, index) => (
                          <Card key={index} className="p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">
                                  📅 {reunion.date ? new Date(reunion.date).toLocaleDateString('fr-FR') : 'Date non définie'}
                                </p>
                                <p className="text-sm text-gray-600">{reunion.decisions}</p>
                                {reunion.pv && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <FileText size={14} className="text-blue-600" />
                                    <span className="text-sm text-blue-600">{reunion.pv}</span>
                                    <button
                                      type="button"
                                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                      <Download size={14} />
                                      Télécharger
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => removeReunion(committee.id, index)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Supprimer
                                </button>
                              )}
                            </div>
                            {!readOnly && (
                              <div className="mt-3">
                                <Input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      updateCommittees(committees.map(c =>
                                        c.id === committee.id
                                          ? {
                                              ...c,
                                              reunions: (c.reunions || []).map((r, i) =>
                                                i === index ? { ...r, pv: file.name } : r
                                              )
                                            }
                                          : c
                                      ));
                                    }
                                  }}
                                  accept=".pdf,.doc,.docx"
                                  className="text-sm"
                                />
                              </div>
                            )}
                          </Card>
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

      {/* Modal d'ajout de réunion */}
      {selectedCommitteeId && (
        <Modal isOpen={!!selectedCommitteeId} onClose={() => setSelectedCommitteeId(null)}>
          <div className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Ajouter une réunion</h3>
            
            <Input
              label="Date"
              type="date"
              value={newReunion.date}
              onChange={(e) => setNewReunion({ ...newReunion, date: e.target.value })}
            />
            
            <Textarea
              label="Décisions / Points abordés"
              value={newReunion.decisions}
              onChange={(e) => setNewReunion({ ...newReunion, decisions: e.target.value })}
              rows={3}
              placeholder="Résumé des décisions prises..."
            />
            
            <Input
              label="PV (PDF/DOC)"
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setNewReunion({ ...newReunion, pv: file.name });
                }
              }}
              accept=".pdf,.doc,.docx"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setSelectedCommitteeId(null)}>
                Annuler
              </Button>
              <Button onClick={() => addReunion(selectedCommitteeId)}>
                Ajouter
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'ajout de comité */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Ajouter un comité</h3>
          
          <Input
            label="Nom du comité"
            value={newCommittee.nom}
            onChange={(e) => setNewCommittee({ ...newCommittee, nom: e.target.value })}
            placeholder="Ex: Comité de pilotage"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fréquence des réunions
            </label>
            <select
              value={newCommittee.frequence}
              onChange={(e) => setNewCommittee({ ...newCommittee, frequence: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {frequenceOptions.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addCommittee}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}