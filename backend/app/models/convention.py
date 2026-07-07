import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class StatutConvention(enum.Enum):
    EN_COURS = "EN_COURS"
    EXPIREE = "EXPIREE"
    RENOUVELEE = "RENOUVELEE"

class Convention(Base):
    __tablename__ = "conventions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero_reference = Column(String, unique=True, nullable=False)
    intitule = Column(String, nullable=False)
    type = Column(String, nullable=False)
    date_signature = Column(Date, nullable=False)
    date_expiration = Column(Date, nullable=True)
    statut = Column(String, default="EN_COURS")
    mode_renouvellement = Column(String, nullable=True)
    avec_budget = Column(Boolean, default=False)
    validation_conseil = Column(Boolean, default=False)
    formation_continue = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relations
    user = relationship("User", back_populates="conventions")
    partenaires = relationship("Partenaire", back_populates="convention")
    comites = relationship("Comite", back_populates="convention")
    fichiers = relationship("Fichier", back_populates="convention")
    alertes = relationship("Alerte", back_populates="convention")
    budget = relationship("Budget", back_populates="convention", uselist=False)
    historique = relationship("Historique", back_populates="convention")