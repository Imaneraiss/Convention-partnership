from app.database import SessionLocal
from app.models.user import User
from app.auth import hash_password
import uuid

def create_admin():
    db = SessionLocal()
    existing = db.query(User).filter(User.email == "admin@um5.ac.ma").first()
    if not existing:
        admin = User(
            id=uuid.uuid4(),
            nom="Admin",
            email="admin@um5.ac.ma",
            mot_de_passe=hash_password("admin123"),
            role="CHARGE",
            is_admin=True,
            premiere_connexion=False
        )
        db.add(admin)
        db.commit()
        print(" Compte admin créé !")
    else:
        print("Admin déjà existant")
    db.close()

if __name__ == "__main__":
    create_admin()