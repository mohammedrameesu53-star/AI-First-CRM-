from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class HCP(Base):
    # Represents the Healthcare Professional in our CRM
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    specialty = Column(String, nullable=False, index=True)
    clinic_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    status = Column(String, default="Active")  # e.g., Active, Inactive
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship linking back to assessments performed on this HCP
    assessments = relationship("Assessment", back_populates="hcp", cascade="all, delete-orphan")


class Assessment(Base):
    # Represents an assessment report generated from transcripts by our AI agent
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False)
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    classification = Column(String, nullable=True)  # e.g., High-Value, Lead, Low-Priority
    confidence_score = Column(Float, nullable=True)
    report = Column(JSON, nullable=True)            # Stores structured metrics (sentiment, needs, followups)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to the HCP
    hcp = relationship("HCP", back_populates="assessments")
