import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, AlertCircle, CheckCircle, Clock, Filter, X, Plus, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import { 
  getAlertes, 
  getAlertesByConvention,
  createAlerte, 
  updateAlerte, 
  traiterAlerte 
} from '../services/alerteService';

export default function Alertes() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, auto, manual
  const [niveauFilter, setNiveauFilter] = useState('all'); // all, critique, warning, info
  const [statutFilter, setStatutFilter] = useState('all'); // all, active, traitee
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_rappel: '',
    niveau: 'info',
    convention_id: '',
    type: 'manuel'
  });

  // Récupération des alertes
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await getAlertes();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupération des alertes par convention
  const fetchAlertsByConvention = async (conventionId) => {
    setLoading(true);
    try {
      const response = await getAlertesByConvention(conventionId);
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des alertes
  const filteredAlerts = alerts.filter(alert => {
    // Filtre par statut (active/traitee)
    if (statutFilter === 'active' && alert.est_traitee) return false;
    if (statutFilter === 'traitee' && !alert.est_traitee) return false;
    
    // Filtre par type (auto/manual)
    if (filter === 'auto' && alert.type !== 'auto') return false;
    if (filter === 'manual' && alert.type !== 'manuel') return false;
    
    // Filtre par niveau
    if (niveauFilter !== 'all' && alert.niveau !== niveauFilter) return false;
    
    // Recherche
    if (search) {
      const s = search.toLowerCase();
      const inTitre = alert.titre?.toLowerCase().includes(s);
      const inDescription = alert.description?.toLowerCase().includes(s);
      if (!inTitre && !inDescription) return false;
    }
    
    return true;
  });

  // Statistiques
  const stats = {
    total: alerts.length,
    actives: alerts.filter(a => !a.est_traitee).length,
    traitees: alerts.filter(a => a.est_traitee).length,
    critiques: alerts.filter(a => a.niveau === 'critique' && !a.est_traitee).length,
    warnings: alerts.filter(a => a.niveau === 'warning' && !a.est_traitee).length,
    info: alerts.filter(a => a.niveau === 'info' && !a.est_traitee).length,
    auto: alerts.filter(a => a.type === 'auto').length,
    manual: alerts.filter(a => a.type === 'manuel').length
  };

  // Gestion des alertes
  const handleTraiterAlerte = async (id) => {
    try {
      await traiterAlerte(id);
      fetchAlerts();
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
    }
  };

  const handleUpdateAlerte = async (id, data) => {
    try {
      await updateAlerte(id, data);
      fetchAlerts();
      setEditingAlert(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleCreateAlerte = async () => {
    if (formData.titre && formData.date_rappel) {
      try {
        await createAlerte(formData);
        fetchAlerts();
        setFormData({ 
          titre: '', 
          description: '', 
          date_rappel: '', 
          niveau: 'info', 
          convention_id: '',
          type: 'manuel' 
        });
        setIsModalOpen(false);
      } catch (error) {
        console.error('Erreur lors de la création:', error);
      }
    }
  };

  // Ouvrir modal d'édition
  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setFormData({
      titre: alert.titre,
      description: alert.description || '',
      date_rappel: alert.date_rappel || '',
      niveau: alert.niveau || 'info',
      convention_id: alert.convention_id || '',
      type: alert.type || 'manuel'
    });
    setIsModalOpen(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      date_rappel: '',
      niveau: 'info',
      convention_id: '',
      type: 'manuel'
    });
    setEditingAlert(null);
  };

  const getNiveauColor = (niveau) => {
    const colors = {
      critique: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[niveau] || colors.info;
  };

  const getNiveauBorder = (niveau) => {
    return niveau === 'critique' ? 'border-l-4 border-l-red-500' :
           niveau === 'warning' ? 'border-l-4 border-l-yellow-500' :
           'border-l-4 border-l-blue-500';
  };

  const getNiveauIcon = (niveau) => {
    return niveau === 'critique' ? '🔴' :
           niveau === 'warning' ? '🟡' :
           '🟢';
  };

  const getNiveauLabel = (niveau) => {
    return niveau === 'critique' ? 'Critique' :
           niveau === 'warning' ? 'Avertissement' :
           'Information';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement des alertes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={28} className="text-blue-600" />
            Alertes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez toutes vos alertes en un seul endroit
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className='flex items-center'>
          <Plus size={16} className="mr-2" />
          <span>Créer une alerte</span>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total alertes</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
          <p className="text-sm text-gray-500"> Actives</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-gray-400">
          <p className="text-2xl font-bold text-gray-400">{stats.traitees}</p>
          <p className="text-sm text-gray-500"> Traitées</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.critiques}</p>
          <p className="text-sm text-gray-500"> Critiques</p>
        </Card>
      </div>

      {/* Deuxième ligne de stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
          <p className="text-sm text-gray-500"> Avertissements</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          <p className="text-sm text-gray-500"> Informations</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-600">{stats.auto}</p>
          <p className="text-sm text-gray-500"> Automatiques</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-600">{stats.manual}</p>
          <p className="text-sm text-gray-500"> Manuelles</p>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une alerte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              options={[
                { value: 'all', label: ' Tous statuts' },
                { value: 'active', label: '  Actives' },
                { value: 'traitee', label: ' Traitées' }
              ]}
              className="w-40"
            />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: '  Tous types' },
                { value: 'auto', label: ' Automatiques' },
                { value: 'manual', label: ' Manuelles' }
              ]}
              className="w-40"
            />
            <Select
              value={niveauFilter}
              onChange={(e) => setNiveauFilter(e.target.value)}
              options={[
                { value: 'all', label: ' Tous niveaux' },
                { value: 'critique', label: ' Critique' },
                { value: 'warning', label: ' Warning' },
                { value: 'info', label: ' Info' }
              ]}
              className="w-44"
            />
            {(filter !== 'all' || niveauFilter !== 'all' || statutFilter !== 'all' || search) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setFilter('all');
                  setNiveauFilter('all');
                  setStatutFilter('all');
                  setSearch('');
                }}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des alertes */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
            <h3 className="text-lg font-medium text-gray-900">Aucune alerte</h3>
            <p className="text-sm text-gray-500 mt-1">
              {alerts.length === 0 
                ? 'Aucune alerte n\'a été créée pour le moment.'
                : 'Aucune alerte ne correspond à vos filtres.'}
            </p>
            
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`p-4 ${getNiveauBorder(alert.niveau)} ${
                alert.est_traitee ? 'opacity-60' : 'opacity-100'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{getNiveauIcon(alert.niveau)}</span>
                    <span className="font-medium text-gray-900">{alert.titre}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getNiveauColor(alert.niveau)}`}>
                      {getNiveauLabel(alert.niveau)}
                    </span>
                    {alert.type === 'auto' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ⚙️ Auto
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        ✏️ Manuelle
                      </span>
                    )}
                    {alert.est_traitee ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Traitée
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        ⏳ En attente
                      </span>
                    )}
                    {alert.convention_id && (
                      <button
                        onClick={() => navigate(`/conventions/${alert.convention_id}`)}
                        className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                      >
                        <Eye size={12} />
                        Voir convention
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {alert.date_rappel ? new Date(alert.date_rappel).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) : 'Non définie'}
                  </p>
                  {alert.date_traitement && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={12} />
                      Traitée le : {new Date(alert.date_traitement).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!alert.est_traitee && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleTraiterAlerte(alert.id)}
                    >
                      Marquer traitée
                    </Button>
                  )}
                  {/* Seules les alertes manuelles peuvent être modifiées */}
                  {alert.type === 'manuel' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(alert)}
                    >
                      Modifier
                    </Button>
                  )}
                  {alert.type === 'auto' && (
                    <span className="text-xs text-gray-400 italic">
                      (générée auto)
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compteur */}
      {filteredAlerts.length > 0 && (
        <p className="text-sm text-gray-500">
          {filteredAlerts.length} alerte{filteredAlerts.length > 1 ? 's' : ''} affichée{filteredAlerts.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Modal de création/édition d'alerte */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={20} />
            {editingAlert ? 'Modifier l\'alerte' : 'Nouvelle alerte'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de criticité
            </label>
            <select
              value={formData.niveau}
              onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="info">🟢 Information</option>
              <option value="warning">🟡 Avertissement</option>
              <option value="critique">🔴 Critique</option>
            </select>
          </div>

          <Input
            label="Titre de l'alerte"
            value={formData.titre}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            placeholder="Ex: Relancer le partenaire"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Détails de l'alerte..."
            />
          </div>

          <Input
            label="Date de rappel"
            type="date"
            value={formData.date_rappel}
            onChange={(e) => setFormData({ ...formData, date_rappel: e.target.value })}
            required
          />

          <Input
            label="ID de la convention (optionnel)"
            type="number"
            value={formData.convention_id}
            onChange={(e) => setFormData({ ...formData, convention_id: e.target.value })}
            placeholder="Ex: 123"
          />

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle size={16} />
              Cette alerte sera visible dans votre tableau de bord et pourra être marquée comme traitée
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={editingAlert ? () => handleUpdateAlerte(editingAlert.id, formData) : handleCreateAlerte}>
              {editingAlert ? 'Mettre à jour' : 'Créer l\'alerte'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}