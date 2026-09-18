import { useState, useEffect, useMemo } from 'react'
import { getConventions } from '../services/conventionService'
import { getAlertes } from '../services/alerteService'
import { formatDate } from '../utils/formatDate'
import { STATUTS, TYPES_ALERTE_COLORS } from '../utils/constants'
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Card from '../components/common/Card'
import { Settings, Plus, Trash2, Edit, RotateCcw, Copy, Download, FileText, Calendar } from 'lucide-react'
import html2canvas from 'html2canvas'

// Types de graphiques
const CHART_TYPES = [
    { value: 'pie', label: 'Camembert' },
    { value: 'bar', label: 'Barres' },
    { value: 'line', label: 'Ligne' },
]

// Variables disponibles pour les axes X
const X_AXIS_VARIABLES = {
    'statut': 'Statut de la convention',
    'type': 'Type de convention',
    'annee': 'Année de signature',
    'partenaire': 'Partenaire',
    'budget': 'Avec budget',
    'validation': 'Validation conseil',
    'formation': 'Formation continue',
    'mois': 'Mois de signature',
    'etablissement': 'Établissement UM5',
    'signataire': 'Signataire UM5'
}

// ✅ Périodes disponibles
const PERIOD_OPTIONS = [
    { value: 'all', label: 'Toutes les périodes' },
    { value: 'this_month', label: 'Ce mois-ci' },
    { value: 'this_quarter', label: 'Ce trimestre' },
    { value: 'this_year', label: 'Cette année' },
    { value: 'last_year', label: 'Année dernière' },
    { value: 'last_3_years', label: '3 dernières années' },
    { value: 'last_5_years', label: '5 dernières années' },
    { value: 'custom', label: 'Personnalisée...' },
]

// Configuration par défaut
const DEFAULT_WIDGETS = {
    statut: {
        id: 'statut',
        isDefault: true,
        type: 'pie',
        colors: ['#0F6E56', '#993C1D', '#BA7517', '#185FA5'],
        title: 'Répartition par statut',
        showLegend: true,
        showTooltip: true,
        xAxis: 'statut',
        yAxis: 'count',
        period: 'all'
    },
    type: {
        id: 'type',
        isDefault: true,
        type: 'bar',
        colors: ['#003087', '#0F6E56', '#993C1D', '#BA7517', '#185FA5'],
        title: 'Répartition par type',
        showLegend: true,
        showTooltip: true,
        xAxis: 'type',
        yAxis: 'count',
        period: 'all'
    },
    annee: {
        id: 'annee',
        isDefault: true,
        type: 'bar',
        colors: ['#003087'],
        title: 'Conventions par année',
        showLegend: false,
        showTooltip: true,
        xAxis: 'annee',
        yAxis: 'count',
        period: 'all'
    }
}

export default function Dashboard() {
    const [conventions, setConventions] = useState([])
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)
    const [copyStatus, setCopyStatus] = useState({})
    const [downloadStatus, setDownloadStatus] = useState({})

    // ✅ Période globale du dashboard
    const [globalPeriod, setGlobalPeriod] = useState('all')
    const [customDateStart, setCustomDateStart] = useState('')
    const [customDateEnd, setCustomDateEnd] = useState('')

    const [widgets, setWidgets] = useState(() => {
        const saved = localStorage.getItem('dashboardWidgets')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                const defaultKeys = Object.keys(DEFAULT_WIDGETS)
                const existingKeys = parsed.map(w => w.id)
                const missingKeys = defaultKeys.filter(k => !existingKeys.includes(k))

                const restoredWidgets = missingKeys.map(k => ({
                    ...DEFAULT_WIDGETS[k],
                    isDefault: true
                }))

                return [...parsed, ...restoredWidgets]
            } catch {
                return Object.values(DEFAULT_WIDGETS)
            }
        }
        return Object.values(DEFAULT_WIDGETS)
    })

    const [configModal, setConfigModal] = useState(null)
    const [editingWidget, setEditingWidget] = useState(null)
    const [showAddWidget, setShowAddWidget] = useState(false)
    const [newWidgetConfig, setNewWidgetConfig] = useState({
        title: 'Nouveau graphique',
        type: 'bar',
        colors: ['#003087'],
        xAxis: 'statut',
        yAxis: 'count',
        showLegend: true,
        showTooltip: true,
        period: 'all'
    })

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        localStorage.setItem('dashboardWidgets', JSON.stringify(widgets))
    }, [widgets])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [convData, alertData] = await Promise.all([
                getConventions(),
                getAlertes().catch(() => ({ data: [] }))
            ])
            const convs = convData.data || []
            setConventions(convs)
            setAlertes(alertData.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // ✅ Calculer les dates de début et fin selon la période
    const getPeriodDates = (period, customStart = '', customEnd = '') => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()

        let startDate = null
        let endDate = null

        switch (period) {
            case 'this_month':
                startDate = new Date(year, month, 1)
                endDate = new Date(year, month + 1, 0)
                break
            case 'this_quarter':
                const quarterStartMonth = Math.floor(month / 3) * 3
                startDate = new Date(year, quarterStartMonth, 1)
                endDate = new Date(year, quarterStartMonth + 3, 0)
                break
            case 'this_year':
                startDate = new Date(year, 0, 1)
                endDate = new Date(year, 11, 31)
                break
            case 'last_year':
                startDate = new Date(year - 1, 0, 1)
                endDate = new Date(year - 1, 11, 31)
                break
            case 'last_3_years':
                startDate = new Date(year - 3, 0, 1)
                endDate = new Date(year, 11, 31)
                break
            case 'last_5_years':
                startDate = new Date(year - 5, 0, 1)
                endDate = new Date(year, 11, 31)
                break
            case 'custom':
                startDate = customStart ? new Date(customStart) : null
                endDate = customEnd ? new Date(customEnd) : null
                break
            case 'all':
            default:
                return { startDate: null, endDate: null }
        }

        return { startDate, endDate }
    }

    // ✅ Filtrer les conventions selon la période
    const getFilteredConventions = (period, customStart = '', customEnd = '') => {
        const { startDate, endDate } = getPeriodDates(period, customStart, customEnd)

        if (!startDate && !endDate) {
            return conventions
        }

        return conventions.filter(c => {
            if (!c.date_signature) return false
            const convDate = new Date(c.date_signature)

            if (startDate && convDate < startDate) return false
            if (endDate && convDate > endDate) return false
            return true
        })
    }

    // ✅ Conventions filtrées par la période globale (pour les stats)
    const filteredConventions = useMemo(() => {
        return getFilteredConventions(globalPeriod, customDateStart, customDateEnd)
    }, [conventions, globalPeriod, customDateStart, customDateEnd])

    // ✅ Statistiques basées sur les conventions filtrées
    const stats = useMemo(() => {
        const convs = filteredConventions
        return {
            total: convs.length,
            enCours: convs.filter(c => c.statut === STATUTS.EN_COURS).length,
            expirees: convs.filter(c => c.statut === STATUTS.EXPIREE).length,
            aRenouveler: convs.filter(c => c.statut === STATUTS.A_RENOUVELER).length,
            renouvelees: convs.filter(c => c.statut === STATUTS.RENOUVELEES).length
        }
    }, [filteredConventions])

    // ✅ Générer les données selon la variable et la période
    const getDataForVariable = (xAxis, yAxis = 'count', period = 'all') => {
        // Filtrer les conventions selon la période du widget
        const convs = getFilteredConventions(period, customDateStart, customDateEnd)

        let data = []

        switch (xAxis) {
            case 'statut':
                data = [
                    { name: 'En cours', value: convs.filter(c => c.statut === STATUTS.EN_COURS).length },
                    { name: 'Expirées', value: convs.filter(c => c.statut === STATUTS.EXPIREE).length },
                    { name: 'À renouveler', value: convs.filter(c => c.statut === STATUTS.A_RENOUVELER).length },
                    { name: 'Renouvelées', value: convs.filter(c => c.statut === STATUTS.RENOUVELEES).length }
                ].filter(d => d.value > 0)
                break

            case 'type':
                data = Object.entries(
                    convs.reduce((acc, c) => {
                        acc[c.type] = (acc[c.type] || 0) + 1
                        return acc
                    }, {})
                ).map(([name, value]) => ({ name, value }))
                break

            case 'annee':
                data = Object.entries(
                    convs.reduce((acc, c) => {
                        if (!c.date_signature) return acc
                        const year = new Date(c.date_signature).getFullYear()
                        acc[year] = (acc[year] || 0) + 1
                        return acc
                    }, {})
                ).map(([name, value]) => ({ name, value })).sort((a, b) => a.name - b.name)
                break

            case 'partenaire':
                const partenaireCount = {}
                convs.forEach(c => {
                    if (c.partenaires) {
                        c.partenaires.forEach(p => {
                            partenaireCount[p.nom] = (partenaireCount[p.nom] || 0) + 1
                        })
                    }
                })
                data = Object.entries(partenaireCount)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)
                break

            case 'budget':
                const avecBudget = convs.filter(c => c.avec_budget).length
                const sansBudget = convs.length - avecBudget
                data = [
                    { name: 'Avec budget', value: avecBudget },
                    { name: 'Sans budget', value: sansBudget }
                ].filter(d => d.value > 0)
                break

            case 'validation':
                const valide = convs.filter(c => c.validation_conseil).length
                const nonValide = convs.length - valide
                data = [
                    { name: 'Validé', value: valide },
                    { name: 'Non validé', value: nonValide }
                ].filter(d => d.value > 0)
                break

            case 'formation':
                const avecFormation = convs.filter(c => c.formation_continue).length
                const sansFormation = convs.length - avecFormation
                data = [
                    { name: 'Avec formation', value: avecFormation },
                    { name: 'Sans formation', value: sansFormation }
                ].filter(d => d.value > 0)
                break

            case 'mois':
                const moisCount = {}
                convs.forEach(c => {
                    if (c.date_signature) {
                        const mois = new Date(c.date_signature).toLocaleString('fr-FR', { month: 'long' })
                        moisCount[mois] = (moisCount[mois] || 0) + 1
                    }
                })
                data = Object.entries(moisCount).map(([name, value]) => ({ name, value }))
                break

            case 'etablissement':
                const etabCount = {}
                convs.forEach(c => {
                    if (c.signataire_um5) {
                        etabCount[c.signataire_um5] = (etabCount[c.signataire_um5] || 0) + 1
                    }
                })
                data = Object.entries(etabCount)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)
                break

            case 'signataire':
                const signataireCount = {}
                convs.forEach(c => {
                    if (c.signataire_um5) {
                        signataireCount[c.signataire_um5] = (signataireCount[c.signataire_um5] || 0) + 1
                    }
                })
                data = Object.entries(signataireCount)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)
                break

            default:
                data = []
        }

        return data
    }

    // ✅ Label de la période
    const getPeriodLabel = (period) => {
        const option = PERIOD_OPTIONS.find(p => p.value === period)
        return option ? option.label : period
    }

    // Rendu du graphique
    const renderChart = (data, config) => {
        if (!data || data.length === 0) {
            return (
                <div className="w-full h-[280px] flex flex-col items-center justify-center text-gray-400">
                    <div className="text-4xl mb-2 opacity-60">📊</div>
                    <p className="text-sm font-medium">Aucune donnée disponible</p>
                    <p className="text-xs text-gray-400 mt-1">pour cette période</p>
                </div>
            )
        }

        const { type, colors, showLegend, showTooltip } = config
        const commonProps = {
            data,
            margin: { top: 20, right: 30, left: 20, bottom: 20 }
        }

        switch (type) {
            case 'pie':
                return (
                    <PieChart {...commonProps}>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length] || colors[0]}
                                />
                            ))}
                        </Pie>
                        {showTooltip && <Tooltip />}
                        {showLegend && <Legend />}
                    </PieChart>
                )

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        {showTooltip && <Tooltip />}
                        {showLegend && <Legend />}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={colors[0] || '#003087'}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                )

            case 'bar':
            default:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        {showTooltip && <Tooltip />}
                        {showLegend && <Legend />}
                        <Bar dataKey="value">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length] || colors[0]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                )
        }
    }

    // Copier le graphique
    const copyChartToClipboard = async (widgetId) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) return

        setCopyStatus(prev => ({ ...prev, [widgetId]: 'loading' }))

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
            })

            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob })
                    ])
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'success' }))
                } catch (err) {
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
                } finally {
                    setTimeout(() => {
                        setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
                    }, 2000)
                }
            }, 'image/png')
        } catch (error) {
            setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => {
                setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
            }, 2000)
        }
    }

    // Télécharger le graphique
    const downloadChartAsPNG = async (widgetId, title) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) return

        setDownloadStatus(prev => ({ ...prev, [widgetId]: 'loading' }))

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
            })

            const link = document.createElement('a')
            link.download = `${title || 'graphique'}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()

            setDownloadStatus(prev => ({ ...prev, [widgetId]: 'success' }))
            setTimeout(() => {
                setDownloadStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
            }, 2000)
        } catch (error) {
            setDownloadStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => {
                setDownloadStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
            }, 2000)
        }
    }

    // Exporter en Word
    const exportDashboardAsWord = async () => {
        try {
            const chartImages = []
            const chartTitles = []

            for (const widget of widgets) {
                const element = document.getElementById(`chart-${widget.id}`)
                if (element) {
                    const canvas = await html2canvas(element, {
                        backgroundColor: '#ffffff',
                        scale: 1.5,
                        useCORS: true,
                        logging: false,
                        allowTaint: true,
                    })
                    chartImages.push(canvas.toDataURL('image/png'))
                    chartTitles.push(`${widget.title} (${getPeriodLabel(widget.period || 'all')})`)
                }
            }

            let chartsHtml = ''
            chartImages.forEach((img, index) => {
                chartsHtml += `
                    <div style="page-break-inside: avoid; margin-bottom: 30px;">
                        <h3 style="font-size: 16px; color: #1a56db; margin-bottom: 10px;">${chartTitles[index]}</h3>
                        <img src="${img}" alt="${chartTitles[index]}" style="width: 100%; max-width: 1000px; display: block; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;" />
                    </div>
                `
            })

            const html = `
                <!DOCTYPE html>
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                    xmlns:w='urn:schemas-microsoft-com:office:word' 
                    xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="UTF-8">
                    <title>Rapport Dashboard</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; margin: 40px; background: white; }
                        .header { text-align: center; border-bottom: 3px solid #1a56db; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { font-size: 26px; color: #1a56db; margin: 0; }
                        .header p { color: #666; font-size: 14px; margin: 5px 0 0; }
                        .period-badge { display: inline-block; background: #e5e7eb; padding: 5px 15px; border-radius: 4px; margin-top: 10px; font-size: 12px; }
                        h2 { font-size: 20px; color: #1a56db; margin-top: 30px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📊 Rapport du Dashboard</h1>
                        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                        <div class="period-badge">Période : ${getPeriodLabel(globalPeriod)}</div>
                    </div>

                    ${chartsHtml}

                    ${alertes.length > 0 ? `
                    <h2>🔔 Dernières alertes</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #1a56db; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">Message</th>
                                <th style="padding: 8px 12px; text-align: center;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alertes.slice(0, 5).map(alerte => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 6px 12px;">${alerte.objet || alerte.type_alerte}</td>
                                <td style="padding: 6px 12px; text-align: center;">${formatDate(alerte.date_declenchement)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}

                    <div class="footer">
                        Université Mohammed V de Rabat - Direction des Partenariats
                    </div>
                </body>
                </html>
            `

            const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
            const link = document.createElement('a')
            link.download = `dashboard_${new Date().toISOString().split('T')[0]}.doc`
            link.href = URL.createObjectURL(blob)
            link.click()
            URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error('Erreur export Word:', error)
            alert('Erreur lors de l\'export.')
        }
    }

    // Supprimer un widget
    const removeWidget = (id) => {
        setWidgets(widgets.filter(w => w.id !== id))
    }

    // Restaurer les défauts
    const restoreDefaults = () => {
        setWidgets(Object.values(DEFAULT_WIDGETS))
    }

    // Sauvegarder config
    const saveConfig = (widgetId, newConfig) => {
        setWidgets(widgets.map(w =>
            w.id === widgetId ? { ...w, ...newConfig } : w
        ))
        setConfigModal(null)
    }

    // Ajouter/modifier widget
    const saveCustomWidget = () => {
        const data = getDataForVariable(newWidgetConfig.xAxis, 'count', newWidgetConfig.period || 'all')
        if (data.length === 0) {
            alert('Aucune donnée disponible pour cette variable et cette période')
            return
        }

        const widgetData = {
            title: newWidgetConfig.title,
            type: newWidgetConfig.type,
            colors: [...newWidgetConfig.colors],
            xAxis: newWidgetConfig.xAxis,
            yAxis: newWidgetConfig.yAxis,
            showLegend: newWidgetConfig.showLegend,
            showTooltip: newWidgetConfig.showTooltip,
            period: newWidgetConfig.period || 'all',
            isDefault: false
        }

        if (editingWidget) {
            setWidgets(widgets.map(w =>
                w.id === editingWidget ? { ...w, ...widgetData } : w
            ))
            setEditingWidget(null)
        } else {
            const newWidget = {
                id: `custom-${Date.now()}`,
                ...widgetData
            }
            setWidgets([...widgets, newWidget])
        }

        setShowAddWidget(false)
        setNewWidgetConfig({
            title: 'Nouveau graphique',
            type: 'bar',
            colors: ['#003087'],
            xAxis: 'statut',
            yAxis: 'count',
            showLegend: true,
            showTooltip: true,
            period: 'all'
        })
    }

    // ✅ Composant Période Selector
    const PeriodSelector = ({ value, onChange, showCustom = false }) => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PERIOD_OPTIONS.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {value === 'custom' && showCustom && (
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="date"
                            value={customDateStart}
                            onChange={(e) => setCustomDateStart(e.target.value)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Début"
                        />
                        <span className="text-xs text-gray-400">→</span>
                        <input
                            type="date"
                            value={customDateEnd}
                            onChange={(e) => setCustomDateEnd(e.target.value)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Fin"
                        />
                    </div>
                )}
            </div>
        )
    }

    // Widget de configuration
    const ConfigWidget = ({ widget, onClose, onSave }) => {
        const [localConfig, setLocalConfig] = useState(widget)

        return (
            <Modal isOpen={true} onClose={onClose}>
                <div className="p-6 space-y-4 max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings size={20} />
                        Configuration
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de graphique
                        </label>
                        <select
                            value={localConfig.type}
                            onChange={(e) => setLocalConfig({ ...localConfig, type: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        >
                            {CHART_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titre
                        </label>
                        <input
                            type="text"
                            value={localConfig.title}
                            onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        />
                    </div>

                    {/* ✅ Sélection de période pour ce widget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Période
                        </label>
                        <select
                            value={localConfig.period || 'all'}
                            onChange={(e) => setLocalConfig({ ...localConfig, period: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        >
                            {PERIOD_OPTIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        {localConfig.period === 'custom' && (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="date"
                                    value={customDateStart}
                                    onChange={(e) => setCustomDateStart(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1"
                                />
                                <span className="text-xs text-gray-400">→</span>
                                <input
                                    type="date"
                                    value={customDateEnd}
                                    onChange={(e) => setCustomDateEnd(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1"
                                />
                            </div>
                        )}
                    </div>

                    {localConfig.type !== 'pie' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Axe X (catégories)
                            </label>
                            <select
                                value={localConfig.xAxis}
                                onChange={(e) => setLocalConfig({ ...localConfig, xAxis: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                            >
                                {Object.entries(X_AXIS_VARIABLES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleurs
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {localConfig.colors.map((color, index) => (
                                <div key={index} className="relative group">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => {
                                            const newColors = [...localConfig.colors]
                                            newColors[index] = e.target.value
                                            setLocalConfig({ ...localConfig, colors: newColors })
                                        }}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                                    />
                                    {localConfig.colors.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newColors = localConfig.colors.filter((_, i) => i !== index)
                                                setLocalConfig({ ...localConfig, colors: newColors })
                                            }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    setLocalConfig({
                                        ...localConfig,
                                        colors: [...localConfig.colors, '#000000']
                                    })
                                }}
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-400"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localConfig.showLegend}
                                onChange={(e) => setLocalConfig({ ...localConfig, showLegend: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            Légende
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={localConfig.showTooltip}
                                onChange={(e) => setLocalConfig({ ...localConfig, showTooltip: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            Tooltip
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={onClose}>Annuler</Button>
                        <Button onClick={() => onSave(localConfig)}>Enregistrer</Button>
                    </div>
                </div>
            </Modal>
        )
    }

    if (loading) return <div className="flex items-center justify-center h-64">Chargement...</div>

    return (
        <div id="dashboard-container" className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={exportDashboardAsWord}
                        className="flex items-center gap-2"
                    >
                        <FileText size={16} />
                        Exporter Word
                    </Button>

                    <Button variant="secondary" onClick={restoreDefaults} className="flex items-center gap-2">
                        <RotateCcw size={16} />
                        Restaurer les défauts
                    </Button>
                    <Button onClick={() => {
                        setEditingWidget(null)
                        setShowAddWidget(true)
                    }} className='flex justify-center'>
                        <Plus size={16} className="mr-2" />
                        Ajouter un graphique
                    </Button>
                </div>
            </div>

            {/* ✅ Barre de sélection de période globale */}
            <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-[#003087]" />
                        <span className="text-sm font-medium text-gray-700">Période d'analyse :</span>
                    </div>
                    <PeriodSelector
                        value={globalPeriod}
                        onChange={setGlobalPeriod}
                        showCustom={true}
                    />
                    {globalPeriod !== 'all' && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {filteredConventions.length} convention(s) sur {conventions.length}
                        </span>
                    )}
                </div>
            </Card>

            {/* Cards statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                    <p className="text-sm text-gray-500">Total conventions</p>
                    <h2 className="text-2xl font-bold text-gray-900">{stats.total}</h2>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-green-500">
                    <p className="text-sm text-gray-500">En cours</p>
                    <h2 className="text-2xl font-bold text-green-600">{stats.enCours}</h2>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-red-500">
                    <p className="text-sm text-gray-500">Expirées</p>
                    <h2 className="text-2xl font-bold text-red-600">{stats.expirees}</h2>
                </Card>
                <Card className="p-4 text-center border-l-4 border-l-yellow-500">
                    <p className="text-sm text-gray-500">À renouveler</p>
                    <h2 className="text-2xl font-bold text-yellow-600">{stats.aRenouveler}</h2>
                </Card>
            </div>

            {/* Grille de graphiques */}
            {widgets.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-gray-500">Aucun graphique configuré</p>
                    <Button className="mt-4 flex justify-center mx-auto" onClick={() => setShowAddWidget(true)}>
                        Ajouter un graphique
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {widgets.map((widget) => {
                        // ✅ Si la période globale ≠ 'all', tout le monde suit la globale
                        // Sinon, chaque widget utilise sa propre période
                        const effectivePeriod = globalPeriod !== 'all' 
                            ? globalPeriod 
                            : (widget.period || 'all')
                        
                        const data = getDataForVariable(
                            widget.xAxis || 'statut',
                            'count',
                            effectivePeriod  // ✅ Utiliser la période effective
                        )
                        const copyStat = copyStatus[widget.id] || 'idle'
                        const downloadStat = downloadStatus[widget.id] || 'idle'

                        return (
                            <Card key={widget.id} className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
                                        
                                        {/* ✅ Badge de période effective */}
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                            📅 {getPeriodLabel(effectivePeriod)}
                                            {globalPeriod !== 'all' && (
                                                <span className="text-blue-600 ml-1">(globale)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => downloadChartAsPNG(widget.id, widget.title)}
                                            className={`transition-colors p-1 rounded ${
                                                downloadStat === 'success' ? 'text-green-500' :
                                                downloadStat === 'error' ? 'text-red-500' :
                                                downloadStat === 'loading' ? 'text-yellow-500 animate-pulse' :
                                                'text-gray-400 hover:text-green-600'
                                            }`}
                                            title="Télécharger en PNG"
                                            disabled={downloadStat === 'loading'}
                                        >
                                            {downloadStat === 'success' ? '✅' :
                                            downloadStat === 'loading' ? '⏳' :
                                            <Download size={18} />}
                                        </button>

                                        <button
                                            onClick={() => copyChartToClipboard(widget.id)}
                                            className={`transition-colors p-1 rounded ${
                                                copyStat === 'success' ? 'text-green-500' :
                                                copyStat === 'error' ? 'text-red-500' :
                                                copyStat === 'loading' ? 'text-yellow-500 animate-pulse' :
                                                'text-gray-400 hover:text-blue-600'
                                            }`}
                                            title="Copier l'image"
                                            disabled={copyStat === 'loading'}
                                        >
                                            {copyStat === 'success' ? '✅' :
                                            copyStat === 'loading' ? '⏳' :
                                            <Copy size={18} />}
                                        </button>

                                        <button
                                            onClick={() => setConfigModal(widget.id)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                                            title="Configurer"
                                        >
                                            <Settings size={18} />
                                        </button>

                                        <button
                                            onClick={() => removeWidget(widget.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div id={`chart-${widget.id}`}>
                                    <ResponsiveContainer width="100%" height={280}>
                                        {renderChart(data, widget)}
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Alertes */}
            {alertes.length > 0 && (
                <Card className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Dernières alertes
                    </h3>
                    <div className="space-y-2">
                        {alertes.slice(0, 4).map((alerte) => (
                            <div
                                key={alerte.id}
                                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor: TYPES_ALERTE_COLORS?.[alerte.type_alerte] || '#888'
                                        }}
                                    />
                                    <span className="text-sm text-gray-700">
                                        {alerte.objet || alerte.type_alerte}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {formatDate(alerte.date_declenchement)}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modal configuration widget */}
            {configModal && (
                <ConfigWidget
                    widget={widgets.find(w => w.id === configModal)}
                    onClose={() => setConfigModal(null)}
                    onSave={(newConfig) => saveConfig(configModal, newConfig)}
                />
            )}

            {/* Modal ajout widget */}
            <Modal isOpen={showAddWidget} onClose={() => {
                setShowAddWidget(false)
                setEditingWidget(null)
            }}>
                <div className="p-6 space-y-4 max-w-md">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {editingWidget ? <Edit size={20} /> : <Plus size={20} />}
                        {editingWidget ? 'Modifier le graphique' : 'Ajouter un graphique'}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Titre
                        </label>
                        <input
                            type="text"
                            value={newWidgetConfig.title}
                            onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, title: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de graphique
                        </label>
                        <select
                            value={newWidgetConfig.type}
                            onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, type: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        >
                            {CHART_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ✅ Période pour le nouveau widget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Période
                        </label>
                        <select
                            value={newWidgetConfig.period || 'all'}
                            onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, period: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                        >
                            {PERIOD_OPTIONS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        {newWidgetConfig.period === 'custom' && (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="date"
                                    value={customDateStart}
                                    onChange={(e) => setCustomDateStart(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1"
                                />
                                <span className="text-xs text-gray-400">→</span>
                                <input
                                    type="date"
                                    value={customDateEnd}
                                    onChange={(e) => setCustomDateEnd(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1"
                                />
                            </div>
                        )}
                    </div>

                    {newWidgetConfig.type !== 'pie' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Axe X (catégories)
                            </label>
                            <select
                                value={newWidgetConfig.xAxis}
                                onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, xAxis: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                            >
                                {Object.entries(X_AXIS_VARIABLES).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleurs
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {newWidgetConfig.colors.map((color, index) => (
                                <div key={index} className="relative group">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => {
                                            const newColors = [...newWidgetConfig.colors]
                                            newColors[index] = e.target.value
                                            setNewWidgetConfig({ ...newWidgetConfig, colors: newColors })
                                        }}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-500"
                                    />
                                    {newWidgetConfig.colors.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newColors = newWidgetConfig.colors.filter((_, i) => i !== index)
                                                setNewWidgetConfig({ ...newWidgetConfig, colors: newColors })
                                            }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    setNewWidgetConfig({
                                        ...newWidgetConfig,
                                        colors: [...newWidgetConfig.colors, '#000000']
                                    })
                                }}
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-400"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newWidgetConfig.showLegend}
                                onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, showLegend: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            Légende
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newWidgetConfig.showTooltip}
                                onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, showTooltip: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600"
                            />
                            Tooltip
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={() => {
                            setShowAddWidget(false)
                            setEditingWidget(null)
                        }}>
                            Annuler
                        </Button>
                        <Button onClick={saveCustomWidget}>
                            {editingWidget ? 'Mettre à jour' : 'Ajouter'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}