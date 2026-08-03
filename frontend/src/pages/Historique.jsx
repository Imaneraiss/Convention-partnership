import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  X, 
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight
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
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchHistorique();
  }, []);

  const fetchHistorique = async () => {
    setLoading(true);
    try {
      const response = await getHistorique();
      setHistorique(response.data || []);
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
      setHistorique(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setHistorique([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredHistorique = historique.filter(item => {
    if (typeFilter !== 'all' && item.type_action !== typeFilter) return false;
    if (dateDebut && item.date_action < dateDebut) return false;
    if (dateFin && item.date_action > dateFin) return false;
    if (search) {
      const s = search.toLowerCase();
      const inDescription = item.description?.toLowerCase().includes(s);
      const inUtilisateur = item.utilisateur_nom?.toLowerCase().includes(s) || 
                           item.utilisateur_email?.toLowerCase().includes(s);
      const inConvention = item.convention_intitule?.toLowerCase().includes(s);
      const inDetails = item.details ? JSON.stringify(item.details).toLowerCase().includes(s) : false;
      if (!inDescription && !inUtilisateur && !inConvention && !inDetails) return false;
    }
    return true;
  });

  const stats = {
    total: historique.length,
    creations: historique.filter(h => h.type_action === 'creation').length,
    modifications: historique.filter(h => h.type_action === 'modification').length,
    suppressions: historique.filter(h => h.type_action === 'suppression').length,
    uploads: historique.filter(h => h.type_action === 'upload').length,
    autres: historique.filter(h => !['creation', 'modification', 'suppression', 'upload'].includes(h.type_action)).length
  };

  const getActionColor = (type) => {
    const colors = {
      creation: 'bg-green-100 text-green-800',
      modification: 'bg-blue-100 text-blue-800',
      suppression: 'bg-red-100 text-red-800',
      upload: 'bg-purple-100 text-purple-800',
      download: 'bg-indigo-100 text-indigo-800',
      consultation: 'bg-gray-100 text-gray-800',
      traitement: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getActionLabel = (type) => {
    const labels = {
      creation: 'Création',
      modification: 'Modification',
      suppression: 'Suppression',
      upload: 'Upload',
      download: 'Téléchargement',
      consultation: 'Consultation',
      traitement: 'Traitement'
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

  const renderDetails = (item) => {
    if (!item.details) return null;
    
    try {
      const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
      
      if (item.type_action === 'modification') {
        return (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Champs modifiés :</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-600">{key}:</span>
                  {Array.isArray(value) ? (
                    <span className="text-gray-800">{value.join(', ')}</span>
                  ) : (
                    <span className="text-gray-800">{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      if (item.type_action === 'creation') {
        return (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Informations créées :</p>
            <div className="bg-green-50 rounded-lg p-3 space-y-1">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      if (item.type_action === 'upload') {
        return (
          <div className="mt-3">
            <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
              <span className="text-sm text-gray-700">
                Fichier: {details.fichier_nom || 'Document'}
              </span>
              {details.fichier_taille && (
                <span className="text-xs text-gray-500">
                  ({(details.fichier_taille / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>
          </div>
        );
      }
      
      return null;
    } catch (e) {
      return (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {typeof item.details === 'string' ? item.details : JSON.stringify(item.details, null, 2)}
          </pre>
        </div>
      );
    }
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
        <Button 
          variant="secondary" 
          onClick={fetchHistorique}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Rafraîchir
        </Button>
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
        <Card className="p-4 text-center border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-600">{stats.uploads}</p>
          <p className="text-sm text-gray-500">Uploads</p>
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
                { value: 'suppression', label: 'Suppression' },
                { value: 'upload', label: 'Upload' },
                { value: 'consultation', label: 'Consultation' },
                { value: 'traitement', label: 'Traitement' }
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
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Ligne 1: Type + Description */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {expandedItems[item.id] ? (
                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getActionColor(item.type_action)}`}>
                        {getActionLabel(item.type_action)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {item.description || item.type_action}
                      </span>
                      {item.convention_intitule && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/conventions/${item.convention_id}`);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 underline"
                        >
                          Voir convention
                        </button>
                      )}
                    </div>

                    {/* Ligne 2: Utilisateur + Date */}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {item.utilisateur_nom || 'Utilisateur inconnu'}
                        {item.utilisateur_email && (
                          <span className="text-xs text-gray-400">({item.utilisateur_email})</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(item.date_action)}
                      </span>
                      {item.ip_address && (
                        <span className="text-xs text-gray-400">
                          IP: {item.ip_address}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge de statut si présent */}
                  {item.statut && (
                    <div className="flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.statut === 'success' ? 'bg-green-100 text-green-700' :
                        item.statut === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        item.statut === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.statut}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Détails expansés */}
              {expandedItems[item.id] && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  {renderDetails(item)}
                  {!item.details && (
                    <p className="text-sm text-gray-500">Aucun détail disponible</p>
                  )}
                </div>
              )}
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
          <Button 
            variant="secondary" 
            size="sm"
            onClick={fetchHistorique}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Rafraîchir
          </Button>
        </div>
      )}
    </div>
  );
}