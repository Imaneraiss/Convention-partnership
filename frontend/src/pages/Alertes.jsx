import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, AlertCircle, CheckCircle, Clock, Filter, X, Plus, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { 
  getAlertes, getAlertesByConvention, createAlerte, 
  updateAlerte, traiterAlerte, toggleAlerte
} from '../services/alerteService';

export default function Alertes() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    titre: '', description: '', date_rappel: '',
  });

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await getAlertes();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      setAlerts([]);
    } finally { setLoading(false); }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (statutFilter === 'active' && alert.traitee) return false;
    if (statutFilter === 'traitee' && !alert.traitee) return false;
    if (filter === 'fin_convention' && alert.type_alerte !== 'FIN_CONVENTION') return false;
    if (filter === 'reunion' && alert.type_alerte !== 'REUNION_COMITE') return false;
    if (search) {
      const s = search.toLowerCase();
      if (!alert.objet?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const stats = {
    total: alerts.length,
    actives: alerts.filter(a => !a.traitee).length,
    traitees: alerts.filter(a => a.traitee).length,
    fin_convention: alerts.filter(a => a.type_alerte === 'FIN_CONVENTION').length,
    reunion: alerts.filter(a => a.type_alerte === 'REUNION_COMITE').length,
  };

  const handleToggleAlerte = async (id) => {
    try { await toggleAlerte(id); fetchAlerts(); }
    catch (error) { console.error(error); }
  };

  const handleCreateAlerte = async () => {
    if (!formData.titre || !formData.date_rappel) {
      alert(t('alerts.fillRequired'));
      return;
    }
    try {
      await createAlerte({
        objet: formData.titre,
        description: formData.description || '',
        date_declenchement: formData.date_rappel,
        type_alerte: "MANUELLE"
      });
      fetchAlerts();
      setFormData({ titre: '', description: '', date_rappel: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    }
  };

  const handleUpdateAlerte = async (id, data) => {
    try {
      await updateAlerte(id, {
        objet: data.titre, description: data.description,
        date_declenchement: data.date_rappel
      });
      fetchAlerts();
      setEditingAlert(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    }
  };

  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setFormData({
      titre: alert.objet || '',
      description: alert.description || '',
      date_rappel: alert.date_declenchement || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ titre: '', description: '', date_rappel: '' });
    setEditingAlert(null);
  };

  // ✅ Types traduits
  const getTypeLabel = (type) => {
    const labels = {
      'FIN_CONVENTION': `📅 ${t('alerts.typeFinConvention')}`,
      'REUNION_COMITE': `📋 ${t('alerts.typeReunion')}`,
      'MANUELLE': `✏️ ${t('alerts.typeManuelle')}`
    };
    return labels[type] || type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'FIN_CONVENTION': 'bg-red-100 text-red-800',
      'REUNION_COMITE': 'bg-blue-100 text-blue-800',
      'MANUELLE': 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">{t('alerts.loadingAlerts')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl text-gray-500">
            {t('alerts.pageTitle')}
          </h1>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 text-xs sm:text-sm">
          <Plus size={16} />
          <span>{t('alerts.create')}</span>
        </Button>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('alerts.total')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.actives}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('alerts.active')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-gray-400">
          <p className="text-xl sm:text-2xl font-bold text-gray-400">{stats.traitees}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('alerts.treated')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-red-500">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.fin_convention}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('alerts.finConvention')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-blue-500 col-span-2 md:col-span-1">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.reunion}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('alerts.reunions')}</p>
        </Card>
      </div>

      {/* FILTRES */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input placeholder={t('alerts.searchAlert')} value={search}
              onChange={(e) => setSearch(e.target.value)} className="w-full text-sm" />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}
              options={[
                { value: 'all', label: t('alerts.allStatuses') },
                { value: 'active', label: t('alerts.active') },
                { value: 'traitee', label: t('alerts.treated') }
              ]}
              className="w-32 sm:w-40" />
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: t('alerts.allTypes') },
                { value: 'fin_convention', label: t('alerts.finConvention') },
                { value: 'reunion', label: t('alerts.reunions') }
              ]}
              className="w-36 sm:w-44" />
            {(filter !== 'all' || statutFilter !== 'all' || search) && (
              <Button variant="secondary" onClick={() => {
                setFilter('all'); setStatutFilter('all'); setSearch('');
              }}>
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* LISTE */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('alerts.noAlerts')}</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {alerts.length === 0 ? t('alerts.noAlertsYet') : t('alerts.noMatchingAlerts')}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={`p-3 sm:p-4 ${alert.traitee ? 'opacity-60' : 'opacity-100'}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{alert.objet}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${getTypeColor(alert.type_alerte)}`}>
                      {getTypeLabel(alert.type_alerte)}
                    </span>
                    {alert.traitee ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                        {t('alerts.treated')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                        {t('alerts.pending')}
                      </span>
                    )}
                    {alert.convention_id && (
                      <button onClick={() => navigate(`/conventions/${alert.convention_id}`)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1 whitespace-nowrap">
                        <Eye size={12} /> {t('alerts.viewConvention')}
                      </button>
                    )}
                  </div>
                  {alert.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{alert.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    {alert.date_declenchement ? new Date(alert.date_declenchement).toLocaleDateString() : t('alerts.notDefined')}
                  </p>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant={alert.traitee ? "secondary" : "success"}
                    onClick={() => handleToggleAlerte(alert.id)} className="text-xs whitespace-nowrap">
                    {alert.traitee ? ` ${t('alerts.restart')}` : ` ${t('alerts.markTreated')}`}
                  </Button>
                  {alert.type_alerte === 'MANUELLE' && (
                    <Button size="sm" variant="secondary" onClick={() => openEditModal(alert)} className="text-xs">
                      {t('common.edit')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* COMPTEUR */}
      {filteredAlerts.length > 0 && (
        <p className="text-xs sm:text-sm text-gray-500">
          {filteredAlerts.length} {t('alerts.displayed')}
        </p>
      )}

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }}>
        <div className="p-4 sm:p-6 space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} />
            {editingAlert ? t('alerts.editAlert') : t('alerts.newAlert')}
          </h3>

          <Input label={`${t('alerts.alertTitle')} *`} value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            placeholder={t('alerts.titlePlaceholder')} required />

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              {t('alerts.description')}
            </label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('alerts.descriptionPlaceholder')} />
          </div>

          <Input label={`${t('alerts.reminderDate')} *`} type="date" value={formData.date_rappel}
            onChange={(e) => setFormData({ ...formData, date_rappel: e.target.value })} required />

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={editingAlert ? () => handleUpdateAlerte(editingAlert.id, formData) : handleCreateAlerte}>
              {editingAlert ? t('common.save') : t('alerts.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}