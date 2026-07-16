from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Base HCP schema containing shared attributes
class HCPBase(BaseModel):
    name: str
    specialty: str
    clinic_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = "Active"
    notes: Optional[str] = None

# Schema used when creating a new HCP (requires name and specialty)
class HCPCreate(HCPBase):
    pass

# Schema used when updating an existing HCP's details
class HCPUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    clinic_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# Base Assessment schema containing shared attributes
class AssessmentBase(BaseModel):
    transcript: str

# Schema used to submit a new interaction transcript for an HCP
class AssessmentCreate(AssessmentBase):
    hcp_id: int

# Schema used to update analysis fields once LangGraph has processed the transcript
class AssessmentUpdate(BaseModel):
    summary: Optional[str] = None
    classification: Optional[str] = None
    confidence_score: Optional[float] = None
    report: Optional[Dict[str, Any]] = None


# Schema returned for Assessment queries
class AssessmentResponse(BaseModel):
    id: int
    hcp_id: int
    transcript: str
    summary: Optional[str] = None
    classification: Optional[str] = None
    confidence_score: Optional[float] = None
    report: Optional[Dict[str, Any]] = None
    created_at: datetime

    # from_attributes=True tells Pydantic to read ORM database models directly 
    # instead of just plain Python dictionaries
    model_config = {
        "from_attributes": True
    }


# Schema returned for HCP queries (includes a list of their assessments)
class HCPResponse(HCPBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assessments: List[AssessmentResponse] = []

    model_config = {
        "from_attributes": True
    }
