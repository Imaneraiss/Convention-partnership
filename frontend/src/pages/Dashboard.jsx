import { useState, useEffect } from 'react'
import { getConventions } from '../services/conventionService'
import { getAlertes } from '../services/alerteService'
import { formatDate } from '../utils/formatDate'
import { STATUTS, STATUTS_COLORS, TYPES_ALERTE_COLORS } from '../utils/constants'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function Dashboard() {
    const [conventions, setConventions] = useState([])
    const [alertes, setAlertes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [convData, alertData] = await Promise.all([
                getConventions(),
                getAlertes()
            ])
            setConventions(convData.data)
            setAlertes(alertData.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Calcul des stats
    const stats = {
        total: conventions.length,
        enCours: conventions.filter(c => c.statut === STATUTS.EN_COURS).length,
        expirees: conventions.filter(c => c.statut === STATUTS.EXPIREE).length,
        aRenouveler: conventions.filter(c => c.statut === STATUTS.A_RENOUVELER).length
    }

    // Données pour graphique répartition par statut
    const dataStatuts = [
        { name: 'En cours', value: stats.enCours, color: '#0F6E56' },
        { name: 'Expirées', value: stats.expirees, color: '#993C1D' },
        { name: 'À renouveler', value: stats.aRenouveler, color: '#BA7517' },
    ]

    // Données pour graphique par type
    const dataTypes = Object.entries(
        conventions.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1
            return acc
        }, {})
    ).map(([name, value]) => ({ name, value }))

    // Données pour graphique par année
    const dataAnnees = Object.entries(
        conventions.reduce((acc, c) => {
            const year = new Date(c.date_signature).getFullYear()
            acc[year] = (acc[year] || 0) + 1
            return acc
        }, {})
    ).map(([name, value]) => ({ name, value }))

    if (loading) return <div>Chargement...</div>

return (
    <div className="min-h-screen">

        {/* Cards statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">

            <div className="rounded p-5 border border-blue-50 flex flex-col gap-2.5">
                <p className="text-gray-500  font-griffy">Total conventions</p>
                <h2 className="text-3xl font-griffy text-gray-800">
                    {stats.total}
                </h2>
            </div>

            <div className="rounded p-5 border border-blue-50 flex flex-col gap-2.5">
                <p className="text-gray-500 font-griffy">En cours</p>
                <h2 className="text-3xl font-griffy">
                    {stats.enCours}
                </h2>
            </div>

            <div className="rounded p-5 border border-blue-50 flex flex-col gap-2.5 ">
                <p className="text-gray-500 font-griffy">Expirées</p>
                <h2 className="text-3xl font-griffy">
                    {stats.expirees}
                </h2>
            </div>

            <div className="rounded p-5 border border-blue-50 flex flex-col gap-2.5">
                <p className="text-gray-500  font-griffy" >À renouveler</p>
                <h2 className="text-3xl font-griffy">
                    {stats.aRenouveler}
                </h2>
            </div>

        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-blue-50 p-5">
                <h3 className="text-lg font-semibold mb-4">
                    Répartition par statut
                </h3>

                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={dataStatuts}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                        >
                            {dataStatuts.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>

                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-blue-50 p-5">
                <h3 className="text-lg font-semibold mb-4">
                    Répartition par type
                </h3>

                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dataTypes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                            dataKey="value"
                            fill="#003087"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

        </div>

        {/* Graphique annuel */}
        <div className="bg-white rounded-xl border border-blue-50 p-5 mb-6">

            <h3 className="text-lg font-semibold mb-4">
                Conventions par année
            </h3>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataAnnees}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                        dataKey="value"
                        fill="#003087"
                    />
                </BarChart>
            </ResponsiveContainer>

        </div>

        {/* Alertes */}
        <div className="bg-white rounded-xl border border-blue-50 p-5">

            <h3 className="text-lg font-semibold mb-4">
                Dernières alertes
            </h3>

            {alertes.slice(0, 4).map((alerte) => (
                <div
                    key={alerte.id}
                    className="flex items-center border-b border-gray-200 py-3"
                >
                    <span
                        className="text-xl mr-3"
                        style={{
                            color:
                                TYPES_ALERTE_COLORS[
                                    alerte.type_alerte
                                ],
                        }}
                    >
                        ●
                    </span>

                    <span>
                        {alerte.objet || alerte.type_alerte}
                    </span>

                    <span className="ml-auto text-sm text-gray-500">
                        {formatDate(
                            alerte.date_declenchement
                        )}
                    </span>
                </div>
            ))}

        </div>

    </div>
)
}