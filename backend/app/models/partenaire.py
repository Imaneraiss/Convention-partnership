import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Partenaire(Base):
    __tablename__ = "partenaires"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    type = Column(String, nullable=False)  # ONG, PRIVE, PUBLIC, SEMI_PUBLIC
    ville = Column(String, nullable=True)
    region = Column(String, nullable=True)
    pays = Column(String, nullable=True)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=False)

    # Relation
    convention = relationship("Convention", back_populates="partenaires")