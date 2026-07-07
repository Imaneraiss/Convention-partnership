import uuid
from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Reunion(Base):
    __tablename__ = "reunions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date_reunion = Column(Date, nullable=False)
    decisions = Column(Text, nullable=True)
    comite_id = Column(UUID(as_uuid=True), ForeignKey("comites.id"), nullable=False)

    # Relations
    comite = relationship("Comite", back_populates="reunions")
    fichiers = relationship("Fichier", back_populates="reunion")