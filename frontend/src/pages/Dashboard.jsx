import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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

// ✅ Types de graphiques (traduits)
const CHART_TYPES = [
    { value: 'pie', labelKey: 'dashboard.pie' },
    { value: 'bar', labelKey: 'dashboard.bar' },
    { value: 'line', labelKey: 'dashboard.line' },
]

// ✅ Variables disponibles (traduits)
const X_AXIS_VARIABLES = {
    'statut': 'dashboard.xStatut',
    'type': 'dashboard.xType',
    'annee': 'dashboard.xAnnee',
    'partenaire': 'dashboard.xPartenaire',
    'budget': 'dashboard.xBudget',
    'validation': 'dashboard.xValidation',
    'formation': 'dashboard.xFormation',
    'mois': 'dashboard.xMois',
    'etablissement': 'dashboard.xEtablissement',
    'signataire': 'dashboard.xSignataire'
}

// ✅ Périodes disponibles
const PERIOD_OPTIONS = [
    { value: 'all', labelKey: 'dashboard.periodAll' },
    { value: 'this_month', labelKey: 'dashboard.periodThisMonth' },
    { value: 'this_quarter', labelKey: 'dashboard.periodThisQuarter' },
    { value: 'this_year', labelKey: 'dashboard.periodThisYear' },
    { value: 'last_year', labelKey: 'dashboard.periodLastYear' },
    { value: 'last_3_years', labelKey: 'dashboard.periodLast3Years' },
    { value: 'last_5_years', labelKey: 'dashboard.periodLast5Years' },
    { value: 'custom', labelKey: 'dashboard.periodCustom' },
]

// Configuration par défaut (sans textes en dur)
const DEFAULT_WIDGETS = {
    statut: {
        id: 'statut',
        isDefault: true,
        type: 'pie',
        colors: ['#0F6E56', '#993C1D', '#BA7517', '#185FA5'],
        titleKey: 'dashboard.chartStatut',
        showLegend: true,
        showTooltip: true,
        xAxis: 'statut',
        yAxis: 'count',
        period: null
    },
    type: {
        id: 'type',
        isDefault: true,
        type: 'bar',
        colors: ['#003087', '#0F6E56', '#993C1D', '#BA7517', '#185FA5'],
        titleKey: 'dashboard.chartType',
        showLegend: true,
        showTooltip: true,
        xAxis: 'type',
        yAxis: 'count',
        period: null
    },
    annee: {
        id: 'annee',
        isDefault: true,
        type: 'bar',
        colors: ['#003087'],
        titleKey: 'dashboard.chartAnnee',
        showLegend: false,
        showTooltip: true,
        xAxis: 'annee',
        yAxis: 'count',
        period: null
    }
}

export default function Dashboard() {
    const { t } = useTranslation()
    const [conventions, setConventions] = useState([])
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)
    const [copyStatus, setCopyStatus] = useState({})
    const [downloadStatus, setDownloadStatus] = useState({})

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
                const restoredWidgets = missingKeys.map(k => ({ ...DEFAULT_WIDGETS[k], isDefault: true }))
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
        title: '',
        type: 'bar',
        colors: ['#003087'],
        xAxis: 'statut',
        yAxis: 'count',
        showLegend: true,
        showTooltip: true,
        period: null
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
            setConventions(convData.data || [])
            setAlertes(alertData.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // ✅ Calculer dates
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
                const q = Math.floor(month / 3) * 3
                startDate = new Date(year, q, 1)
                endDate = new Date(year, q + 3, 0)
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
            default:
                return { startDate: null, endDate: null }
        }
        return { startDate, endDate }
    }

    const getFilteredConventions = (period, customStart = '', customEnd = '') => {
        const { startDate, endDate } = getPeriodDates(period, customStart, customEnd)
        if (!startDate && !endDate) return conventions
        return conventions.filter(c => {
            if (!c.date_signature) return false
            const convDate = new Date(c.date_signature)
            if (startDate && convDate < startDate) return false
            if (endDate && convDate > endDate) return false
            return true
        })
    }

    const filteredConventions = useMemo(() => {
        return getFilteredConventions(globalPeriod, customDateStart, customDateEnd)
    }, [conventions, globalPeriod, customDateStart, customDateEnd])

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

    // ✅ Générer les données
    const getDataForVariable = (xAxis, yAxis = 'count', period = 'all') => {
        const convs = getFilteredConventions(period, customDateStart, customDateEnd)
        let data = []

        switch (xAxis) {
            case 'statut':
                data = [
                    { name: t('status.EN_COURS'), value: convs.filter(c => c.statut === STATUTS.EN_COURS).length },
                    { name: t('status.EXPIREE'), value: convs.filter(c => c.statut === STATUTS.EXPIREE).length },
                    { name: t('status.A_RENOUVELER'), value: convs.filter(c => c.statut === STATUTS.A_RENOUVELER).length },
                    { name: t('status.RENOUVELEE'), value: convs.filter(c => c.statut === STATUTS.RENOUVELEES).length }
                ].filter(d => d.value > 0)
                break
            case 'type':
                data = Object.entries(convs.reduce((acc, c) => {
                    acc[c.type] = (acc[c.type] || 0) + 1
                    return acc
                }, {})).map(([name, value]) => ({ name, value }))
                break
            case 'annee':
                data = Object.entries(convs.reduce((acc, c) => {
                    if (!c.date_signature) return acc
                    const y = new Date(c.date_signature).getFullYear()
                    acc[y] = (acc[y] || 0) + 1
                    return acc
                }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => a.name - b.name)
                break
            case 'partenaire':
                const pc = {}
                convs.forEach(c => {
                    if (c.partenaires) c.partenaires.forEach(p => { pc[p.nom] = (pc[p.nom] || 0) + 1 })
                })
                data = Object.entries(pc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
                break
            case 'budget':
                const ab = convs.filter(c => c.avec_budget).length
                data = [
                    { name: t('conventions.withBudget'), value: ab },
                    { name: t('common.no'), value: convs.length - ab }
                ].filter(d => d.value > 0)
                break
            case 'validation':
                const v = convs.filter(c => c.validation_conseil).length
                data = [
                    { name: t('common.yes'), value: v },
                    { name: t('common.no'), value: convs.length - v }
                ].filter(d => d.value > 0)
                break
            case 'formation':
                const f = convs.filter(c => c.formation_continue).length
                data = [
                    { name: t('common.yes'), value: f },
                    { name: t('common.no'), value: convs.length - f }
                ].filter(d => d.value > 0)
                break
            case 'mois':
                const mc = {}
                convs.forEach(c => {
                    if (c.date_signature) {
                        const m = new Date(c.date_signature).toLocaleString(t('common.locale') || 'fr-FR', { month: 'long' })
                        mc[m] = (mc[m] || 0) + 1
                    }
                })
                data = Object.entries(mc).map(([name, value]) => ({ name, value }))
                break
            case 'etablissement':
            case 'signataire':
                const sc = {}
                convs.forEach(c => {
                    if (c.signataire_um5) sc[c.signataire_um5] = (sc[c.signataire_um5] || 0) + 1
                })
                data = Object.entries(sc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10)
                break
            default:
                data = []
        }
        return data
    }

    const getPeriodLabel = (period) => {
        const option = PERIOD_OPTIONS.find(p => p.value === period)
        return option ? t(option.labelKey) : period
    }

    const renderChart = (data, config) => {
        if (!data || data.length === 0) {
            return (
                <div className="w-full h-[280px] flex flex-col items-center justify-center text-gray-400">
                    <div className="text-4xl mb-2 opacity-60">📊</div>
                    <p className="text-sm font-medium">{t('dashboard.noData')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('dashboard.forThisPeriod')}</p>
                </div>
            )
        }

        const { type, colors, showLegend, showTooltip } = config
        const commonProps = { data, margin: { top: 20, right: 30, left: 20, bottom: 20 } }

        switch (type) {
            case 'pie':
                return (
                    <PieChart {...commonProps}>
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length] || colors[0]} />
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
                        <Line type="monotone" dataKey="value" stroke={colors[0] || '#003087'} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                )
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
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length] || colors[0]} />
                            ))}
                        </Bar>
                    </BarChart>
                )
        }
    }

    const copyChartToClipboard = async (widgetId) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) return
        setCopyStatus(prev => ({ ...prev, [widgetId]: 'loading' }))
        try {
            const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, allowTaint: true })
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'success' }))
                } catch (err) {
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
                } finally {
                    setTimeout(() => setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' })), 2000)
                }
            }, 'image/png')
        } catch (error) {
            setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' })), 2000)
        }
    }

    const downloadChartAsPNG = async (widgetId, title) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) return
        setDownloadStatus(prev => ({ ...prev, [widgetId]: 'loading' }))
        try {
            const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false, allowTaint: true })
            const link = document.createElement('a')
            link.download = `${title || 'chart'}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            setDownloadStatus(prev => ({ ...prev, [widgetId]: 'success' }))
            setTimeout(() => setDownloadStatus(prev => ({ ...prev, [widgetId]: 'idle' })), 2000)
        } catch (error) {
            setDownloadStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => setDownloadStatus(prev => ({ ...prev, [widgetId]: 'idle' })), 2000)
        }
    }

    const exportDashboardAsWord = async () => {
        try {
            const chartImages = []
            const chartTitles = []
            for (const widget of widgets) {
                const element = document.getElementById(`chart-${widget.id}`)
                if (element) {
                    const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 1.5, useCORS: true, logging: false, allowTaint: true })
                    chartImages.push(canvas.toDataURL('image/png'))
                    chartTitles.push(`${getWidgetTitle(widget)} (${getPeriodLabel(widget.period || globalPeriod)})`)
                }
            }

            let chartsHtml = ''
            chartImages.forEach((img, i) => {
                chartsHtml += `
                    <div style="page-break-inside: avoid; margin-bottom: 30px;">
                        <h3 style="font-size: 16px; color: #1a56db; margin-bottom: 10px;">${chartTitles[i]}</h3>
                        <img src="${img}" style="width: 100%; max-width: 1000px; display: block; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;" />
                    </div>
                `
            })

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${t('dashboard.title')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; margin: 40px; background: white; }
                        .header { text-align: center; border-bottom: 3px solid #1a56db; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { font-size: 26px; color: #1a56db; }
                        .header p { color: #666; font-size: 14px; }
                        h2 { font-size: 20px; color: #1a56db; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>📊 ${t('dashboard.title')}</h1>
                        <p>${t('dashboard.generatedOn')} ${new Date().toLocaleDateString()} - ${t('dashboard.period')}: ${getPeriodLabel(globalPeriod)}</p>
                    </div>
                    ${chartsHtml}
                    ${alertes.length > 0 ? `
                    <h2>🔔 ${t('dashboard.lastAlerts')}</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead><tr style="background: #1a56db; color: white;">
                            <th style="padding: 8px;">${t('alerts.message')}</th>
                            <th style="padding: 8px;">${t('alerts.date')}</th>
                        </tr></thead>
                        <tbody>
                            ${alertes.slice(0, 5).map(a => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 6px;">${a.objet || a.type_alerte}</td>
                                <td style="padding: 6px; text-align: center;">${formatDate(a.date_declenchement)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>` : ''}
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
            console.error(error)
            alert(t('common.error'))
        }
    }

    const getWidgetTitle = (widget) => widget.titleKey ? t(widget.titleKey) : widget.title

    const removeWidget = (id) => setWidgets(widgets.filter(w => w.id !== id))
    const restoreDefaults = () => setWidgets(Object.values(DEFAULT_WIDGETS))

    const saveConfig = (widgetId, newConfig) => {
        setWidgets(widgets.map(w => w.id === widgetId ? { ...w, ...newConfig } : w))
        setConfigModal(null)
    }

    const saveCustomWidget = () => {
        const data = getDataForVariable(newWidgetConfig.xAxis, 'count', newWidgetConfig.period || globalPeriod)
        if (data.length === 0) { alert(t('dashboard.noData')); return }

        const widgetData = {
            title: newWidgetConfig.title || t('dashboard.titleLabel'),
            type: newWidgetConfig.type,
            colors: [...newWidgetConfig.colors],
            xAxis: newWidgetConfig.xAxis,
            yAxis: newWidgetConfig.yAxis,
            showLegend: newWidgetConfig.showLegend,
            showTooltip: newWidgetConfig.showTooltip,
            period: newWidgetConfig.period || null,
            isDefault: false
        }

        if (editingWidget) {
            setWidgets(widgets.map(w => w.id === editingWidget ? { ...w, ...widgetData } : w))
            setEditingWidget(null)
        } else {
            setWidgets([...widgets, { id: `custom-${Date.now()}`, ...widgetData }])
        }

        setShowAddWidget(false)
        setNewWidgetConfig({
            title: '', type: 'bar', colors: ['#003087'], xAxis: 'statut',
            yAxis: 'count', showLegend: true, showTooltip: true, period: null
        })
    }

    // ✅ PeriodSelector responsive
    const PeriodSelector = ({ value, onChange, showCustom = false }) => (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500 flex-shrink-0" />
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                >
                    {PERIOD_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
                    ))}
                </select>
            </div>
            {value === 'custom' && showCustom && (
                <div className="flex items-center gap-2 mt-1">
                    <input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1 min-w-0" />
                    <span className="text-xs text-gray-400">→</span>
                    <input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs flex-1 min-w-0" />
                </div>
            )}
        </div>
    )

    const ConfigWidget = ({ widget, onClose, onSave }) => {
        const [localConfig, setLocalConfig] = useState(widget)
        return (
            <Modal isOpen={true} onClose={onClose}>
                <div className="p-4 sm:p-6 space-y-4 max-w-md w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings size={20} /> {t('dashboard.config')}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.chartType')}</label>
                        <select value={localConfig.type} onChange={(e) => setLocalConfig({ ...localConfig, type: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            {CHART_TYPES.map(ct => <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.titleLabel')}</label>
                        <input type="text" value={localConfig.title || ''} onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.period')}</label>
                        <select value={localConfig.period || ''} onChange={(e) => setLocalConfig({ ...localConfig, period: e.target.value || null })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">🎯 {t('dashboard.followGlobal')}</option>
                            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
                        </select>
                    </div>

                    {localConfig.type !== 'pie' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
                            <select value={localConfig.xAxis} onChange={(e) => setLocalConfig({ ...localConfig, xAxis: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                {Object.entries(X_AXIS_VARIABLES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('dashboard.colors')}</label>
                        <div className="flex flex-wrap gap-2">
                            {localConfig.colors.map((color, i) => (
                                <div key={i} className="relative group">
                                    <input type="color" value={color}
                                        onChange={(e) => {
                                            const nc = [...localConfig.colors]; nc[i] = e.target.value
                                            setLocalConfig({ ...localConfig, colors: nc })
                                        }}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200" />
                                    {localConfig.colors.length > 1 && (
                                        <button onClick={() => setLocalConfig({ ...localConfig, colors: localConfig.colors.filter((_, idx) => idx !== i) })}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100">×</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setLocalConfig({ ...localConfig, colors: [...localConfig.colors, '#000000'] })}
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">+</button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="checkbox" checked={localConfig.showLegend} onChange={(e) => setLocalConfig({ ...localConfig, showLegend: e.target.checked })} />
                            {t('dashboard.showLegend')}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="checkbox" checked={localConfig.showTooltip} onChange={(e) => setLocalConfig({ ...localConfig, showTooltip: e.target.checked })} />
                            {t('dashboard.showTooltip')}
                        </label>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                        <Button onClick={() => onSave(localConfig)}>{t('common.save')}</Button>
                    </div>
                </div>
            </Modal>
        )
    }

    if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>

    return (
        <div id="dashboard-container" className="space-y-4 sm:space-y-6">
            {/* ═══ HEADER ═══ */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportDashboardAsWord} className="flex items-center gap-2 text-xs sm:text-sm">
                        <FileText size={16} />
                        <span className="hidden sm:inline">{t('dashboard.exportWord')}</span>
                    </Button>
                    <Button variant="secondary" onClick={restoreDefaults} className="flex items-center gap-2 text-xs sm:text-sm">
                        <RotateCcw size={16} />
                        <span className="hidden sm:inline">{t('dashboard.restoreDefaults')}</span>
                    </Button>
                    <Button onClick={() => { setEditingWidget(null); setShowAddWidget(true) }} className="flex items-center gap-2 text-xs sm:text-sm">
                        <Plus size={16} />
                        <span className="hidden sm:inline">{t('dashboard.addChart')}</span>
                    </Button>
                </div>
            </div>

            {/* ═══ PÉRIODE GLOBALE ═══ */}
            <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-[#003087] flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{t('dashboard.globalPeriod')} :</span>
                    </div>
                    <PeriodSelector value={globalPeriod} onChange={setGlobalPeriod} showCustom={true} />
                    {globalPeriod !== 'all' && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-center sm:text-left">
                            {filteredConventions.length} / {conventions.length} {t('conventions.total')}
                        </span>
                    )}
                </div>
            </Card>

            {/* ═══ STATISTIQUES ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4 text-center">
                    <p className="text-xs sm:text-sm text-gray-500">{t('dashboard.totalConventions')}</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</h2>
                </Card>
                <Card className="p-3 sm:p-4 text-center border-l-4 border-l-green-500">
                    <p className="text-xs sm:text-sm text-gray-500">{t('dashboard.inProgress')}</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-green-600">{stats.enCours}</h2>
                </Card>
                <Card className="p-3 sm:p-4 text-center border-l-4 border-l-red-500">
                    <p className="text-xs sm:text-sm text-gray-500">{t('dashboard.expired')}</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-red-600">{stats.expirees}</h2>
                </Card>
                <Card className="p-3 sm:p-4 text-center border-l-4 border-l-yellow-500">
                    <p className="text-xs sm:text-sm text-gray-500">{t('dashboard.toRenew')}</p>
                    <h2 className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.aRenouveler}</h2>
                </Card>
            </div>

            {/* ═══ GRAPHIQUES ═══ */}
            {widgets.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <p className="text-gray-500 text-sm">{t('dashboard.noData')}</p>
                    <Button className="mt-4 mx-auto" onClick={() => setShowAddWidget(true)}>{t('dashboard.addChart')}</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                    {widgets.map((widget) => {
                        const effectivePeriod = globalPeriod !== 'all' ? globalPeriod : (widget.period || 'all')
                        const data = getDataForVariable(widget.xAxis || 'statut', 'count', effectivePeriod)
                        const copyStat = copyStatus[widget.id] || 'idle'
                        const downloadStat = downloadStatus[widget.id] || 'idle'

                        return (
                            <Card key={widget.id} className="p-3 sm:p-4">
                                <div className="flex items-start justify-between mb-3 gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">{getWidgetTitle(widget)}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                            📅 {getPeriodLabel(effectivePeriod)}
                                            {globalPeriod !== 'all' && <span className="text-blue-600 ms-1">({t('dashboard.global')})</span>}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => downloadChartAsPNG(widget.id, getWidgetTitle(widget))}
                                            className={`p-1 rounded ${downloadStat === 'success' ? 'text-green-500' : 'text-gray-400 hover:text-green-600'}`}
                                            disabled={downloadStat === 'loading'}>
                                            {downloadStat === 'success' ? '✅' : downloadStat === 'loading' ? '⏳' : <Download size={16} />}
                                        </button>
                                        <button onClick={() => copyChartToClipboard(widget.id)}
                                            className={`p-1 rounded ${copyStat === 'success' ? 'text-green-500' : 'text-gray-400 hover:text-blue-600'}`}
                                            disabled={copyStat === 'loading'}>
                                            {copyStat === 'success' ? '✅' : copyStat === 'loading' ? '⏳' : <Copy size={16} />}
                                        </button>
                                        <button onClick={() => setConfigModal(widget.id)} className="text-gray-400 hover:text-gray-600 p-1">
                                            <Settings size={16} />
                                        </button>
                                        <button onClick={() => removeWidget(widget.id)} className="text-gray-400 hover:text-red-600 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div id={`chart-${widget.id}`}>
                                    <ResponsiveContainer width="100%" height={250}>
                                        {renderChart(data, widget)}
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* ═══ ALERTES ═══ */}
            {alertes.length > 0 && (
                <Card className="p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('dashboard.lastAlerts')}</h3>
                    <div className="space-y-2">
                        {alertes.slice(0, 4).map((alerte) => (
                            <div key={alerte.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 last:border-0 gap-1">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPES_ALERTE_COLORS?.[alerte.type_alerte] || '#888' }} />
                                    <span className="text-xs sm:text-sm text-gray-700 truncate">{alerte.objet || alerte.type_alerte}</span>
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(alerte.date_declenchement)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modales */}
            {configModal && (
                <ConfigWidget widget={widgets.find(w => w.id === configModal)} onClose={() => setConfigModal(null)}
                    onSave={(newConfig) => saveConfig(configModal, newConfig)} />
            )}

            <Modal isOpen={showAddWidget} onClose={() => { setShowAddWidget(false); setEditingWidget(null) }}>
                <div className="p-4 sm:p-6 space-y-4 max-w-md w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                        {editingWidget ? <Edit size={20} /> : <Plus size={20} />}
                        {editingWidget ? t('common.edit') : t('dashboard.addChart')}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.titleLabel')}</label>
                        <input type="text" value={newWidgetConfig.title} onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, title: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.chartType')}</label>
                        <select value={newWidgetConfig.type} onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, type: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            {CHART_TYPES.map(ct => <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.period')}</label>
                        <select value={newWidgetConfig.period || ''} onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, period: e.target.value || null })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">🎯 {t('dashboard.followGlobal')}</option>
                            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
                        </select>
                    </div>

                    {newWidgetConfig.type !== 'pie' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
                            <select value={newWidgetConfig.xAxis} onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, xAxis: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                {Object.entries(X_AXIS_VARIABLES).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={() => { setShowAddWidget(false); setEditingWidget(null) }}>{t('common.cancel')}</Button>
                        <Button onClick={saveCustomWidget}>{editingWidget ? t('common.save') : t('common.add')}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}