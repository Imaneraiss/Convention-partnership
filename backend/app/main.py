
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import conventions
from backend.app import auth
from backend.app.routers import alertes, budget, comites, fichiers, reunions, users
from app.middleware.logging_middleware import LoggingMiddleware 
from app.routers import historique
app = FastAPI(
    title="Convention Partnership API",
    description="Application de gestion des conventions de partenariat - UM5",
    version="1.0.0"
)

# Configuration CORS — permet au frontend React de communiquer avec le backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routers
app.add_middleware(LoggingMiddleware)
app.include_router(auth.router)
app.include_router(conventions.router)
app.include_router(users.router)
app.include_router(comites.router)
app.include_router(reunions.router)
app.include_router(alertes.router)
app.include_router(budget.router)
app.include_router(fichiers.router)
app.include_router(historique.router)
@app.get("/")
def root():
    return {"message": "API Convention Partnership — UM5 "}