import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import Header from "./Header";
import { Menu } from "lucide-react";

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f5f3ef]">
            {/* ═══════════ SIDEBAR DESKTOP (fixe, ≥ lg) ═══════════ */}
            <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 z-30 border-r border-gray-200 bg-white">
                <Sidebar />
            </aside>

            {/* ═══════════ SIDEBAR MOBILE (drawer, < lg) ═══════════ */}
            {sidebarOpen && (
                <>
                    {/* Backdrop noir */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Sidebar drawer */}
                    <aside className="fixed left-0 top-0 h-screen w-64 z-50 lg:hidden bg-white shadow-xl animate-slide-in">
                        <Sidebar
                            isOpen={sidebarOpen}
                            onClose={() => setSidebarOpen(false)}
                        />
                    </aside>
                </>
            )}

            {/* ═══════════ CONTENU PRINCIPAL ═══════════ */}
            <div className="lg:ml-64 flex flex-col min-h-screen">
                
                {/* Header avec bouton hamburger (mobile) */}
                <div className="relative">
                    {/* Bouton hamburger visible seulement sur mobile */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="
                            lg:hidden 
                            fixed top-4 left-4 
                            z-20 
                            p-2 
                            bg-white 
                            rounded-lg 
                            shadow-md 
                            hover:bg-gray-50 
                            transition-colors
                        "
                        aria-label="Ouvrir le menu"
                    >
                        <Menu size={20} className="text-gray-700" />
                    </button>

                    <Header />
                </div>

                {/* Contenu de la page */}
                <main className="flex-1 p-4 sm:p-6 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}