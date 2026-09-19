import uuid
from sqlalchemy import Column, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=True)               
    email = Column(String, unique=True, nullable=False)
    mot_de_passe = Column(String, nullable=False)
    role = Column(String, nullable=False)                # CHARGE, SG, PRESIDENT
    is_admin = Column(Boolean, default=False)
    premiere_connexion = Column(Boolean, default=True)
    telephone = Column(String, nullable=True)            
    actif = Column(Boolean, default=True)                

    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    conventions = relationship("Convention", back_populates="user")
    historique = relationship("Historique", back_populates="user")