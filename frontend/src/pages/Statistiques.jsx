import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Building2,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import { getConventions } from '../services/conventionService';

export default function Statistiques() {
  const [loading, setLoading] = useState(true);
  const [conventions, setConventions] = useState([]);
  const [stats, setStats] = useState(null);
  const [periode, setPeriode] = useState('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    fetchData();
  }, [periode, dateDebut, dateFin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getConventions();
      let data = response.data || [];
      
      // Filtrage par période
      if (periode === 'personnalise' && dateDebut && dateFin) {
        data = data.filter(c => 
          c.date_signature >= dateDebut && c.date_signature <= dateFin
        );
      } else if (periode !== 'all') {
        data = data.filter(c => 
          c.date_signature?.startsWith(periode)
        );
      }
      
      setConventions(data);
      setStats(calculerStatistiques(data));
    } catch (error) {
      console.error('Erreur:', error);
      setConventions([]);
      setStats(calculerStatistiques([]));
    } finally {
      setLoading(false);
    }
  };

  const calculerStatistiques = (data) => {
    const total = data.length;
    
    const enCours = data.filter(c => c.statut === 'EN_COURS').length;
    const expirees = data.filter(c => c.statut === 'EXPIREE').length;
    const aRenouveler = data.filter(c => c.statut === 'A_RENOUVELER').length;
    const renouvelees = data.filter(c => c.statut === 'RENOUVELEE').length;
    
    const parType = {};
    data.forEach(c => {
      const type = c.type || 'Non défini';
      parType[type] = (parType[type] || 0) + 1;
    });
    
    const parTypePartenaire = {};
    data.forEach(c => {
      if (c.partenaires && c.partenaires.length > 0) {
        c.partenaires.forEach(p => {
          const type = p.type || 'Non défini';
          parTypePartenaire[type] = (parTypePartenaire[type] || 0) + 1;
        });
      }
    });
    
    const parOrigine = {};
    data.forEach(c => {
      if (c.partenaires && c.partenaires.length > 0) {
        c.partenaires.forEach(p => {
          const region = p.region || p.ville || 'Non spécifié';
          parOrigine[region] = (parOrigine[region] || 0) + 1;
        });
      }
    });
    
    const parRenouvellement = {};
    data.forEach(c => {
      const mode = c.mode_renouvellement || 'Non défini';
      parRenouvellement[mode] = (parRenouvellement[mode] || 0) + 1;
    });
    
    const avecBudget = data.filter(c => c.avec_budget === true).length;
    const sansBudget = total - avecBudget;
    
    let budgetTotal = 0;
    data.forEach(c => {
      if (c.budget && c.budget.montant_total) {
        budgetTotal += c.budget.montant_total;
      }
    });
    
    const evolution = {};
    data.forEach(c => {
      if (c.date_signature) {
        const annee = c.date_signature.substring(0, 4);
        evolution[annee] = (evolution[annee] || 0) + 1;
      }
    });
    
    const tauxRenouvellement = total > 0 ? Math.round((renouvelees / total) * 100) : 0;

    const formatStats = (obj) => {
      return Object.entries(obj).map(([key, value]) => ({
        label: key,
        count: value,
        pourcentage: total > 0 ? Math.round((value / total) * 100) : 0
      }));
    };

    return {
      total,
      enCours,
      expirees,
      aRenouveler,
      renouvelees,
      parType: formatStats(parType),
      parTypePartenaire: formatStats(parTypePartenaire),
      parOrigine: formatStats(parOrigine),
      parRenouvellement: formatStats(parRenouvellement),
      avecBudget: { oui: avecBudget, non: sansBudget, total },
      budgetTotal,
      evolution: Object.entries(evolution).sort().map(([annee, count]) => ({ annee, count })),
      tauxRenouvellement
    };
  };

  const handleExport = () => {
    if (conventions.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }
    
    const headers = ['Intitulé', 'Type', 'Statut', 'Date signature', 'Date expiration'];
    const rows = conventions.map(c => [
      c.intitule || '',
      c.type || '',
      c.statut || '',
      c.date_signature || '',
      c.date_expiration || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statistiques_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // 🔄 CHARGEMENT
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" />
            Statistiques
          </h1>
        </div>
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Chargement des données...</p>
          </div>
        </Card>
      </div>
    );
  }

  // 📭 AUCUNE CONVENTION
  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" />
            Statistiques
          </h1>
          <Button variant="secondary" onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Rafraîchir
          </Button>
        </div>
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Aucune convention</h3>
            <p className="text-sm text-gray-500 mt-2">
              Aucune convention enregistrée pour le moment.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Créez votre première convention pour voir les statistiques apparaître.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.href = '/conventions/new'}
            >
              Créer une convention
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ✅ AFFICHAGE NORMAL
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} convention{stats.total > 1 ? 's' : ''} analysée{stats.total > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Rafraîchir
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[150px]">
            <Select
              label="Période"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              options={[
                { value: 'all', label: 'Toutes' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: 'personnalise', label: 'Personnalisée' }
              ]}
            />
          </div>
          {periode === 'personnalise' && (
            <>
              <div className="flex-1 min-w-[120px]">
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  label="Du"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  label="Au"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{stats.enCours}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{stats.expirees}</p>
          <p className="text-sm text-gray-500">Expirées</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-600">{stats.aRenouveler}</p>
          <p className="text-sm text-gray-500">À renouveler</p>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.parType.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <FileText size={16} />
              Type de convention
            </h3>
            <div className="space-y-2">
              {stats.parType.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate mr-2">{item.label}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(item.pourcentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Statut
          </h3>
          <div className="space-y-2">
            {[
              { label: 'En cours', count: stats.enCours, color: 'bg-green-500' },
              { label: 'Expirée', count: stats.expirees, color: 'bg-red-500' },
              { label: 'À renouveler', count: stats.aRenouveler, color: 'bg-orange-500' },
              { label: 'Renouvelée', count: stats.renouvelees, color: 'bg-blue-500' }
            ].filter(item => item.count > 0).map((item, index) => {
              const pourcentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.min(pourcentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {stats.parTypePartenaire.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Building2 size={16} />
              Type de partenaire
            </h3>
            <div className="space-y-2">
              {stats.parTypePartenaire.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate mr-2">{item.label}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(item.pourcentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {stats.parOrigine.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Globe size={16} />
              Origine géographique
            </h3>
            <div className="space-y-2">
              {stats.parOrigine.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate mr-2">{item.label}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(item.pourcentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Évolution */}
      {stats.evolution.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Calendar size={16} />
            Évolution par année
          </h3>
          <div className="flex items-end gap-3 h-32">
            {stats.evolution.map((item, index) => {
              const max = Math.max(...stats.evolution.map(e => e.count), 1);
              const height = (item.count / max) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full max-w-[50px] bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="mt-2 text-xs text-gray-500">{item.annee}</span>
                  <span className="text-xs font-medium text-gray-700">{item.count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Résumé */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Résumé</h3>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Total : {stats.total} conventions</li>
              <li>• En cours : {stats.enCours} ({stats.total > 0 ? Math.round((stats.enCours / stats.total) * 100) : 0}%)</li>
              <li>• Taux de renouvellement : {stats.tauxRenouvellement}%</li>
              {stats.budgetTotal > 0 && (
                <li>• Budget total : {stats.budgetTotal.toLocaleString()} DH</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}