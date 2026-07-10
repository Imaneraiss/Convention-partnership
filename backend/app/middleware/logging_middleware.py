from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.database import SessionLocal
from app.models.historique import Historique
from jose import jwt, JWTError
import uuid
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# Actions à tracer automatiquement
ACTIONS_MAP = {
    ("POST", "/api/conventions"): "CREATION_CONVENTION",
    ("DELETE", "/api/conventions"): "SUPPRESSION_CONVENTION",
    ("POST", "/api/users"): "CREATION_COMPTE",
    ("DELETE", "/api/users"): "SUPPRESSION_COMPTE",
    ("POST", "/api/comites"): "CREATION_COMITE",
    ("DELETE", "/api/comites"): "SUPPRESSION_COMITE",
    ("POST", "/api/reunions"): "CREATION_REUNION",
    ("DELETE", "/api/reunions"): "SUPPRESSION_REUNION",
    ("POST", "/api/alertes"): "CREATION_ALERTE",
    ("PATCH", "/api/alertes"): "TRAITEMENT_ALERTE",
    ("POST", "/api/fichiers/upload"): "UPLOAD_FICHIER",
    ("DELETE", "/api/fichiers"): "SUPPRESSION_FICHIER",
    ("POST", "/api/budgets"): "CREATION_BUDGET",
}

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        # Exécute la requête normalement
        response = await call_next(request)

        # Enregistre seulement si succès (2xx) et pas une modification (PUT)
        if response.status_code < 300 and request.method != "PUT":

            method = request.method
            path = request.url.path

            # Trouve l'action correspondante
            action = None
            for (m, p), a in ACTIONS_MAP.items():
                if method == m and path.startswith(p):
                    action = a
                    break

            if action:
                # Récupère user_id depuis le token JWT
                user_id = None
                token = request.headers.get("Authorization", "").replace("Bearer ", "")
                if token:
                    try:
                        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                        user_id = payload.get("user_id")
                    except JWTError:
                        pass

                # Enregistre dans la BDD
                if user_id:
                    db = SessionLocal()
                    try:
                        historique = Historique(
                            id=uuid.uuid4(),
                            action=action,
                            details=f"{method} {path}",
                            user_id=user_id
                        )
                        db.add(historique)
                        db.commit()
                    finally:
                        db.close()

        return response