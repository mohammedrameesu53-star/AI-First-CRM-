from sqlalchemy.orm import Session
from app.models.hcp import HCP, Assessment
from app.schemas.hcp import HCPCreate, HCPUpdate, AssessmentCreate, AssessmentUpdate
from typing import List, Optional

class HCPService:
    @staticmethod
    def get_hcp(db: Session, hcp_id: int) -> Optional[HCP]:
        # Retrieve a single Healthcare Professional by their database ID
        return db.query(HCP).filter(HCP.id == hcp_id).first()

    @staticmethod
    def get_hcp_by_email(db: Session, email: str) -> Optional[HCP]:
        # Retrieve a single Healthcare Professional by their email address
        return db.query(HCP).filter(HCP.email == email).first()

    @staticmethod
    def get_hcps(db: Session, skip: int = 0, limit: int = 100) -> List[HCP]:
        # Retrieve a list of Healthcare Professionals with pagination
        return db.query(HCP).offset(skip).limit(limit).all()

    @staticmethod
    def create_hcp(db: Session, hcp: HCPCreate) -> HCP:
        # Create a new HCP database record
        db_hcp = HCP(
            name=hcp.name,
            specialty=hcp.specialty,
            clinic_name=hcp.clinic_name,
            email=hcp.email,
            phone=hcp.phone,
            city=hcp.city,
            status=hcp.status,
            notes=hcp.notes
        )
        db.add(db_hcp)
        db.commit()
        db.refresh(db_hcp)
        return db_hcp

    @staticmethod
    def update_hcp(db: Session, hcp_id: int, hcp_update: HCPUpdate) -> Optional[HCP]:
        # Update details of an existing HCP database record
        db_hcp = HCPService.get_hcp(db, hcp_id)
        if not db_hcp:
            return None
        
        # Update only the fields that are passed in the request body
        update_data = hcp_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_hcp, key, value)
            
        db.commit()
        db.refresh(db_hcp)
        return db_hcp

    @staticmethod
    def delete_hcp(db: Session, hcp_id: int) -> bool:
        # Delete an HCP record (which automatically deletes cascading assessments)
        db_hcp = HCPService.get_hcp(db, hcp_id)
        if not db_hcp:
            return False
        db.delete(db_hcp)
        db.commit()
        return True

    @staticmethod
    def create_assessment(db: Session, assessment: AssessmentCreate) -> Assessment:
        # Create a new interaction transcript assessment record
        db_assessment = Assessment(
            hcp_id=assessment.hcp_id,
            transcript=assessment.transcript
        )
        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)

        # Retrieve the HCP details to provide context to the agent
        hcp = db.query(HCP).filter(HCP.id == db_assessment.hcp_id).first()
        hcp_info = {
            "name": hcp.name,
            "specialty": hcp.specialty,
            "clinic_name": hcp.clinic_name,
            "city": hcp.city,
            "notes": hcp.notes
        } if hcp else {}

        # Run the LangGraph agent
        from app.services.agent import run_assessment_agent
        result = run_assessment_agent(db_assessment.transcript, hcp_info)

        # Update the assessment with the AI analysis results
        db_assessment.summary = result.get("summary")
        db_assessment.classification = result.get("classification")
        db_assessment.confidence_score = result.get("confidence_score")
        db_assessment.report = {
            "sentiment": result.get("sentiment"),
            "needs": result.get("needs"),
            "followups": result.get("followups")
        }
        
        db.commit()
        db.refresh(db_assessment)
        return db_assessment

    @staticmethod
    def get_assessment(db: Session, assessment_id: int) -> Optional[Assessment]:
        # Retrieve a single assessment by database ID
        return db.query(Assessment).filter(Assessment.id == assessment_id).first()

    @staticmethod
    def get_assessments_by_hcp(db: Session, hcp_id: int) -> List[Assessment]:
        # Retrieve all assessments belonging to a specific Healthcare Professional
        return db.query(Assessment).filter(Assessment.hcp_id == hcp_id).all()

    @staticmethod
    def update_assessment(db: Session, assessment_id: int, assessment_update: AssessmentUpdate) -> Optional[Assessment]:
        # Update assessment analysis fields (e.g. classification, summary)
        db_assessment = HCPService.get_assessment(db, assessment_id)
        if not db_assessment:
            return None
        
        update_data = assessment_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_assessment, key, value)
            
        db.commit()
        db.refresh(db_assessment)
        return db_assessment
