import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Fichier(Base):
    __tablename__ = "fichiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom_fichier = Column(String, nullable=False)
    type_fichier = Column(String, nullable=True)  # PDF, Word, image...
    chemin = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=True)
    reunion_id = Column(UUID(as_uuid=True), ForeignKey("reunions.id"), nullable=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=True)


    # Relations
    convention = relationship("Convention", back_populates="fichiers")
    reunion = relationship("Reunion", back_populates="fichiers")
    budget = relationship("Budget", back_populates="fichiers_justificatifs")