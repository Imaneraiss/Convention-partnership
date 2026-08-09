# app/models/fichier.py
import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Fichier(Base):
    __tablename__ = "fichiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom_fichier = Column(String(255), nullable=False)
    type_fichier = Column(String(100), nullable=True)
    taille = Column(Integer, nullable=True)  # Taille en octets
    chemin = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id", ondelete="CASCADE"), nullable=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=True)

    # Relations
    convention = relationship("Convention", back_populates="fichiers")
    budget = relationship("Budget", back_populates="fichiers_justificatifs")