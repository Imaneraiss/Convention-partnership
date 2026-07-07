import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    montant = Column(Float, nullable=True)
    modalites_paiement = Column(Text, nullable=True)
    budget_recu = Column(String, nullable=True)  # OUI, NON, PARTIELLEMENT
    montant_depense = Column(Float, default=0.0)
    reste_a_payer = Column(Float, default=0.0)
    commentaire = Column(Text, nullable=True)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=False)

    # Relation
    convention = relationship("Convention", back_populates="budget")
    fichiers_justificatifs = relationship("Fichier", back_populates="budget")