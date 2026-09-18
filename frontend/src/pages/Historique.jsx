import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History, Calendar, User, X, RefreshCw, Filter, FileText, AlertCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { getHistorique, getHistoriqueByUser } from '../services/historiqueService';

export default function Historique() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchHistorique(); }, []);

  const fetchHistorique = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistorique();
      const normalizedData = (response.data || []).map(item => ({
        ...item,
        action: item.action || item.type_action || 'autre',
        type_action: item.type_action || item.action || 'autre'
      }));
      setHistorique(normalizedData);
    } catch (error) {
      console.error('Erreur:', error);
      setError(t('history.loadError'));
      setHistorique([]);
    } finally { setLoading(false); }
  };

  const fetchHistoriqueByUser = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistoriqueByUser(userId);
      const normalizedData = (response.data || []).map(item => ({
        ...item,
        action: item.action || item.type_action || 'autre',
        type_action: item.type_action || item.action || 'autre'
      }));
      setHistorique(normalizedData);
    } catch (error) {
      console.error('Erreur:', error);
      setError(t('history.loadError'));
      setHistorique([]);
    } finally { setLoading(false); }
  };

  const filteredHistorique = historique.filter(item => {
    const action = item.action || item.type_action || '';
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
    creations: historique.filter(h => (h.action === 'creation' || h.type_action === 'creation')).length,
    modifications: historique.filter(h => (h.action === 'modification' || h.type_action === 'modification')).length,
    suppressions: historique.filter(h => (h.action === 'suppression' || h.type_action === 'suppression')).length,
    autres: historique.filter(h => !['creation', 'modification', 'suppression', 'upload'].includes(h.action || h.type_action)).length
  };

  const getActionColor = (type) => {
    const colors = {
      creation: 'bg-green-100 text-green-800',
      modification: 'bg-blue-100 text-blue-800',
      suppression: 'bg-red-100 text-red-800',
      upload: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const getActionLabel = (type) => {
    const labels = {
      creation: t('history.creation'),
      modification: t('history.modification'),
      suppression: t('history.deletion'),
      upload: t('history.upload'),
      autre: t('history.other')
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const hasActiveFilters = typeFilter !== 'all' || dateDebut || dateFin || search;

  const resetFilters = () => {
    setTypeFilter('all');
    setDateDebut('');
    setDateFin('');
    setSearch('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">{t('history.loadingHistory')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl text-gray-500">
            {t('history.pageTitle')}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={fetchHistorique}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">{t('history.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('history.totalActions')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.creations}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('history.creations')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-blue-500">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.modifications}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('history.modifications')}</p>
        </Card>
        <Card className="p-3 sm:p-4 text-center border-l-4 border-l-red-500">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.suppressions}</p>
          <p className="text-xs sm:text-sm text-gray-500">{t('history.deletions')}</p>
        </Card>
      </div>

      {/* FILTRES */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Search + toggle filters (mobile) */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input 
                placeholder={t('history.searchAction')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full text-sm" 
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 md:hidden"
            >
              <Filter size={16} />
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </Button>
          </div>

          {/* Filters - always visible on md+, toggle on mobile */}
          <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3`}>
            <Select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: t('history.allTypes') },
                { value: 'creation', label: t('history.creation') },
                { value: 'modification', label: t('history.modification') },
                { value: 'suppression', label: t('history.deletion') },
                { value: 'upload', label: t('history.upload') }
              ]}
              className="w-full sm:w-44" 
            />
            <div className="flex gap-2 flex-1">
              <Input 
                type="date" 
                value={dateDebut} 
                onChange={(e) => setDateDebut(e.target.value)}
                placeholder={t('history.startDate')} 
                className="flex-1 min-w-0" 
              />
              <Input 
                type="date" 
                value={dateFin} 
                onChange={(e) => setDateFin(e.target.value)}
                placeholder={t('history.endDate')} 
                className="flex-1 min-w-0" 
              />
            </div>
            {hasActiveFilters && (
              <Button 
                variant="secondary" 
                onClick={resetFilters} 
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <X size={16} /> 
                <span>{t('common.reset')}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* LISTE */}
      {filteredHistorique.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <div className="text-center">
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900">
              {t('history.noActions')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {historique.length === 0 
                ? t('history.noActionsYet') 
                : t('history.noMatchingActions')}
            </p>
            {hasActiveFilters && (
              <Button className="mt-4" variant="secondary" onClick={resetFilters}>
                {t('common.reset')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistorique.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-2">
                  {/* Ligne 1: Type + Description */}
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${getActionColor(item.action || item.type_action)}`}>
                      {getActionLabel(item.action || item.type_action)}
                    </span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base break-words">
                      {item.description}
                    </span>
                  </div>

                  {/* Ligne 2: Convention */}
                  {item.convention_intitule && (
                    <div className="text-xs sm:text-sm text-blue-600 flex items-center gap-1.5 break-words">
                      <FileText size={14} className="flex-shrink-0" />
                      <span>{item.convention_intitule}</span>
                    </div>
                  )}

                  {/* Ligne 3: Utilisateur + Date */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={14} className="flex-shrink-0" />
                      <span className="truncate max-w-[150px] sm:max-w-none">
                        {item.utilisateur_nom || t('history.unknownUser')}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="flex-shrink-0" />
                      {formatDate(item.date_action)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* COMPTEUR */}
      {filteredHistorique.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-xs sm:text-sm text-gray-500">
            {filteredHistorique.length} {t('history.actionsDisplayed')}
          </p>
        </div>
      )}
    </div>
  );
}