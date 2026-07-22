import { Outlet } from "react-router-dom"
import Sidebar from "./SideBar"
import Header from "./Header"

export default function Layout() {
    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            
            {/* Sidebar gauche */}
            <Sidebar />

            {/* Contenu principal */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* Header en haut */}
                <Header />

                {/* Contenu de la page courante */}
                <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    <Outlet />
                </main>

            </div>
        </div>
    )
}