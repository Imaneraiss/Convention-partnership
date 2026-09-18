import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Plus, Calendar, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Modal from '../../../components/common/Modal';

export default function AlertsTab({ 
  readOnly, 
  conventionData = {}, 
  onChange,
  initialManualAlerts = []
}) {
  const { t } = useTranslation();
  const [autoAlerts, setAutoAlerts] = useState([]);
  const [manualAlerts, setManualAlerts] = useState(initialManualAlerts || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    titre: '', description: '', date: '', niveau: 'info'
  });

  // ✅ Init alertes manuelles
  useEffect(() => {
    if (initialManualAlerts && initialManualAlerts.length > 0) {
      setManualAlerts(initialManualAlerts);
    }
  }, [initialManualAlerts]);

  // 🔄 Génération alertes auto
  useEffect(() => { generateAutomaticAlerts(); }, [conventionData]);

  // ✅ Sync parent
  useEffect(() => {
    if (onChange) onChange({ auto: autoAlerts, manual: manualAlerts });
  }, [manualAlerts, autoAlerts]);

  const generateAutomaticAlerts = () => {
    const newAlerts = [];
    const today = new Date();

    // 1️⃣ FIN DE CONVENTION
    if (conventionData.date_expiration) {
      const expirationDate = new Date(conventionData.date_expiration);
      const joursRestants = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
      
      if (joursRestants <= 7 && joursRestants > 0) {
        newAlerts.push({
          id: 'auto-fin-convention', type: 'auto', niveau: 'critique',
          titre: `🔴 ${t('alerts.autoEndImminent')}`,
          description: `${t('alerts.expiresIn')} ${joursRestants} ${t('alerts.days')} — ${conventionData.date_expiration}`,
          date: conventionData.date_expiration, active: true, auto: true
        });
      } else if (joursRestants <= 30 && joursRestants > 0) {
        newAlerts.push({
          id: 'auto-fin-convention-warning', type: 'auto', niveau: 'warning',
          titre: `🟡 ${t('alerts.autoEndApproaching')}`,
          description: `${t('alerts.expiresIn')} ${joursRestants} ${t('alerts.days')} — ${conventionData.date_expiration}`,
          date: conventionData.date_expiration, active: true, auto: true
        });
      }
    }

    // 2️⃣ RÉUNION COMITÉ
    if (conventionData.comites?.length > 0) {
      conventionData.comites.forEach(comite => {
        if (comite.prochaineReunion) {
          const reunionDate = new Date(comite.prochaineReunion);
          const joursAvant = Math.ceil((reunionDate - today) / (1000 * 60 * 60 * 24));
          
          if (joursAvant <= 7 && joursAvant > 0) {
            newAlerts.push({
              id: `auto-reunion-${comite.nom}`, type: 'auto', niveau: 'warning',
              titre: `🟡 ${t('alerts.autoMeeting')} ${comite.nom}`,
              description: `${t('alerts.nextMeetingIn')} ${joursAvant} ${t('alerts.days')} (${comite.frequence || t('committees.freqNotDefined')})`,
              date: comite.prochaineReunion, active: true, auto: true
            });
          }
        }
      });
    }

    // 3️⃣ BUDGET
    if (conventionData.budget) {
      const { montantTotal = 0, montantRecu = 0 } = conventionData.budget;
      if (montantTotal > 0) {
        const resteAPayer = montantTotal - montantRecu;
        const pourcentageReste = (resteAPayer / montantTotal) * 100;

        if (pourcentageReste > 50) {
          newAlerts.push({
            id: 'auto-budget-critique', type: 'auto', niveau: 'critique',
            titre: `🔴 ${t('alerts.autoBudgetCritical')}`,
            description: `${pourcentageReste.toFixed(0)}${t('alerts.ofBudgetRemaining')} (${resteAPayer.toLocaleString()} DH)`,
            date: new Date().toISOString().split('T')[0], active: true, auto: true
          });
        } else if (pourcentageReste > 20) {
          newAlerts.push({
            id: 'auto-budget-warning', type: 'auto', niveau: 'warning',
            titre: `🟡 ${t('alerts.autoBudgetPartial')}`,
            description: `${pourcentageReste.toFixed(0)}${t('alerts.ofBudgetRemaining')}`,
            date: new Date().toISOString().split('T')[0], active: true, auto: true
          });
        }
      }
    }

    // 4️⃣ RELANCE DOCUMENT
    if (conventionData.budget?.justificatifs?.length > 0) {
      const dernier = conventionData.budget.justificatifs[conventionData.budget.justificatifs.length - 1];
      if (dernier?.uploadDate) {
        const dateUpload = new Date(dernier.uploadDate);
        const joursDepuis = Math.ceil((today - dateUpload) / (1000 * 60 * 60 * 24));
        
        if (joursDepuis > 30) {
          newAlerts.push({
            id: 'auto-relance-doc', type: 'auto', niveau: 'info',
            titre: `🟢 ${t('alerts.autoDocReminder')}`,
            description: `${t('alerts.lastDocFrom')} ${joursDepuis} ${t('alerts.days')}`,
            date: new Date().toISOString().split('T')[0], active: true, auto: true
          });
        }
      }
    }

    setAutoAlerts(newAlerts);
  };

  // ➕ Ajout alerte manuelle
  const addManualAlert = () => {
    if (newAlert.titre && newAlert.date) {
      const newManualAlerts = [...manualAlerts, {
        ...newAlert,
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'manuel', active: true, auto: false,
        _new: true, _deleted: false, destinataires: []
      }];
      setManualAlerts(newManualAlerts);
      if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
      setNewAlert({ titre: '', description: '', date: '', niveau: 'info' });
      setIsModalOpen(false);
    }
  };

  // ❌ Supprimer
  const deleteAlert = (id) => {
    const newManualAlerts = manualAlerts.map(a =>
      a.id === id ? { ...a, _deleted: true, active: false } : a
    );
    setManualAlerts(newManualAlerts);
    if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
  };

  // 🔄 Toggle
  const toggleAlert = (id) => {
    const newManualAlerts = manualAlerts.map(a =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    setManualAlerts(newManualAlerts);
    if (onChange) onChange({ auto: autoAlerts, manual: newManualAlerts });
  };

  const allAlerts = [...autoAlerts, ...manualAlerts];

  const getNiveauBorder = (niveau) => {
    return niveau === 'critique' ? 'border-l-red-500' :
           niveau === 'warning' ? 'border-l-yellow-500' :
           'border-l-blue-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('alerts.titleTab')}</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{allAlerts.length}</span>
        </div>
        {!readOnly && (
          <button type="button" onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors">
            <Plus size={16} /> {t('alerts.manual')}
          </button>
        )}
      </div>

      {allAlerts.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500 py-6 sm:py-8">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
            <p className="font-medium text-gray-700 text-sm">{t('alerts.allUnderControl')}</p>
            <p className="text-xs sm:text-sm mt-1">{t('alerts.nothingToReport')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {allAlerts.map((alert) => (
            <Card key={alert.id} className={`p-3 sm:p-4 border-l-4 ${getNiveauBorder(alert.niveau)} ${alert.active ? 'opacity-100' : 'opacity-50'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{alert.titre}</span>
                    {alert.auto ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">⚙️ {t('alerts.auto')}</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">✏️ {t('alerts.manual')}</span>
                    )}
                    {!alert.active && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('alerts.disabled')}</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {alert.date ? new Date(alert.date).toLocaleDateString() : t('alerts.notDefined')}
                  </p>
                </div>
                
                {!alert.auto && !readOnly && (
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <button type="button" onClick={() => toggleAlert(alert.id)}
                      className={`text-xs sm:text-sm px-2 py-1 rounded transition-colors ${alert.active ? 'text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200' : 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'}`}>
                      {alert.active ? t('alerts.disable') : t('alerts.enable')}
                    </button>
                    <button type="button" onClick={() => deleteAlert(alert.id)} className="text-red-600 hover:text-red-700 p-1">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {alert.auto && (
                  <div className="text-xs text-gray-400 sm:ml-4 flex-shrink-0">
                    <Clock size={14} className="inline me-1" /> {t('alerts.autoGenerated')}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} /> {t('alerts.manual')}
          </h3>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('alerts.level')}</label>
            <select value={newAlert.niveau} onChange={(e) => setNewAlert({ ...newAlert, niveau: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-700">
              <option value="info">🟢 {t('alerts.info')}</option>
              <option value="warning">🟡 {t('alerts.warning')}</option>
              <option value="critique">🔴 {t('alerts.critical')}</option>
            </select>
          </div>

          <Input label={t('alerts.alertTitle')} value={newAlert.titre}
            onChange={(e) => setNewAlert({ ...newAlert, titre: e.target.value })}
            placeholder={t('alerts.titlePlaceholder')} />

          <Textarea label={t('alerts.description')} value={newAlert.description}
            onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
            rows={3} placeholder={t('alerts.descriptionPlaceholder')} />

          <Input label={t('alerts.reminderDate')} type="date" value={newAlert.date}
            onChange={(e) => setNewAlert({ ...newAlert, date: e.target.value })} />

          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs sm:text-sm text-purple-700 flex items-center gap-2">
              <AlertCircle size={16} /> {t('alerts.visibilityInfo')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={addManualAlert}>{t('alerts.createAlert')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}