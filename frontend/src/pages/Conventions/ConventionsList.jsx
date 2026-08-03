import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConventions, exportConventions } from '../../services/conventionService';
import { formatDate } from '../../utils/formatDate';
import { TYPES_CONVENTION, STATUTS, TYPES_PARTENAIRE } from '../../utils/constants';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

export default function ConventionsList() {
  const navigate = useNavigate();
  const [conventions, setConventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreTypesPartenaire, setFiltreTypesPartenaire] = useState([]);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');

  useEffect(() => {
    fetchConventions();
  }, []);

  const fetchConventions = async () => {
    try {
      const response = await getConventions();
      setConventions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const conventionsFiltrees = conventions.filter(c => {
    if (search) {
      const s = search.toLowerCase();
      const inIntitule = c.intitule?.toLowerCase().includes(s);
      const inPartenaires = c.partenaires?.some(p => p.nom.toLowerCase().includes(s));
      if (!inIntitule && !inPartenaires) return false;
    }
    if (filtreType && c.type !== filtreType) return false;
    if (filtreStatut && c.statut !== filtreStatut) return false;
    if (filtreTypesPartenaire.length > 0) {
      const hasMatch = c.partenaires?.some(p => filtreTypesPartenaire.includes(p.type));
      if (!hasMatch) return false;
    }
    if (filtreDateDebut && c.date_signature < filtreDateDebut) return false;
    if (filtreDateFin && c.date_expiration > filtreDateFin) return false;
    return true;
  });

  const handleExportExcel = async () => {
    try {
      const response = await exportConventions('excel');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'conventions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTypePartenaire = (type) => {
    setFiltreTypesPartenaire(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const resetFiltres = () => {
    setSearch('');
    setFiltreType('');
    setFiltreStatut('');
    setFiltreTypesPartenaire([]);
    setFiltreDateDebut('');
    setFiltreDateFin('');
  };

  const getStatutColor = (statut) => {
    const colors = {
      EN_COURS: '#0F6E56',
      EXPIREE: '#993C1D',
      RENOUVELEE: '#185FA5',
      A_RENOUVELER: '#BA7517'
    };
    return colors[statut] || '#888';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-500">
            Suivi et gestion des conventions de partenariat
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            Exporter Excel
          </Button>
          <Button onClick={() => navigate('/conventions/new')}>
            Nouvelle convention
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="p-6">
        <div className="space-y-4">
          <Input
            placeholder="Rechercher par intitulé ou partenaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[150px]">
              <Select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                options={[
                  { value: '', label: 'Tous les types' },
                  ...TYPES_CONVENTION.map(t => ({ value: t, label: t }))
                ]}
                placeholder="Type de convention"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                options={[
                  { value: '', label: 'Tous les statuts' },
                  { value: 'EN_COURS', label: 'En cours' },
                  { value: 'EXPIREE', label: 'Expirée' },
                  { value: 'RENOUVELEE', label: 'Renouvelée' },
                  { value: 'A_RENOUVELER', label: 'À renouveler' }
                ]}
                placeholder="Statut"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="date"
                value={filtreDateDebut}
                onChange={(e) => setFiltreDateDebut(e.target.value)}
                placeholder="Date début"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <Input
                type="date"
                value={filtreDateFin}
                onChange={(e) => setFiltreDateFin(e.target.value)}
                placeholder="Date fin"
              />
            </div>

            <Button variant="secondary" onClick={resetFiltres}>
              Réinitialiser
            </Button>
          </div>

          {/* Types partenaire */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">Type partenaire :</span>
            {TYPES_PARTENAIRE.map(type => (
              <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtreTypesPartenaire.includes(type)}
                  onChange={() => toggleTypePartenaire(type)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Tableau */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intitulé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partenaire(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date signature</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date expiration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {conventionsFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune convention trouvée
                  </td>
                </tr>
              ) : (
                conventionsFiltrees.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/conventions/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{c.numero_reference}</td>
                    <td className="px-4 py-3 text-sm font-medium">{c.intitule}</td>
                    <td className="px-4 py-3 text-sm">
                      {c.partenaires?.map(p => p.nom).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">{c.type}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(c.date_signature)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(c.date_expiration) || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getStatutColor(c.statut) + '20',
                          color: getStatutColor(c.statut)
                        }}
                      >
                        {c.statut}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compteur */}
      <p className="text-sm text-gray-500">
        {conventionsFiltrees.length} convention(s) trouvée(s)
      </p>
    </div>
  );
}