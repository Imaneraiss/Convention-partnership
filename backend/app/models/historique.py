import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Historique(Base):
    __tablename__ = "historique"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String, nullable=False)
    date_action = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)
    convention_id = Column(UUID(as_uuid=True), ForeignKey("conventions.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relations
    convention = relationship("Convention", back_populates="historique")
    user = relationship("User", back_populates="historique")