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
  traiterAlerte,
  toggleAlerte
} from '../services/alerteService';

export default function Alertes() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statutFilter, setStatutFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_rappel: '',
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

  // Filtrage des alertes
  const filteredAlerts = alerts.filter(alert => {
    if (statutFilter === 'active' && alert.traitee) return false;
    if (statutFilter === 'traitee' && !alert.traitee) return false;
    
    if (filter === 'fin_convention' && alert.type_alerte !== 'FIN_CONVENTION') return false;
    if (filter === 'reunion' && alert.type_alerte !== 'REUNION_COMITE') return false;
    
    if (search) {
      const s = search.toLowerCase();
      const inObjet = alert.objet?.toLowerCase().includes(s);
      if (!inObjet) return false;
    }
    
    return true;
  });

  // Statistiques
  const stats = {
    total: alerts.length,
    actives: alerts.filter(a => !a.traitee).length,
    traitees: alerts.filter(a => a.traitee).length,
    fin_convention: alerts.filter(a => a.type_alerte === 'FIN_CONVENTION').length,
    reunion: alerts.filter(a => a.type_alerte === 'REUNION_COMITE').length,
  };

  // ✅ TOGGLE - Marquer / Démarrer une alerte
  const handleToggleAlerte = async (id) => {
    try {
      await toggleAlerte(id);
      fetchAlerts();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  // ✅ CREATE - Créer une alerte
  const handleCreateAlerte = async () => {
    if (!formData.titre || !formData.date_rappel) {
      alert('Veuillez remplir le titre et la date de rappel');
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
      setFormData({ 
        titre: '', 
        description: '', 
        date_rappel: '' 
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l\'alerte');
    }
  };

  // ✅ UPDATE - Modifier une alerte
  const handleUpdateAlerte = async (id, data) => {
    try {
      await updateAlerte(id, {
        objet: data.titre,
        description: data.description,
        date_declenchement: data.date_rappel
      });
      fetchAlerts();
      setEditingAlert(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de l\'alerte');
    }
  };

  // Ouvrir modal d'édition
  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setFormData({
      titre: alert.objet || '',
      description: alert.description || '',
      date_rappel: alert.date_declenchement || '',
    });
    setIsModalOpen(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      date_rappel: '',
    });
    setEditingAlert(null);
  };

  const getTypeLabel = (type) => {
    const labels = {
      'FIN_CONVENTION': ' Fin de convention',
      'REUNION_COMITE': ' Réunion',
      'MANUELLE': ' Manuelle'
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
        <div className="text-gray-500">Chargement des alertes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-500 flex items-center gap-2">
            Gérez toutes vos alertes en un seul endroit
          </h1>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className='flex items-center'>
          <Plus size={16} className="mr-2" />
          <span>Créer une alerte</span>
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total alertes</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.actives}</p>
          <p className="text-sm text-gray-500">Actives</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-gray-400">
          <p className="text-2xl font-bold text-gray-400">{stats.traitees}</p>
          <p className="text-sm text-gray-500">Traitées</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.fin_convention}</p>
          <p className="text-sm text-gray-500">Fin de convention</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.reunion}</p>
          <p className="text-sm text-gray-500">Réunions</p>
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
                { value: 'all', label: 'Tous statuts' },
                { value: 'active', label: 'Actives' },
                { value: 'traitee', label: 'Traitées' }
              ]}
              className="w-40"
            />
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'fin_convention', label: 'Fin de convention' },
                { value: 'reunion', label: 'Réunion' }
              ]}
              className="w-44"
            />
            {(filter !== 'all' || statutFilter !== 'all' || search) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setFilter('all');
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
              className={`p-4 ${alert.traitee ? 'opacity-60' : 'opacity-100'}`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{alert.objet}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(alert.type_alerte)}`}>
                      {getTypeLabel(alert.type_alerte)}
                    </span>
                    {alert.traitee ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Traitée
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        En attente
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
                  {alert.description && (
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {alert.date_declenchement ? new Date(alert.date_declenchement).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }) : 'Non définie'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant={alert.traitee ? "secondary" : "success"}
                    onClick={() => handleToggleAlerte(alert.id)}
                  >
                    {alert.traitee ? ' Démarrer' : ' Marquer traitée'}
                  </Button>
                  {alert.type_alerte === 'MANUELLE' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditModal(alert)}
                    >
                      Modifier
                    </Button>
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

          <Input
            label="Titre de l'alerte *"
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
            label="Date de rappel *"
            type="date"
            value={formData.date_rappel}
            onChange={(e) => setFormData({ ...formData, date_rappel: e.target.value })}
            required
          />

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