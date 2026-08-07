import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getConventions, exportConventions } from '../../services/conventionService';
import { formatDate } from '../../utils/formatDate';
import { TYPES_CONVENTION, STATUTS, TYPES_PARTENAIRE } from '../../utils/constants';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Printer, CheckSquare, Square, ChevronDown, ChevronRight, FileCheck, FileX } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function ConventionsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [conventions, setConventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreTypesPartenaire, setFiltreTypesPartenaire] = useState([]);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  const [filtreSigne, setFiltreSigne] = useState('');
  
  // ✅ Filtres Options (cases à cocher)
  const [filtreBudget, setFiltreBudget] = useState(false);
  const [filtreValidationConseil, setFiltreValidationConseil] = useState(false);
  const [filtreFormationContinue, setFiltreFormationContinue] = useState(false);
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const allColumns = {
    'Identification': [
      { id: 'numero_reference', label: 'Numéro de référence' },
      { id: 'intitule', label: 'Intitulé de la convention' },
      { id: 'type', label: 'Type de convention' },
      { id: 'statut', label: 'Statut' },
      { id: 'signe', label: 'Signé' },
    ],
    'Dates': [
      { id: 'date_signature', label: 'Date de signature' },
      { id: 'date_expiration', label: 'Date d\'expiration' },
    ],
    'Signataires': [
      { id: 'signataire_um5', label: 'Signataire UM5' },
      { id: 'signataire_um5_autre', label: 'Autre signataire UM5' },
      { id: 'signataire_partenaire', label: 'Signataire partenaire' },
    ],
    'Partenaires': [
      { id: 'partenaire_nom', label: 'Nom du partenaire' },
      { id: 'partenaire_type', label: 'Type de partenaire' },
      { id: 'partenaire_ville', label: 'Ville du partenaire' },
      { id: 'partenaire_region', label: 'Région du partenaire' },
      { id: 'partenaire_pays', label: 'Pays du partenaire' },
    ],
  };

  useEffect(() => {
    const allSelected = {};
    Object.values(allColumns).forEach(group => {
      group.forEach(col => {
        allSelected[col.id] = true;
      });
    });
    setSelectedColumns(allSelected);
  }, []);

  useEffect(() => {
    fetchConventions();
  }, [location.key]);

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
      const inPartenaires = c.partenaires?.some(p => p.nom?.toLowerCase().includes(s));
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
    if (filtreSigne === 'signe' && !c.signe) return false;
    if (filtreSigne === 'non_signe' && c.signe) return false;
    
    // ✅ Filtres Options (cases à cocher)
    if (filtreBudget && !c.avec_budget) return false;
    if (filtreValidationConseil && !c.validation_conseil) return false;
    if (filtreFormationContinue && !c.formation_continue) return false;
    
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
    setFiltreSigne('');
    // ✅ Réinitialiser les cases à cocher
    setFiltreBudget(false);
    setFiltreValidationConseil(false);
    setFiltreFormationContinue(false);
  };

  // ✅ Statuts corrigés (3 statuts seulement)
  const getStatutColor = (statut) => {
    const colors = {
      'EN_COURS': '#0F6E56',      // 🟢 Vert
      'A_RENOUVELER': '#BA7517',  // 🟡 Jaune
      'EXPIREE': '#993C1D'        // 🔴 Rouge
    };
    return colors[statut] || '#888';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'EN_COURS': 'En cours',
      'A_RENOUVELER': 'À renouveler',
      'EXPIREE': 'Expirée'
    };
    return labels[statut] || statut;
  };

  const getPartenairesDisplay = (partenaires) => {
    if (!partenaires || partenaires.length === 0) return '—';
    return partenaires.map(p => p.nom).filter(Boolean).join(', ') || '—';
  };

  const toggleColumn = (columnId) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleAllColumns = (groupName, columns) => {
    const allSelected = columns.every(col => selectedColumns[col.id]);
    const newState = { ...selectedColumns };
    columns.forEach(col => {
      newState[col.id] = !allSelected;
    });
    setSelectedColumns(newState);
  };

  const getSelectedCount = () => {
    return Object.values(selectedColumns).filter(v => v).length;
  };

  const getValue = (convention, field) => {
    switch(field) {
      case 'numero_reference': return convention.numero_reference || '';
      case 'intitule': return convention.intitule || '';
      case 'type': return convention.type || '';
      case 'statut': return getStatutLabel(convention.statut) || '';
      case 'signe': return convention.signe ? '✅ Signé' : '❌ Non signé';
      case 'date_signature': return formatDate(convention.date_signature);
      case 'date_expiration': return formatDate(convention.date_expiration) || '—';
      case 'signataire_um5': return convention.signataire_um5 || '';
      case 'signataire_um5_autre': return convention.signataire_um5_autre || '';
      case 'signataire_partenaire': return convention.signataire_partenaire || '';
      case 'partenaire_nom': return getPartenairesDisplay(convention.partenaires);
      case 'partenaire_type': return convention.partenaires?.map(p => p.type).join(', ') || '—';
      case 'partenaire_ville': return convention.partenaires?.map(p => p.ville).join(', ') || '—';
      case 'partenaire_region': return convention.partenaires?.map(p => p.region).join(', ') || '—';
      case 'partenaire_pays': return convention.partenaires?.map(p => p.pays).join(', ') || '—';
      default: return '';
    }
  };

  const selectedColumnsList = Object.values(allColumns)
    .flat()
    .filter(col => selectedColumns[col.id]);

  const handlePrint = () => {
    setIsPrintModalOpen(false);
    
    const columns = selectedColumnsList;
    const data = conventionsFiltrees;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des conventions</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            background: white;
          }
          .print-header {
            text-align: center;
            margin-bottom: 15px;
          }
          .print-header h1 {
            font-size: 14px;
            font-weight: bold;
            color: #1a1a1a;
          }
          .print-header p {
            font-size: 9px;
            color: #666;
            margin-top: 4px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 7px;
          }
          th { 
            background-color: #f3f4f6; 
            font-weight: 600; 
            padding: 3px 4px; 
            border: 1px solid #d1d5db; 
            text-align: left;
          }
          td { 
            padding: 2px 4px; 
            border: 1px solid #d1d5db; 
            text-align: left;
          }
          .empty-row td {
            text-align: center;
            color: #999;
            padding: 20px;
          }
          .signe-oui { color: #16a34a; font-weight: 600; }
          .signe-non { color: #dc2626; font-weight: 600; }
          @page {
            margin: 8mm;
            size: A4 landscape;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Liste des conventions de partenariat</h1>
          <p>${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} - ${data.length} convention(s)</p>
        </div>
        <table>
          <thead>
            <tr>
    `;

    columns.forEach(col => {
      html += `<th>${col.label}</th>`;
    });

    html += `
            </tr>
          </thead>
          <tbody>
    `;

    if (data.length === 0) {
      html += `
        <tr class="empty-row">
          <td colspan="${columns.length}">Aucune convention trouvée</td>
        </tr>
      `;
    } else {
      data.forEach(c => {
        html += `<tr>`;
        columns.forEach(col => {
          const value = getValue(c, col.id);
          html += `<td>${value}</td>`;
        });
        html += `</tr>`;
      });
    }

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert('Veuillez autoriser les popups pour imprimer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Suivi et gestion des conventions de partenariat
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {conventions.length} convention{conventions.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportExcel}>
              Exporter Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Printer size={16} />
              Imprimer
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
                    ...TYPES_CONVENTION.map(t => ({ value: t, label: t }))
                  ]}
                  placeholder="Tous les types"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <Select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  options={[
                    { value: 'EN_COURS', label: 'En cours' },
                    { value: 'A_RENOUVELER', label: 'À renouveler' },
                    { value: 'EXPIREE', label: 'Expirée' }
                  ]}
                  placeholder="Tous les statuts"
                />
              </div>

              <div className="flex-1 min-w-[150px]">
                <Select
                  value={filtreSigne}
                  onChange={(e) => setFiltreSigne(e.target.value)}
                  options={[
                    { value: 'signe', label: ' Signé' },
                    { value: 'non_signe', label: ' Non signé' }
                  ]}
                  placeholder="Signature"
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

            {/* ✅ Type partenaire */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Type partenaire :</span>
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

            {/* ✅ Filtres Options (cases à cocher) */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Options :</span>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtreBudget}
                  onChange={(e) => setFiltreBudget(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700"> Avec budget</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtreValidationConseil}
                  onChange={(e) => setFiltreValidationConseil(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Validation conseil</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtreFormationContinue}
                  onChange={(e) => setFiltreFormationContinue(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Formation continue</span>
              </label>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {conventionsFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                        {getPartenairesDisplay(c.partenaires)}
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
                          {getStatutLabel(c.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.signe ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileCheck size={14} />
                            Signé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FileX size={14} />
                            Non signé
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-sm text-gray-500">
          {conventionsFiltrees.length} convention(s) trouvée(s)
        </p>
      </div>

      {/* Modal de sélection des colonnes */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Printer size={20} />
              Sélection des colonnes
            </h3>
            <span className="text-sm text-gray-500">
              {getSelectedCount()} colonne(s) sélectionnée(s)
            </span>
          </div>
          
          <p className="text-sm text-gray-500">
            Sélectionnez les colonnes à inclure dans l'impression
          </p>

          <div className="space-y-3">
            {Object.entries(allColumns).map(([groupName, columns]) => (
              <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <span className="font-medium text-gray-700">{groupName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {columns.filter(col => selectedColumns[col.id]).length}/{columns.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAllColumns(groupName, columns);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {columns.every(col => selectedColumns[col.id]) ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    {expandedGroups[groupName] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
                
                {expandedGroups[groupName] && (
                  <div className="p-3 space-y-1">
                    {columns.map(col => (
                      <label key={col.id} className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                        <button
                          type="button"
                          onClick={() => toggleColumn(col.id)}
                          className="text-blue-600"
                        >
                          {selectedColumns[col.id] ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                        <span className="text-sm text-gray-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsPrintModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer size={16} />
              Imprimer ({getSelectedCount()} colonnes)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}