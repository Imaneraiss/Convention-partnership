import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ROLES } from './utils/constants'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ConventionsList from './pages/Conventions/ConventionsList'
import ConventionUpload from './pages/Conventions/ConventionUpload'
import ConventionEditor from './pages/Conventions/ConventionForm'
import Alertes from './pages/Alertes'
import Historique from './pages/Historique'
import GestionComptes from './pages/GestionComptes'
import Statistiques from './pages/Statistiques'
import ChangePassword from './pages/ChangePassword'
// Layout
import Layout from './components/layout/Layout'
import ConventionForm from './pages/Conventions/ConventionForm'
// Route protégée — redirige vers login si pas connecté
function PrivateRoute({ children, allowedRoles, adminOnly }) {
    const { isAuthenticated, user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <div>Chargement...</div>

    if (!isAuthenticated) return <Navigate to="/login" />
    
    if (user?.premiere_connexion && location.pathname !== "/change-password") {
        return <Navigate to="/change-password" replace />;
    }
    // Vérifie le rôle
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/dashboard" />
    }

    // Vérifie si admin requis
    if (adminOnly && !user?.is_admin) {
        return <Navigate to="/dashboard" />
    }

    return children
}

// Routes principales
function AppRoutes() {
    const { user } = useAuth()

    return (
        <Routes>
            {/* Route publique */}
            <Route path="/login" element={<Login />} />
            
            <Route path="change-password" element={<ChangePassword />} />

            {/* Routes privées — avec Layout */}
            <Route path="/" element={
                <PrivateRoute>
                    <Layout />
                </PrivateRoute>
            }>
            {/* Dashboard — tous les rôles */}
            <Route index element={<Navigate to="/dashboard" />} />

            <Route path="dashboard" element={<Dashboard />} />
            
            
            
            {/* Statistiques — Chargé + Président */}
            <Route path="statistiques" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE, ROLES.PRESIDENT]}>
                    <Statistiques />
                </PrivateRoute>
            } />
            {/* Conventions — Chargé + Président */}
            <Route path="conventions" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE, ROLES.PRESIDENT, , ROLES.SG]}>
                    <ConventionsList />
                </PrivateRoute>
            } />
            <Route path="conventions/:id" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE, ROLES.PRESIDENT, ROLES.SG]}>
                    <ConventionForm />
                </PrivateRoute>
            } />
            <Route path="conventions/new" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE]}>
                    <ConventionUpload />
                </PrivateRoute>
                }
            />          
            <Route path="conventions/form" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE]}>
                    <ConventionForm/>
                </PrivateRoute>
                }
            />
            {/* Alertes — Chargé uniquement */}
            <Route path="alertes" element={
                <PrivateRoute allowedRoles={[ROLES.CHARGE]}>
                    <Alertes />
                </PrivateRoute>
            } />

            {/* Historique — Admin uniquement */}
            <Route path="historique" element={
                <PrivateRoute adminOnly={true}>
                    <Historique />
                </PrivateRoute>
            } />

            {/* Gestion comptes — Admin uniquement */}
            <Route path="gestion-comptes" element={
                <PrivateRoute adminOnly={true}>
                    <GestionComptes />
                </PrivateRoute>
            } />
            </Route>

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    )
}

// ─────────────────────────────────────────
// App principale
// ─────────────────────────────────────────
function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App