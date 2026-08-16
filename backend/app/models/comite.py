import uuid
from sqlalchemy import JSON, Column, String, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Comite(Base):
    __tablename__ = "comites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    frequence = Column(String, nullable=True)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id", ondelete="CASCADE"), nullable=False)    
    taches = Column(JSON, nullable=False, default=list)
    reunions = Column(JSON, nullable=False, default=list)  # ✅ Présent
    membres_um5 = Column(JSON, nullable=False, default=list)
    membres_partenaires = Column(JSON, nullable=False, default=list)
    
    date_debut = Column(Date, nullable=True)
    prochaine_reunion = Column(Date, nullable=True)

    convention = relationship("Convention", back_populates="comites")
    alertes = relationship("Alerte", back_populates="comite")