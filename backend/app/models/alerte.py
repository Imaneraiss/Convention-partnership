import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

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
    type_alerte = Column(String, nullable=False)  # FIN_CONVENTION, REUNION_COMITE, MANUELLE
    date_declenchement = Column(Date, nullable=False)
    objet = Column(String, nullable=True)
    envoyee = Column(Boolean, default=False)
    traitee = Column(Boolean, default=False)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=False)

    # Relations
    convention = relationship("Convention", back_populates="alertes")
    destinataires = relationship("User", secondary=alerte_destinataires)