import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Calendar, 
  User, 
  X, 
  RefreshCw
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { getHistorique, getHistoriqueByUser } from '../services/historiqueService';

export default function Historique() {
  const navigate = useNavigate();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const response = await getHistorique();
      const normalizedData = (response.data || []).map(item => ({
        ...item,
        action: item.action || item.type_action || 'autre',
        type_action: item.type_action || item.action || 'autre'
      }));
      setHistorique(normalizedData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoriqueByUser = async (userId) => {
    setLoading(true);
    try {
      const response = await getHistoriqueByUser(userId);
      const normalizedData = (response.data || []).map(item => ({
        ...item,
        action: item.action || item.type_action || 'autre',
        type_action: item.type_action || item.action || 'autre'
      }));
      setHistorique(normalizedData);
    } catch (error) {
      console.error(' Erreur lors du chargement de l\'historique:', error);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistorique = historique.filter(item => {
    const action = item.action || item.type_action || '';
    console.log(`🔍 Action: ${item.action}, Convention: ${item.convention_intitule || '❌ MANQUANT'}`);
    
    if (typeFilter !== 'all' && action !== typeFilter) return false;
    if (dateDebut && item.date_action < dateDebut) return false;
    if (dateFin && item.date_action > dateFin) return false;
    if (search) {
      const s = search.toLowerCase();
      const inDescription = item.description?.toLowerCase().includes(s);
      const inUtilisateur = item.utilisateur_nom?.toLowerCase().includes(s) || 
                          item.utilisateur_email?.toLowerCase().includes(s);
      const inConvention = item.convention_intitule?.toLowerCase().includes(s);
      if (!inDescription && !inUtilisateur && !inConvention) return false;
    }
    return true;
  });

  const stats = {
    total: historique.length,
    creations: historique.filter(h => 
      (h.action === 'creation' || h.type_action === 'creation')
    ).length,
    modifications: historique.filter(h => 
      (h.action === 'modification' || h.type_action === 'modification')
    ).length,
    suppressions: historique.filter(h => 
      (h.action === 'suppression' || h.type_action === 'suppression')
    ).length,
    autres: historique.filter(h => 
      !['creation', 'modification', 'suppression', 'upload'].includes(h.action || h.type_action)
    ).length
  };

  const getActionColor = (type) => {
    const colors = {
      creation: 'bg-green-100 text-green-800',
      modification: 'bg-blue-100 text-blue-800',
      suppression: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getActionLabel = (type) => {
    const labels = {
      creation: 'Création',
      modification: 'Modification',
      suppression: 'Suppression'
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement de l'historique...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-500 flex items-center gap-2">
            Suivez toutes les actions effectuées sur les conventions
          </h1>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total actions</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.creations}</p>
          <p className="text-sm text-gray-500">Créations</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600">{stats.modifications}</p>
          <p className="text-sm text-gray-500">Modifications</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.suppressions}</p>
          <p className="text-sm text-gray-500">Suppressions</p>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'creation', label: 'Création' },
                { value: 'modification', label: 'Modification' },
                { value: 'suppression', label: 'Suppression' }
              ]}
              className="w-44"
            />
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              placeholder="Date début"
              className="w-36"
            />
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              placeholder="Date fin"
              className="w-36"
            />
            {(typeFilter !== 'all' || dateDebut || dateFin || search) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTypeFilter('all');
                  setDateDebut('');
                  setDateFin('');
                  setSearch('');
                }}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Liste de l'historique */}
      {filteredHistorique.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Aucune action</h3>
            <p className="text-sm text-gray-500 mt-1">
              {historique.length === 0 
                ? 'Aucune action n\'a été enregistrée pour le moment.'
                : 'Aucune action ne correspond à vos filtres.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistorique.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex flex-col gap-2">
                  {/* Ligne 1: Type + Description */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getActionColor(item.action || item.type_action)}`}>
                      {getActionLabel(item.action || item.type_action)}
                    </span>
                    <span className="font-medium text-gray-900">
                      {item.description}
                    </span>
                  </div>

                  {/* Ligne 2: Convention (si présente) */}
                  {item.convention_intitule && (
                    <div className="text-sm text-blue-600">
                      📄 {item.convention_intitule}
                    </div>
                  )}

                  {/* Ligne 3: Utilisateur + Date */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {item.utilisateur_nom || 'Utilisateur inconnu'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(item.date_action)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Compteur */}
      {filteredHistorique.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {filteredHistorique.length} action{filteredHistorique.length > 1 ? 's' : ''} affichée{filteredHistorique.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}