import { useState, useEffect } from 'react'
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
import { Settings, Plus, Trash2, Edit, RotateCcw, Copy, Download, FileText } from 'lucide-react'
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
        yAxis: 'count'
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
        yAxis: 'count'
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
        yAxis: 'count'
    }
}

export default function Dashboard() {
    const [conventions, setConventions] = useState([])
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)
    const [copyStatus, setCopyStatus] = useState({})
    const [downloadStatus, setDownloadStatus] = useState({})
    const [stats, setStats] = useState({
        total: 0,
        enCours: 0,
        expirees: 0,
        aRenouveler: 0,
        renouvelees: 0
    })

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
        showTooltip: true
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

            const enCours = convs.filter(c => c.statut === STATUTS.EN_COURS).length
            const expirees = convs.filter(c => c.statut === STATUTS.EXPIREE).length
            const aRenouveler = convs.filter(c => c.statut === STATUTS.A_RENOUVELER).length
            const renouvelees = convs.filter(c => c.statut === STATUTS.RENOUVELEE).length

            setStats({
                total: convs.length,
                enCours,
                expirees,
                aRenouveler,
                renouvelees
            })
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Générer les données selon la variable
    const getDataForVariable = (xAxis, yAxis = 'count') => {
        let data = []
        
        switch (xAxis) {
            case 'statut':
                data = [
                    { name: 'En cours', value: stats.enCours },
                    { name: 'Expirées', value: stats.expirees },
                    { name: 'À renouveler', value: stats.aRenouveler },
                    { name: 'Renouvelées', value: stats.renouvelees }
                ].filter(d => d.value > 0)
                break

            case 'type':
                data = Object.entries(
                    conventions.reduce((acc, c) => {
                        acc[c.type] = (acc[c.type] || 0) + 1
                        return acc
                    }, {})
                ).map(([name, value]) => ({ name, value }))
                break

            case 'annee':
                data = Object.entries(
                    conventions.reduce((acc, c) => {
                        const year = new Date(c.date_signature).getFullYear()
                        acc[year] = (acc[year] || 0) + 1
                        return acc
                    }, {})
                ).map(([name, value]) => ({ name, value })).sort((a, b) => a.name - b.name)
                break

            case 'partenaire':
                const partenaireCount = {}
                conventions.forEach(c => {
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
                const avecBudget = conventions.filter(c => c.avec_budget).length
                const sansBudget = conventions.length - avecBudget
                data = [
                    { name: 'Avec budget', value: avecBudget },
                    { name: 'Sans budget', value: sansBudget }
                ].filter(d => d.value > 0)
                break

            case 'validation':
                const valide = conventions.filter(c => c.validation_conseil).length
                const nonValide = conventions.length - valide
                data = [
                    { name: 'Validé', value: valide },
                    { name: 'Non validé', value: nonValide }
                ].filter(d => d.value > 0)
                break

            case 'formation':
                const avecFormation = conventions.filter(c => c.formation_continue).length
                const sansFormation = conventions.length - avecFormation
                data = [
                    { name: 'Avec formation', value: avecFormation },
                    { name: 'Sans formation', value: sansFormation }
                ].filter(d => d.value > 0)
                break

            case 'mois':
                const moisCount = {}
                conventions.forEach(c => {
                    if (c.date_signature) {
                        const mois = new Date(c.date_signature).toLocaleString('fr-FR', { month: 'long' })
                        moisCount[mois] = (moisCount[mois] || 0) + 1
                    }
                })
                data = Object.entries(moisCount).map(([name, value]) => ({ name, value }))
                break

            case 'etablissement':
                const etabCount = {}
                conventions.forEach(c => {
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
                conventions.forEach(c => {
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

    // Rendu du graphique
    const renderChart = (data, config) => {
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    Aucune donnée disponible
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

    // Copier le graphique dans le presse-papiers
    const copyChartToClipboard = async (widgetId) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) {
            alert('Graphique non trouvé')
            return
        }

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
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ])
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'success' }))
                    setTimeout(() => {
                        setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
                    }, 2000)
                } catch (err) {
                    console.error('Erreur copie:', err)
                    setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
                    setTimeout(() => {
                        setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
                    }, 2000)
                }
            }, 'image/png')
        } catch (error) {
            console.error('Erreur:', error)
            setCopyStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => {
                setCopyStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
            }, 2000)
        }
    }

    // Télécharger le graphique en PNG
    const downloadChartAsPNG = async (widgetId, title) => {
        const element = document.getElementById(`chart-${widgetId}`)
        if (!element) {
            alert('Graphique non trouvé')
            return
        }

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
            console.error('Erreur:', error)
            setDownloadStatus(prev => ({ ...prev, [widgetId]: 'error' }))
            setTimeout(() => {
                setDownloadStatus(prev => ({ ...prev, [widgetId]: 'idle' }))
            }, 2000)
        }
    }

    // ✅ Exporter le dashboard en Word (.doc)
    // ✅ Exporter en Word avec les graphiques réels (capture des widgets)
    const exportDashboardAsWord = async () => {
        try {
            // 1. Capturer chaque graphique individuellement
            const chartImages = []
            const chartTitles = []

            for (const widget of widgets) {
                const element = document.getElementById(`chart-${widget.id}`)
                if (element) {
                    // Capturer le graphique avec html2canvas
                    const canvas = await html2canvas(element, {
                        backgroundColor: '#ffffff',
                        scale: 1.5,
                        useCORS: true,
                        logging: false,
                        allowTaint: true,
                        onclone: (doc) => {
                            // Remplacer les couleurs oklch
                            doc.querySelectorAll('*').forEach(el => {
                                const computed = window.getComputedStyle(el)
                                const bg = computed.backgroundColor
                                if (bg && bg.includes('oklch')) {
                                    el.style.backgroundColor = '#ffffff'
                                }
                            })
                        }
                    })
                    chartImages.push(canvas.toDataURL('image/png'))
                    chartTitles.push(widget.title)
                }
            }

            // 2. Construire le document Word avec les images des graphiques
            let chartsHtml = ''
            chartImages.forEach((img, index) => {
                chartsHtml += `
                    <div style="page-break-inside: avoid; margin-bottom: 30px;">
                        <h3 style="font-size: 16px; color: #1a56db; margin-bottom: 10px;">${chartTitles[index]}</h3>
                        <img src="${img}" alt="${chartTitles[index]}" style="width: 100%; max-width: 1000px; display: block; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;" />
                    </div>
                `
            })

            // 3. Construire le HTML complet
            const html = `
                <!DOCTYPE html>
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                    xmlns:w='urn:schemas-microsoft-com:office:word' 
                    xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="UTF-8">
                    <title>Rapport Dashboard</title>
                    <!--[if gte mso 9]>
                    <xml>
                        <w:WordDocument>
                            <w:View>Print</w:View>
                            <w:Zoom>100</w:Zoom>
                        </w:WordDocument>
                    </xml>
                    <![endif]-->
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 40px; 
                            margin: 40px;
                            background: white;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 3px solid #1a56db;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .header h1 {
                            font-size: 26px;
                            color: #1a56db;
                            margin: 0;
                        }
                        .header p {
                            color: #666;
                            font-size: 14px;
                            margin: 5px 0 0;
                        }
                        .header .stats {
                            margin-top: 10px;
                            display: flex;
                            justify-content: center;
                            gap: 30px;
                        }
                        .header .stats span {
                            font-weight: bold;
                        }
                        .stat-item {
                            display: inline-block;
                            padding: 5px 15px;
                            border-radius: 4px;
                        }
                        .stat-total { background: #e5e7eb; }
                        .stat-cours { background: #d1fae5; color: #0F6E56; }
                        .stat-expire { background: #fecaca; color: #993C1D; }
                        .stat-renouveler { background: #fef3c7; color: #BA7517; }
                        h2 {
                            font-size: 20px;
                            color: #1a56db;
                            margin-top: 30px;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #e5e7eb;
                            padding-bottom: 10px;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 11px;
                            color: #999;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                    </style>
                </head>
                <body>
                    <!-- HEADER -->
                    <div class="header">
                        <h1> Rapport du Dashboard</h1>
                        <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                       
                    </div>

                    <!-- GRAPHIQUES -->
                    ${chartsHtml}

                    <!-- ALERTES -->
                    ${alertes.length > 0 ? `
                    <h2>🔔 Dernières alertes</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #1a56db; color: white;">
                                <th style="padding: 8px 12px; text-align: left;">Niveau</th>
                                <th style="padding: 8px 12px; text-align: left;">Message</th>
                                <th style="padding: 8px 12px; text-align: center;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alertes.slice(0, 5).map(alerte => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 6px 12px;">●</td>
                                <td style="padding: 6px 12px;">${alerte.objet || alerte.type_alerte}</td>
                                <td style="padding: 6px 12px; text-align: center;">${formatDate(alerte.date_declenchement)}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ` : ''}

                    
                </body>
                </html>
            `

            // Télécharger en Word (.doc)
            const blob = new Blob([html], { 
                type: 'application/msword;charset=utf-8' 
            })
            const link = document.createElement('a')
            link.download = `dashboard_${new Date().toISOString().split('T')[0]}.doc`
            link.href = URL.createObjectURL(blob)
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (error) {
            console.error('Erreur export Word:', error)
            alert('Erreur lors de l\'export. Les graphiques sont trop complexes à capturer.')
        }
    }

    // Supprimer un widget
    const removeWidget = (id) => {
        setWidgets(widgets.filter(w => w.id !== id))
    }

    // Restaurer les widgets par défaut
    const restoreDefaults = () => {
        setWidgets(Object.values(DEFAULT_WIDGETS))
    }

    // Sauvegarder la configuration d'un widget
    const saveConfig = (widgetId, newConfig) => {
        setWidgets(widgets.map(w => 
            w.id === widgetId ? { ...w, ...newConfig } : w
        ))
        setConfigModal(null)
    }

    // Ajouter ou modifier un widget personnalisé
    const saveCustomWidget = () => {
        const data = getDataForVariable(newWidgetConfig.xAxis)
        if (data.length === 0) {
            alert('Aucune donnée disponible pour cette variable')
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
            showTooltip: true
        })
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
                            placeholder="Titre du graphique"
                        />
                    </div>

                    {localConfig.type !== 'pie' && (
                        <>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Axe Y (valeurs)
                                </label>
                                <select
                                    value={localConfig.yAxis}
                                    onChange={(e) => setLocalConfig({ ...localConfig, yAxis: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                >
                                    <option value="count">Nombre de conventions</option>
                                    <option value="pourcentage">Pourcentage</option>
                                </select>
                            </div>
                        </>
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
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                    />
                                    {localConfig.colors.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newColors = localConfig.colors.filter((_, i) => i !== index)
                                                setLocalConfig({ ...localConfig, colors: newColors })
                                            }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Supprimer cette couleur"
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
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Cliquez sur une couleur pour la modifier, sur × pour la supprimer</p>
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
            {/* Header avec bouton Exporter Word */}
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
                    <Button className="mt-4" onClick={() => setShowAddWidget(true)}>
                        Ajouter un graphique
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {widgets.map((widget) => {
                        const data = getDataForVariable(widget.xAxis || 'statut')
                        const copyStat = copyStatus[widget.id] || 'idle'
                        const downloadStat = downloadStatus[widget.id] || 'idle'
                        
                        return (
                            <Card key={widget.id} className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
                                    <div className="flex gap-1">
                                        {/* Bouton Télécharger */}
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
                                        
                                        {/* Bouton Copier */}
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
                                        
                                        {/* Bouton Configurer */}
                                        <button
                                            onClick={() => setConfigModal(widget.id)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                                            title="Configurer"
                                        >
                                            <Settings size={18} />
                                        </button>
                                        
                                        {/* Bouton Supprimer */}
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

            {/* Modal de configuration */}
            {configModal && (
                <ConfigWidget
                    widget={widgets.find(w => w.id === configModal)}
                    onClose={() => setConfigModal(null)}
                    onSave={(newConfig) => saveConfig(configModal, newConfig)}
                />
            )}

            {/* Modal d'ajout/modification de widget */}
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
                            placeholder="Titre du graphique"
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

                    {newWidgetConfig.type !== 'pie' && (
                        <>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Axe Y (valeurs)
                                </label>
                                <select
                                    value={newWidgetConfig.yAxis}
                                    onChange={(e) => setNewWidgetConfig({ ...newWidgetConfig, yAxis: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                                >
                                    <option value="count">Nombre de conventions</option>
                                    <option value="pourcentage">Pourcentage</option>
                                </select>
                            </div>
                        </>
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
                                        className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                    />
                                    {newWidgetConfig.colors.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newColors = newWidgetConfig.colors.filter((_, i) => i !== index)
                                                setNewWidgetConfig({ ...newWidgetConfig, colors: newColors })
                                            }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            title="Supprimer cette couleur"
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
                                className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Cliquez sur une couleur pour la modifier, sur × pour la supprimer</p>
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