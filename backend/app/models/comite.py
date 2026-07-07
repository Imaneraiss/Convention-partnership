import uuid
from sqlalchemy import Column, String, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

# Table de liaison — comité ↔ utilisateurs internes
comite_destinataires_internes = Table(
    "comite_destinataires_internes",
    Base.metadata,
    Column("comite_id", UUID(as_uuid=True), ForeignKey("comites.id")),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"))
)

class Comite(Base):
    __tablename__ = "comites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)  # PILOTAGE, SUIVI, TECHNIQUE
    frequence = Column(String, nullable=True)  # Mensuelle, Trimestrielle...
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=False)

    # Relations
    convention = relationship("Convention", back_populates="comites")
    reunions = relationship("Reunion", back_populates="comite")
    destinataires_internes = relationship("User", secondary=comite_destinataires_internes)
    destinataires_externes = relationship("ComiteDestinataireExterne", back_populates="comite")

class ComiteDestinataireExterne(Base):
    __tablename__ = "comite_destinataires_externes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comite_id = Column(UUID(as_uuid=True), ForeignKey("comites.id"), nullable=False)
    email = Column(String, nullable=False)

    comite = relationship("Comite", back_populates="destinataires_externes")