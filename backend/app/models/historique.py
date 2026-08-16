import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Historique(Base):
    __tablename__ = "historique"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String, nullable=False)  # creation, modification, suppression, upload, download, consultation
    description = Column(Text, nullable=True)
    details = Column(Text, nullable=True)  # Peut contenir du JSON en string
    date_action = Column(DateTime, default=datetime.utcnow)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    statut = Column(String(20), nullable=True)  # success, warning, error
    user_agent = Column(String(255), nullable=True)

    # Relations
    convention = relationship("Convention", back_populates="historique")
    user = relationship("User", back_populates="historique")