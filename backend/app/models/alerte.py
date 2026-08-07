import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import TypeAlerte

# Table de liaison — alerte ↔ utilisateurs destinataires
alerte_destinataires = Table(
    "alerte_destinataires",
    Base.metadata,
    Column("alerte_id", UUID(as_uuid=True), ForeignKey("alertes.id")),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"))
)

class Alerte(Base):
    __tablename__ = "alertes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_alerte = Column(String, nullable=False)  # Utilise TypeAlerte
    date_declenchement = Column(Date, nullable=False)
    objet = Column(String, nullable=True)
    envoyee = Column(Boolean, default=False)
    traitee = Column(Boolean, default=False)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=False)
    
    # Champs optionnels pour les alertes de réunion
    comite_id = Column(UUID(as_uuid=True), ForeignKey("comites.id"), nullable=True)
    reunion_id = Column(UUID(as_uuid=True), ForeignKey("reunions.id"), nullable=True)

    # Relations
    convention = relationship("Convention", back_populates="alertes")
    comite = relationship("Comite", back_populates="alertes")
    reunion = relationship("Reunion", back_populates="alertes")
    destinataires = relationship("User", secondary=alerte_destinataires)