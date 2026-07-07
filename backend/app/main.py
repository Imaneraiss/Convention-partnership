
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import conventions

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
app.include_router(conventions.router)

@app.get("/")
def root():
    return {"message": "API Convention Partnership — UM5 ✅"}