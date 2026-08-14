import { useState, useEffect } from 'react';
import { Bell, Plus, Calendar, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';

export default function AlertsTab({ readOnly, conventionData = {}, onChange }) {
  const [autoAlerts, setAutoAlerts] = useState([]);
  const [manualAlerts, setManualAlerts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    titre: '',
    description: '',
    date: '',
    niveau: 'info'
  });

  // 🔄 Génération des alertes automatiques basées sur les données de la convention
  useEffect(() => {
    generateAutomaticAlerts();
  }, [conventionData]);

  const generateAutomaticAlerts = () => {
    const newAlerts = [];
    const today = new Date();

    // 1️⃣ ALERTE FIN DE CONVENTION
    if (conventionData.date_expiration) {
      const expirationDate = new Date(conventionData.date_expiration);
      const joursRestants = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      if (joursRestants <= 7 && joursRestants > 0) {
        newAlerts.push({
          id: 'auto-fin-convention',
          type: 'auto',
          niveau: 'critique',
          titre: '🔴 Fin de convention imminente',
          description: `La convention expire dans ${joursRestants} jours — ${conventionData.date_expiration}`,
          date: conventionData.date_expiration,
          active: true,
          auto: true
        });
      } else if (joursRestants <= 30 && joursRestants > 0) {
        newAlerts.push({
          id: 'auto-fin-convention-warning',
          type: 'auto',
          niveau: 'warning',
          titre: '🟡 Fin de convention approche',
          description: `La convention expire dans ${joursRestants} jours — ${conventionData.date_expiration}`,
          date: conventionData.date_expiration,
          active: true,
          auto: true
        });
      }
    }

    // 2️⃣ ALERTE RÉUNION COMITÉ
    if (conventionData.comites && conventionData.comites.length > 0) {
      conventionData.comites.forEach(comite => {
        if (comite.prochaineReunion) {
          const reunionDate = new Date(comite.prochaineReunion);
          const joursAvantReunion = Math.ceil((reunionDate - today) / (1000 * 60 * 60 * 24));
          
          if (joursAvantReunion <= 7 && joursAvantReunion > 0) {
            newAlerts.push({
              id: `auto-reunion-${comite.nom}`,
              type: 'auto',
              niveau: 'warning',
              titre: `🟡 Réunion ${comite.nom} à planifier`,
              description: `Prochaine réunion dans ${joursAvantReunion} jours (${comite.frequence || 'Fréquence non définie'})`,
              date: comite.prochaineReunion,
              active: true,
              auto: true
            });
          }
        }
      });
    }

    // 3️⃣ ALERTE BUDGET
    if (conventionData.budget) {
      const { montantTotal = 0, montantRecu = 0 } = conventionData.budget;
      if (montantTotal > 0) {
        const resteAPayer = montantTotal - montantRecu;
        const pourcentageReste = (resteAPayer / montantTotal) * 100;

        if (pourcentageReste > 50) {
          newAlerts.push({
            id: 'auto-budget-critique',
            type: 'auto',
            niveau: 'critique',
            titre: '🔴 Budget critique',
            description: `${pourcentageReste.toFixed(0)}% du budget reste à payer (${resteAPayer.toLocaleString()} DH)`,
            date: new Date().toISOString().split('T')[0],
            active: true,
            auto: true
          });
        } else if (pourcentageReste > 20) {
          newAlerts.push({
            id: 'auto-budget-warning',
            type: 'auto',
            niveau: 'warning',
            titre: '🟡 Budget partiellement reçu',
            description: `${pourcentageReste.toFixed(0)}% du budget reste à payer`,
            date: new Date().toISOString().split('T')[0],
            active: true,
            auto: true
          });
        }
      }
    }

    // 4️⃣ ALERTE RELANCE DOCUMENT
    if (conventionData.budget?.justificatifs && conventionData.budget.justificatifs.length > 0) {
      const dernierJustificatif = conventionData.budget.justificatifs[conventionData.budget.justificatifs.length - 1];
      if (dernierJustificatif?.uploadDate) {
        const dateUpload = new Date(dernierJustificatif.uploadDate);
        const joursDepuisUpload = Math.ceil((today - dateUpload) / (1000 * 60 * 60 * 24));
        
        if (joursDepuisUpload > 30) {
          newAlerts.push({
            id: 'auto-relance-doc',
            type: 'auto',
            niveau: 'info',
            titre: '🟢 Relance document',
            description: `Dernier justificatif datant de ${joursDepuisUpload} jours`,
            date: new Date().toISOString().split('T')[0],
            active: true,
            auto: true
          });
        }
      }
    }

    setAutoAlerts(newAlerts);
  };

  // ➕ Ajout d'une alerte manuelle
  const addManualAlert = () => {
    if (newAlert.titre && newAlert.date) {
      const newManualAlerts = [
        ...manualAlerts,
        {
          ...newAlert,
          id: `manuel-${Date.now()}`,
          type: 'manuel',
          active: true,
          auto: false
        }
      ];
      setManualAlerts(newManualAlerts);
      if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
      setNewAlert({ titre: '', description: '', date: '', niveau: 'info' });
      setIsModalOpen(false);
    }
  };

  // ❌ Supprimer une alerte manuelle
  const deleteAlert = (id) => {
    const newManualAlerts = manualAlerts.filter(a => a.id !== id);
    setManualAlerts(newManualAlerts);
    if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
  };

  // 🔄 Activer/Désactiver une alerte manuelle
  const toggleAlert = (id) => {
    const newManualAlerts = manualAlerts.map(a =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    setManualAlerts(newManualAlerts);
    if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
  };

  // 📊 Fusion des alertes automatiques + manuelles
  const allAlerts = [...autoAlerts, ...manualAlerts];

  const getNiveauBorder = (niveau) => {
    return niveau === 'critique' ? 'border-l-red-500' :
           niveau === 'warning' ? 'border-l-yellow-500' :
           'border-l-blue-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Alertes</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {allAlerts.length}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Alerte manuelle
          </button>
        )}
      </div>

      {allAlerts.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-8">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-700">Tout est sous contrôle !</p>
            <p className="text-sm mt-1">Aucune alerte à signaler</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {allAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`p-4 border-l-4 ${getNiveauBorder(alert.niveau)} ${
                alert.active ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{alert.titre}</span>
                    {alert.auto ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ⚙️ Auto
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        ✏️ Manuelle
                      </span>
                    )}
                    {!alert.active && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Désactivée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {alert.date ? new Date(alert.date).toLocaleDateString('fr-FR') : 'Non définie'}
                  </p>
                </div>
                
                {/* Actions uniquement pour les alertes manuelles */}
                {!alert.auto && !readOnly && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => toggleAlert(alert.id)}
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        alert.active 
                          ? 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200'
                          : 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {alert.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {/* Info pour les alertes auto */}
                {alert.auto && (
                  <div className="text-xs text-gray-400 ml-4">
                    <Clock size={14} className="inline mr-1" />
                    Auto-générée
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création d'alerte manuelle */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} />
            Alerte manuelle
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de criticité
            </label>
            <select
              value={newAlert.niveau}
              onChange={(e) => setNewAlert({ ...newAlert, niveau: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="info">🟢 Information</option>
              <option value="warning">🟡 Avertissement</option>
              <option value="critique">🔴 Critique</option>
            </select>
          </div>

          <Input
            label="Titre de l'alerte"
            value={newAlert.titre}
            onChange={(e) => setNewAlert({ ...newAlert, titre: e.target.value })}
            placeholder="Ex: Relancer le partenaire"
          />

          <Textarea
            label="Description"
            value={newAlert.description}
            onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
            rows={3}
            placeholder="Détails de l'alerte..."
          />

          <Input
            label="Date de rappel"
            type="date"
            value={newAlert.date}
            onChange={(e) => setNewAlert({ ...newAlert, date: e.target.value })}
          />

          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700 flex items-center gap-2">
              <AlertCircle size={16} />
              Cette alerte sera visible dans le tableau de bord et pourra être désactivée
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={addManualAlert}>
              Créer l'alerte
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}