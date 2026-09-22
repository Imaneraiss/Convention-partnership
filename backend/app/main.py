from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import conventions
from app.routers import alertes, budget, comites, fichiers, users, auth
from app.routers import historique
from app.routers import statistiques
from app.routers import partenaires
from app.routers import notifications
from app.services.scheduler_service import start_scheduler, stop_scheduler

# ═══════════════════════════════════════════════════════════
# CONFIGURATION DU LOGGING (pour voir les logs du scheduler)
# ═══════════════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# ═══════════════════════════════════════════════════════════
# LIFESPAN — Démarrer/arrêter le scheduler avec l'app
# ═══════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Cycle de vie de l'application : démarre le scheduler au lancement"""
    print("=" * 60)
    print("🚀 DÉMARRAGE DE L'APPLICATION")
    print("=" * 60)
    start_scheduler()          # ⬅️ Démarrer le scheduler
    yield
    print("=" * 60)
    print("🛑 ARRÊT DE L'APPLICATION")
    print("=" * 60)
    stop_scheduler()           # ⬅️ Arrêter le scheduler


# ═══════════════════════════════════════════════════════════
# APPLICATION FASTAPI
# ═══════════════════════════════════════════════════════════
app = FastAPI(
    title="Convention Partnership API",
    description="Application de gestion des conventions de partenariat - UM5",
    version="1.0.0",
    lifespan=lifespan          # ⬅️ AJOUTER
)

# ═══════════════════════════════════════════════════════════
# CORS
# ═══════════════════════════════════════════════════════════
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════
# ROUTERS
# ═══════════════════════════════════════════════════════════
app.include_router(auth.router)
app.include_router(conventions.router)
app.include_router(users.router)
app.include_router(comites.router)
app.include_router(alertes.router)
app.include_router(budget.router)
app.include_router(fichiers.router)
app.include_router(historique.router)
app.include_router(statistiques.router)
app.include_router(partenaires.router)
app.include_router(notifications.router)


# ═══════════════════════════════════════════════════════════
# ROOT
# ═══════════════════════════════════════════════════════════
@app.get("/")
def root():
    return {"message": "API Convention Partnership — UM5"}


# ═══════════════════════════════════════════════════════════
# ENDPOINT DE TEST — À RETIRER EN PRODUCTION
# ═══════════════════════════════════════════════════════════
@app.post("/_test_scheduler")
def test_scheduler():
    """
    Déclenche manuellement les 2 jobs du scheduler
    pour tester SANS attendre 08h00
    """
    from app.services.scheduler_service import (
        check_expiration_job,
        check_reunions_job
    )
    print("\n" + "🧪" * 30)
    print("🧪 TEST MANUEL DU SCHEDULER")
    print("🧪" * 30)

    check_expiration_job()
    check_reunions_job()

    return {
        "status": "✅ Jobs exécutés",
        "message": "Regarde les logs Docker pour les détails"
    }