import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getConventions, exportConventions } from '../../services/conventionService';
import { formatDate } from '../../utils/formatDate';
import { TYPES_CONVENTION, STATUTS, TYPES_PARTENAIRE, ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Printer, CheckSquare, Square, ChevronDown, ChevronRight, FileCheck, FileX, FileSpreadsheet } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function ConventionsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [conventions, setConventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreTypesPartenaire, setFiltreTypesPartenaire] = useState([]);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  const [filtreSigne, setFiltreSigne] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filtreBudget, setFiltreBudget] = useState(false);
  const [filtreValidationConseil, setFiltreValidationConseil] = useState(false);
  const [filtreFormationContinue, setFiltreFormationContinue] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const isCharge = user?.role === ROLES.CHARGE;
  const isSG = user?.role === ROLES.SG;

  // ✅ Colonnes avec clés i18n
  const allColumns = {
    [t('conventions.groupIdentification')]: [
      { id: 'numero_reference', labelKey: 'conventions.reference' },
      { id: 'intitule', labelKey: 'conventions.intitule' },
      { id: 'type', labelKey: 'conventions.type' },
      { id: 'statut', labelKey: 'conventions.status' },
      { id: 'signe', labelKey: 'conventions.signed' },
    ],
    [t('conventions.groupDates')]: [
      { id: 'date_signature', labelKey: 'conventions.signatureDate' },
      { id: 'date_expiration', labelKey: 'conventions.expirationDate' },
    ],
    [t('conventions.groupSignatories')]: [
      { id: 'signataire_um5', labelKey: 'conventions.signatoryUM5' },
      { id: 'signataire_um5_autre', labelKey: 'conventions.signatoryUM5Other' },
      { id: 'signataire_partenaire', labelKey: 'conventions.signatoryPartner' },
    ],
    [t('conventions.groupPartners')]: [
      { id: 'partenaire_nom', labelKey: 'conventions.partnerName' },
      { id: 'partenaire_type', labelKey: 'conventions.partnerType' },
      { id: 'partenaire_ville', labelKey: 'conventions.partnerCity' },
      { id: 'partenaire_region', labelKey: 'conventions.partnerRegion' },
      { id: 'partenaire_pays', labelKey: 'conventions.partnerCountry' },
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
    if (isSG && !c.avec_budget) return false;

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
    if (filtreBudget && !c.avec_budget) return false;
    if (filtreValidationConseil && !c.validation_conseil) return false;
    if (filtreFormationContinue && !c.formation_continue) return false;

    return true;
  });

  const handleExportExcel = async () => {
    try {
      setIsPrintModalOpen(false);
      const columns = Object.values(allColumns).flat().filter(col => selectedColumns[col.id]);
      const data = conventionsFiltrees.map(c => {
        const row = {};
        columns.forEach(col => {
          row[t(col.labelKey)] = getValue(c, col.id);
        });
        return row;
      });
      const response = await exportConventions('excel', data);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `conventions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert(t('common.error'));
    }
  };

  const toggleTypePartenaire = (type) => {
    setFiltreTypesPartenaire(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
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
    setFiltreBudget(false);
    setFiltreValidationConseil(false);
    setFiltreFormationContinue(false);
  };

  const getStatutColor = (statut) => {
    const colors = {
      'EN_COURS': '#0F6E56',
      'A_RENOUVELER': '#BA7517',
      'EXPIREE': '#993C1D'
    };
    return colors[statut] || '#888';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'EN_COURS': t('status.EN_COURS'),
      'A_RENOUVELER': t('status.A_RENOUVELER'),
      'EXPIREE': t('status.EXPIREE')
    };
    return labels[statut] || statut;
  };

  const getPartenairesDisplay = (partenaires) => {
    if (!partenaires || partenaires.length === 0) return '—';
    return partenaires.map(p => p.nom).filter(Boolean).join(', ') || '—';
  };

  const toggleColumn = (columnId) => {
    setSelectedColumns(prev => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleAllColumns = (groupName, columns) => {
    const allSelected = columns.every(col => selectedColumns[col.id]);
    const newState = { ...selectedColumns };
    columns.forEach(col => { newState[col.id] = !allSelected; });
    setSelectedColumns(newState);
  };

  const getSelectedCount = () => Object.values(selectedColumns).filter(v => v).length;

  const getValue = (convention, field) => {
    switch(field) {
      case 'numero_reference': return convention.numero_reference || '';
      case 'intitule': return convention.intitule || '';
      case 'type': return convention.type || '';
      case 'statut': return getStatutLabel(convention.statut) || '';
      case 'signe': return convention.signe ? `✅ ${t('conventions.signed')}` : `❌ ${t('conventions.notSigned')}`;
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

  const selectedColumnsList = Object.values(allColumns).flat().filter(col => selectedColumns[col.id]);

  const handlePrint = () => {
    setIsPrintModalOpen(false);
    const columns = selectedColumnsList;
    const data = conventionsFiltrees;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t('conventions.title')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .print-header { text-align: center; margin-bottom: 15px; }
          .print-header h1 { font-size: 14px; font-weight: bold; }
          .print-header p { font-size: 9px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 7px; }
          th { background-color: #f3f4f6; font-weight: 600; padding: 3px 4px; border: 1px solid #d1d5db; text-align: left; }
          td { padding: 2px 4px; border: 1px solid #d1d5db; text-align: left; }
          @page { margin: 8mm; size: A4 landscape; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${t('conventions.title')}</h1>
          <p>${new Date().toLocaleDateString()} - ${data.length} ${t('conventions.total')}</p>
        </div>
        <table><thead><tr>
    `;

    columns.forEach(col => { html += `<th>${t(col.labelKey)}</th>`; });
    html += `</tr></thead><tbody>`;

    if (data.length === 0) {
      html += `<tr><td colspan="${columns.length}" style="text-align:center; padding:20px; color:#999;">${t('conventions.noConventions')}</td></tr>`;
    } else {
      data.forEach(c => {
        html += `<tr>`;
        columns.forEach(col => { html += `<td>${getValue(c, col.id)}</td>`; });
        html += `</tr>`;
      });
    }

    html += `</tbody></table></body></html>`;

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    } else {
      alert(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('conventions.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {conventions.length} {t('conventions.total')}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setIsPrintModalOpen(true)} className="flex items-center gap-2 text-xs sm:text-sm">
              <FileSpreadsheet size={16} />
              <span className="hidden sm:inline">{t('conventions.exportPrint')}</span>
            </Button>
            {isCharge && (
              <Button onClick={() => navigate('/conventions/new')} className="text-xs sm:text-sm">
                {t('conventions.new')}
              </Button>
            )}
          </div>
        </div>

        {/* ═══ FILTRES ═══ */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <Input
              placeholder={t('conventions.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 text-sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              <Select
                value={filtreType}
                onChange={(e) => setFiltreType(e.target.value)}
                options={TYPES_CONVENTION.map(tc => ({ value: tc, label: tc }))}
                placeholder={t('conventions.allTypes')}
              />
              <Select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                options={[
                  { value: 'EN_COURS', label: t('status.EN_COURS') },
                  { value: 'A_RENOUVELER', label: t('status.A_RENOUVELER') },
                  { value: 'EXPIREE', label: t('status.EXPIREE') }
                ]}
                placeholder={t('conventions.allStatuses')}
              />
              <Select
                value={filtreSigne}
                onChange={(e) => setFiltreSigne(e.target.value)}
                options={[
                  { value: 'signe', label: `✅ ${t('conventions.signed')}` },
                  { value: 'non_signe', label: `❌ ${t('conventions.notSigned')}` }
                ]}
                placeholder={t('conventions.signature')}
              />
              <Input type="date" value={filtreDateDebut} onChange={(e) => setFiltreDateDebut(e.target.value)} placeholder={t('conventions.startDate')} />
              <Input type="date" value={filtreDateFin} onChange={(e) => setFiltreDateFin(e.target.value)} placeholder={t('conventions.endDate')} />
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={resetFiltres} className="text-xs sm:text-sm">
                {t('common.reset')}
              </Button>
            </div>

            {/* Type partenaire */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">{t('conventions.partnerType')} :</span>
              {TYPES_PARTENAIRE.map(type => (
                <label key={type} className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input type="checkbox" checked={filtreTypesPartenaire.includes(type)} onChange={() => toggleTypePartenaire(type)} className="rounded border-gray-300 text-blue-600" />
                  {type}
                </label>
              ))}
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">{t('conventions.options')} :</span>
              {!isSG && (
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <input type="checkbox" checked={filtreBudget} onChange={(e) => setFiltreBudget(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                  <span className="text-gray-700">{t('conventions.withBudget')}</span>
                </label>
              )}
              <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input type="checkbox" checked={filtreValidationConseil} onChange={(e) => setFiltreValidationConseil(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-gray-700">{t('conventions.validationCouncil')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                <input type="checkbox" checked={filtreFormationContinue} onChange={(e) => setFiltreFormationContinue(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-gray-700">{t('conventions.formationContinue')}</span>
              </label>
            </div>
          </div>
        </Card>

        {/* ═══ TABLEAU ═══ */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.number')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.intitule')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.partners')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.type')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.signatureDate')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.expirationDate')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.status')}</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('conventions.signed')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {conventionsFiltrees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                      {t('conventions.noConventions')}
                    </td>
                  </tr>
                ) : (
                  conventionsFiltrees.map((c, index) => (
                    <tr 
                      key={c.id} 
                      onClick={() => navigate(`/conventions/${c.id}`)} 
                      className={`cursor-pointer transition-colors hover:bg-blue-100/50`}
                    >
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{c.numero_reference}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">{c.intitule}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{getPartenairesDisplay(c.partenaires)}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{c.type}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{formatDate(c.date_signature)}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">{formatDate(c.date_expiration) || '—'}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ backgroundColor: getStatutColor(c.statut) + '20', color: getStatutColor(c.statut) }}>
                          {getStatutLabel(c.statut)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        {c.signe ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                            <FileCheck size={14} />
                            <span className="hidden sm:inline">{t('conventions.signed')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 whitespace-nowrap">
                            <FileX size={14} />
                            <span className="hidden sm:inline">{t('conventions.notSigned')}</span>
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

        <p className="text-xs sm:text-sm text-gray-500">
          {conventionsFiltrees.length} {t('conventions.found')}
        </p>
      </div>

      {/* ═══ MODAL COLONNES ═══ */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)}>
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('conventions.selectColumns')}</h3>
            <span className="text-xs sm:text-sm text-gray-500">
              {getSelectedCount()} {t('conventions.columnsSelected')}
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(allColumns).map(([groupName, columns]) => (
              <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                <button type="button" onClick={() => toggleGroup(groupName)}
                  className="w-full px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">{groupName}</span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs text-gray-400">
                      {columns.filter(col => selectedColumns[col.id]).length}/{columns.length}
                    </span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleAllColumns(groupName, columns); }}
                      className="text-xs text-blue-600 hover:text-blue-700 hidden sm:inline">
                      {columns.every(col => selectedColumns[col.id]) ? t('conventions.deselectAll') : t('conventions.selectAll')}
                    </button>
                    {expandedGroups[groupName] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {expandedGroups[groupName] && (
                  <div className="p-3 space-y-1">
                    {columns.map(col => (
                      <label key={col.id} className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                        <button type="button" onClick={() => toggleColumn(col.id)} className="text-blue-600">
                          {selectedColumns[col.id] ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <span className="text-xs sm:text-sm text-gray-700">{t(col.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsPrintModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handlePrint} className="flex items-center justify-center gap-2">
              <Printer size={16} /> {t('common.print')}
            </Button>
            <Button onClick={handleExportExcel} className="flex items-center justify-center gap-2" variant="success">
              <FileSpreadsheet size={16} /> {t('common.export')} Excel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}