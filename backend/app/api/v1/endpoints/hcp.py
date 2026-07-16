from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

from app.api import deps
from app.schemas.hcp import HCPCreate, HCPResponse, HCPUpdate, AssessmentCreate, AssessmentResponse
from app.services.hcp_service import HCPService
from app.services.agent import get_llm, run_chat_assistant
from langchain_core.prompts import ChatPromptTemplate

router = APIRouter()

@router.get("/", response_model=List[HCPResponse])
def read_hcps(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    # Retrieve all HCP records in the system
    return HCPService.get_hcps(db, skip=skip, limit=limit)

@router.get("/{hcp_id}", response_model=HCPResponse)
def read_hcp(hcp_id: int, db: Session = Depends(deps.get_db)):
    # Retrieve a single HCP record by ID
    db_hcp = HCPService.get_hcp(db, hcp_id)
    if not db_hcp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HCP with id {hcp_id} not found"
        )
    return db_hcp

@router.post("/", response_model=HCPResponse, status_code=status.HTTP_201_CREATED)
def create_hcp(hcp: HCPCreate, db: Session = Depends(deps.get_db)):
    # Create a new HCP in the CRM database
    # Check if the email already exists
    if hcp.email:
        existing = HCPService.get_hcp_by_email(db, hcp.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An HCP with email {hcp.email} already exists"
            )
    return HCPService.create_hcp(db, hcp)

@router.put("/{hcp_id}", response_model=HCPResponse)
def update_hcp(hcp_id: int, hcp_update: HCPUpdate, db: Session = Depends(deps.get_db)):
    # Modify an existing HCP record
    db_hcp = HCPService.update_hcp(db, hcp_id, hcp_update)
    if not db_hcp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HCP with id {hcp_id} not found"
        )
    return db_hcp

@router.delete("/{hcp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hcp(hcp_id: int, db: Session = Depends(deps.get_db)):
    # Delete an HCP and clean up related records
    success = HCPService.delete_hcp(db, hcp_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HCP with id {hcp_id} not found"
        )
    return None

@router.post("/{hcp_id}/assess", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(hcp_id: int, request: Request, db: Session = Depends(deps.get_db)):
    # Submit a conversation transcript for AI agent assessment
    # Check if the target HCP exists
    db_hcp = HCPService.get_hcp(db, hcp_id)
    if not db_hcp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"HCP with id {hcp_id} not found"
        )
    
    body_bytes = await request.body()
    transcript_data = body_bytes.decode("utf-8")
    
    assessment_in = AssessmentCreate(hcp_id=hcp_id, transcript=transcript_data)
    return HCPService.create_assessment(db, assessment_in)

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatSimulationRequest(BaseModel):
    persona_name: str
    persona_title: str
    messages: List[ChatMessage]

@router.post("/simulate-chat", response_model=Dict[str, Optional[str]])
def simulate_chat(payload: ChatSimulationRequest):
    # Simulated doctor chat response generator using LLM
    llm = get_llm()
    if not llm:
        return {"response": None}
    
    try:
        # Format the history for the model prompt
        history_str = ""
        for msg in payload.messages:
            role = f"Doctor ({payload.persona_name})" if msg.sender == 'hcp' else "Representative"
            history_str += f"{role}: {msg.text}\n"

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are simulating a physician: {persona_name}, who is a {persona_title}.\n"
                       "A medical sales representative is pitching to you. Respond naturally and realistically "
                       "based on the conversation history. Keep your response brief, professional, and conversational "
                       "(usually 1 to 2 sentences), matching your role. "
                       "Do not prepend your name or role to the response."),
            ("human", "Here is the conversation history:\n{history}\n\nProvide your next response as the doctor:")
        ])
        
        chain = prompt | llm
        res = chain.invoke({
            "persona_name": payload.persona_name,
            "persona_title": payload.persona_title,
            "history": history_str
        })
        return {"response": res.content.strip()}
    except Exception as e:
        return {"response": None}


class AssistantChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]]
    form_data: Dict[str, Any]
    hcp_id: Optional[int] = None

class AssistantChatResponse(BaseModel):
    response: str
    form_data: Dict[str, Any]
    suggested_followups: List[str]

@router.post("/chat-assistant", response_model=AssistantChatResponse)
def chat_assistant(payload: AssistantChatRequest):
    # Chat assistant using LangGraph agents to extract/correct interaction data
    try:
        res = run_chat_assistant(
            message=payload.message,
            chat_history=payload.chat_history,
            form_data=payload.form_data,
            hcp_id=payload.hcp_id
        )
        return AssistantChatResponse(
            response=res.get("response_text", "Form fields updated."),
            form_data=res.get("form_data", payload.form_data),
            suggested_followups=res.get("suggested_followups", [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Assistant error: {str(e)}"
        )
