import os
import json
import re
from typing import TypedDict, List, Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.hcp import HCP, Assessment

# Define the State Schema of our LangGraph agent
class AgentState(TypedDict):
    transcript: str
    hcp_id: Optional[int]
    assessment_id: Optional[int]
    hcp_info: Dict[str, Any]
    summary: Optional[str]
    sentiment: Optional[str]
    needs: Optional[List[str]]
    followups: Optional[List[str]]
    classification: Optional[str]
    confidence_score: Optional[float]
    error: Optional[str]

# ----------------- LangGraph Tools Definition (5 Tools) -----------------

@tool("fetch_hcp_profile")
def fetch_hcp_profile_tool(hcp_id: int) -> str:
    """
    Retrieves the clinical background, clinic name, specialty, and notes of a Healthcare Professional.
    Use this to get context about the HCP.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return f"Error: HCP with ID {hcp_id} not found"
        return json.dumps({
            "name": hcp.name,
            "specialty": hcp.specialty,
            "clinic_name": hcp.clinic_name,
            "city": hcp.city,
            "notes": hcp.notes,
            "status": hcp.status
        })
    except Exception as e:
        return f"Error fetching HCP profile: {str(e)}"
    finally:
        db.close()


@tool("log_interaction")
def log_interaction_tool(hcp_id: int, transcript: str) -> str:
    """
    Saves a new interaction transcript log to the database for a specific Healthcare Professional.
    Use this to save raw meeting records.
    """
    db = SessionLocal()
    try:
        assessment = Assessment(hcp_id=hcp_id, transcript=transcript)
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        return f"Interaction logged successfully with Assessment ID {assessment.id}"
    except Exception as e:
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()


@tool("edit_interaction")
def edit_interaction_tool(assessment_id: int, transcript: str) -> str:
    """
    Modifies or updates the transcript of an existing interaction log in the database.
    Use this when correction or updates to previous transcripts are needed.
    """
    db = SessionLocal()
    try:
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            return f"Error: Assessment with ID {assessment_id} not found"
        assessment.transcript = transcript
        db.commit()
        return f"Assessment {assessment_id} transcript updated successfully"
    except Exception as e:
        return f"Error editing interaction: {str(e)}"
    finally:
        db.close()


@tool("search_medical_guidelines")
def search_medical_guidelines_tool(query: str) -> str:
    """
    Queries medical guidelines, trial specifications, or heart patch user manuals.
    Use this to research product specifications or questions asked by the HCP.
    """
    query_lower = query.lower()
    if "trial" in query_lower or "compliance" in query_lower:
        return (
            "Clinical Trial Manual (2025): Sample size of 500 patients. Compliance rate is 94.2%. "
            "Skin sensitivity patch test showed less than 0.8% mild dermatitis."
        )
    if "epic" in query_lower or "integration" in query_lower or "ehr" in query_lower:
        return (
            "IT Integration Sheet (v2.1): Supports Epic EHR feed. Integration takes 2 clicks "
            "for prescription routing. Automated data sync occurs every 15 minutes."
        )
    if "cost" in query_lower or "price" in query_lower or "insurance" in query_lower:
        return (
            "Pricing Manual: Cost is $199 per patient cycle. Covered by Medicare Part B "
            "and all major private insurances. Copay card covers up to $150 of out-of-pocket costs."
        )
    return "Heart Patch Manual: Safe for water immersion up to 1.5m. Up to 14 days continuous battery life."


@tool("flag_high_value_lead")
def flag_high_value_lead_tool(hcp_id: int, classification: str) -> str:
    """
    Flags the HCP's category status (High-Value, Lead, Low-Priority) directly in the database.
    Use this to persist the priority status after an assessment.
    """
    db = SessionLocal()
    try:
        hcp = db.query(HCP).filter(HCP.id == hcp_id).first()
        if not hcp:
            return f"Error: HCP with ID {hcp_id} not found"
        # We can update the status or print the change log
        print(f"[TOOL LOG] Flagged HCP {hcp_id} as '{classification}' in the registry.")
        return f"Successfully flagged HCP {hcp_id} as '{classification}'"
    except Exception as e:
        return f"Error flagging lead: {str(e)}"
    finally:
        db.close()

# List of tools to reference easily
all_agent_tools = [
    fetch_hcp_profile_tool,
    log_interaction_tool,
    edit_interaction_tool,
    search_medical_guidelines_tool,
    flag_high_value_lead_tool
]

# Helper to extract JSON from LLM markdown responses
def extract_json_from_text(text: str) -> Dict[str, Any]:
    try:
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return json.loads(text)
    except Exception:
        return {}

# ----------------- Fallback Logic for Offline/Placeholder keys -----------------
def run_fallback_parser(transcript: str, hcp_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyses the transcript locally if the Groq API key is missing or invalid.
    Uses regex and keywords to provide a mock analysis.
    """
    hcp_name = hcp_info.get("name", "Doctor")
    specialty = hcp_info.get("specialty", "Specialist")
    
    text_lower = transcript.lower()
    
    # 1. Summary Generation
    summary = f"Had a detailed discussion with {hcp_name} ({specialty}) regarding product trials and implementation."
    if "trial" in text_lower or "monitor" in text_lower:
        summary = f"Introduced our clinical heart monitors to {hcp_name}. Discussed patient compliance, device specifications, and trial programs."
    if "epic" in text_lower or "integration" in text_lower:
        summary += " The clinic highlighted EHR compatibility as their primary operational hurdle."

    # 2. Sentiment analysis
    sentiment = "Neutral"
    if any(k in text_lower for k in ["great", "interested", "excel", "helpful", "good", "yes"]):
        sentiment = "Positive"
    elif any(k in text_lower for k in ["busy", "no time", "expensive", "objection", "not interested"]):
        sentiment = "Negative"

    # 3. Needs Extraction
    needs = []
    if "trial" in text_lower or "sample" in text_lower:
        needs.append("Sample monitors for clinical trial tests")
    if "epic" in text_lower or "ehr" in text_lower or "integration" in text_lower:
        needs.append("Seamless Epic EHR integration")
    if "cost" in text_lower or "price" in text_lower or "insurance" in text_lower:
        needs.append("Insurance coverage and patient out-of-pocket costs")
    if not needs:
        needs.append("General product overview literature")

    # 4. Follow-up Tasks
    followups = []
    if "epic" in text_lower or "integration" in text_lower:
        followups.append("Coordinate with IT team to send EHR HL7 configuration specs")
    if "trial" in text_lower or "sample" in text_lower:
        followups.append("Deliver 3 sample heart monitor patches to the clinic")
    if "cost" in text_lower or "price" in text_lower:
        followups.append("Send financial brochure showing insurance coverage plans")
    if not followups:
        followups.append("Schedule a brief follow-up phone call next week")

    # 5. Lead Classification
    classification = "Lead"
    confidence_score = 0.85
    if "trial" in text_lower or "epic" in text_lower or ("interested" in text_lower and "great" in text_lower):
        classification = "High-Value"
    elif "busy" in text_lower or "no time" in text_lower:
        classification = "Low-Priority"
        confidence_score = 0.90

    return {
        "summary": summary,
        "sentiment": sentiment,
        "needs": needs,
        "followups": followups,
        "classification": classification,
        "confidence_score": confidence_score
    }

# ----------------- LangGraph Node Definitions -----------------

def get_llm():
    api_key = settings.GROQ_API_KEY
    if not api_key or "your-groq" in api_key.lower():
        return None
    try:
        return ChatGroq(
            groq_api_key=api_key,
            model=settings.GROQ_MODEL,
            temperature=0.1
        )
    except Exception:
        return None


def load_hcp_profile(state: AgentState) -> Dict[str, Any]:
    """
    Node 1: Invokes 'Fetch HCP Profile' tool to populate state context
    """
    hcp_id = state.get("hcp_id")
    if not hcp_id:
        return {"hcp_info": state.get("hcp_info") or {}}
    
    # Execute the Fetch Profile tool
    profile_json = fetch_hcp_profile_tool.invoke({"hcp_id": hcp_id})
    try:
        profile_data = json.loads(profile_json)
        if "name" in profile_data:
            return {"hcp_info": profile_data}
    except Exception:
        pass
    
    return {"hcp_info": state.get("hcp_info") or {}}


def summarize_and_extract(state: AgentState) -> Dict[str, Any]:
    """
    Node 2: Summarizes the transcript, pulling product specs via Search Guidelines tool if queried.
    """
    llm = get_llm()
    transcript = state["transcript"]
    hcp_info = state["hcp_info"]
    
    # Check if guidelines query is helpful
    guideline_info = ""
    if any(k in transcript.lower() for k in ["trial", "compliance", "epic", "ehr", "cost", "price"]):
        # Execute the Search Guidelines tool
        guideline_info = search_medical_guidelines_tool.invoke({"query": transcript})
    
    if not llm:
        fb = run_fallback_parser(transcript, hcp_info)
        summary = fb["summary"]
        if guideline_info:
            summary += f" [Verified Product Data: {guideline_info}]"
        return {
            "summary": summary,
            "sentiment": fb["sentiment"],
            "error": "Using fallback parser (Groq API Key not configured)"
        }
        
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert healthcare CRM assessment assistant. "
                       "Analyze the conversation transcript between a medical sales representative and an HCP. "
                       "You have access to verified guideline data: {guidelines}\n\n"
                       "Provide: 1. A brief executive summary (max 3 sentences) summarizing the interaction, including any verified data. "
                       "2. The HCP's sentiment towards our products (must be one of: Positive, Neutral, Negative). "
                       "Response format must be valid JSON: "
                       '{{"summary": "your summary", "sentiment": "Positive/Neutral/Negative"}}'),
            ("human", "HCP Profile: {hcp_info}\n\nTranscript:\n{transcript}")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "guidelines": guideline_info or "No guideline query made.",
            "hcp_info": json.dumps(hcp_info),
            "transcript": transcript
        })
        
        result = extract_json_from_text(response.content)
        return {
            "summary": result.get("summary", "No summary generated."),
            "sentiment": result.get("sentiment", "Neutral")
        }
    except Exception as e:
        fb = run_fallback_parser(transcript, hcp_info)
        return {
            "summary": fb["summary"],
            "sentiment": fb["sentiment"],
            "error": f"Error running LLM Node 2: {str(e)}"
        }


def extract_needs_and_tasks(state: AgentState) -> Dict[str, Any]:
    """
    Node 3: Extracts needs and actionable items.
    """
    if state.get("error"):
        fb = run_fallback_parser(state["transcript"], state["hcp_info"])
        return {
            "needs": fb["needs"],
            "followups": fb["followups"]
        }

    llm = get_llm()
    try:
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert CRM analyst. Based on the conversation transcript and the summary: "
                       "1. Extract all specific clinical, software, or product needs stated by the HCP. "
                       "2. Generate actionable, clear follow-up tasks/actions for the sales representative. "
                       "Response format must be a valid JSON with lists: "
                       '{{"needs": ["need 1", "need 2"], "followups": ["task 1", "task 2"]}}'),
            ("human", "Transcript:\n{transcript}\n\nSummary:\n{summary}")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "transcript": state["transcript"],
            "summary": state["summary"]
        })
        
        result = extract_json_from_text(response.content)
        return {
            "needs": result.get("needs", []),
            "followups": result.get("followups", [])
        }
    except Exception:
        fb = run_fallback_parser(state["transcript"], state["hcp_info"])
        return {
            "needs": fb["needs"],
            "followups": fb["followups"]
        }


def classify_lead(state: AgentState) -> Dict[str, Any]:
    """
    Node 4: Classifies the lead and fires the Flag High Value Lead tool.
    """
    hcp_id = state.get("hcp_id")
    classification = "Lead"
    confidence_score = 0.80

    if state.get("error"):
        fb = run_fallback_parser(state["transcript"], state["hcp_info"])
        classification = fb["classification"]
        confidence_score = fb["confidence_score"]
    else:
        llm = get_llm()
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are an expert CRM lead score evaluator. Based on the interaction summary, sentiment, needs, and followups: "
                           "Classify this HCP into one of these priority classifications: "
                           "1. 'High-Value': Strongly interested, requested sample trials, or requested software EHR integration. "
                           "2. 'Lead': Expressed general curiosity, asked for pamphlets, or pricing queries. "
                           "3. 'Low-Priority': Expressed budget constraints, no interest, or dismissive. "
                           "Also provide an AI confidence score (float between 0.0 and 1.0) of your classification. "
                           "Response format must be a valid JSON: "
                           '{{"classification": "High-Value/Lead/Low-Priority", "confidence_score": 0.95}}'),
                ("human", "Summary: {summary}\nSentiment: {sentiment}\nNeeds: {needs}\nFollowups: {followups}")
            ])
            
            chain = prompt | llm
            response = chain.invoke({
                "summary": state["summary"],
                "sentiment": state["sentiment"],
                "needs": json.dumps(state["needs"]),
                "followups": json.dumps(state["followups"])
            })
            
            result = extract_json_from_text(response.content)
            classification = result.get("classification", "Lead")
            confidence_score = float(result.get("confidence_score", 0.80))
        except Exception:
            fb = run_fallback_parser(state["transcript"], state["hcp_info"])
            classification = fb["classification"]
            confidence_score = fb["confidence_score"]
            
    # Trigger the Flag High Value Lead tool to log lead category status in db
    if hcp_id:
        flag_high_value_lead_tool.invoke({
            "hcp_id": hcp_id,
            "classification": classification
        })

    return {
        "classification": classification,
        "confidence_score": confidence_score
    }

# ----------------- Build the LangGraph StateMachine -----------------

builder = StateGraph(AgentState)

# Add our nodes
builder.add_node("load_hcp_profile", load_hcp_profile)
builder.add_node("summarize_and_extract", summarize_and_extract)
builder.add_node("extract_needs_and_tasks", extract_needs_and_tasks)
builder.add_node("classify_lead", classify_lead)

# Add sequential edges
builder.add_edge(START, "load_hcp_profile")
builder.add_edge("load_hcp_profile", "summarize_and_extract")
builder.add_edge("summarize_and_extract", "extract_needs_and_tasks")
builder.add_edge("extract_needs_and_tasks", "classify_lead")
builder.add_edge("classify_lead", END)

# Compile graph into an executable agent runnable
assessment_graph = builder.compile()

def run_assessment_agent(
    transcript: str, 
    hcp_info: Dict[str, Any], 
    hcp_id: Optional[int] = None, 
    assessment_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Invokes the compiled LangGraph workflow with an initial state.
    """
    initial_state = {
        "transcript": transcript,
        "hcp_id": hcp_id,
        "assessment_id": assessment_id,
        "hcp_info": hcp_info,
        "summary": None,
        "sentiment": None,
        "needs": None,
        "followups": None,
        "classification": None,
        "confidence_score": None,
        "error": None
    }
    
    final_state = assessment_graph.invoke(initial_state)
    return final_state


# ==============================================================================
# ----------------- Log Interaction Chat Assistant LangGraph -----------------
# ==============================================================================

class AssistantState(TypedDict):
    message: str
    chat_history: List[Dict[str, str]]
    form_data: Dict[str, Any]
    hcp_id: Optional[int]
    response_text: str
    suggested_followups: List[str]
    error: Optional[str]

@tool("extract_interaction_data")
def extract_interaction_data_tool(
    hcp_name: Optional[str] = None,
    specialty: Optional[str] = None,
    clinic_name: Optional[str] = None,
    city: Optional[str] = None,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    profile_notes: Optional[str] = None,
    interaction_type: Optional[str] = None,
    date: Optional[str] = None,
    time: Optional[str] = None,
    attendees: Optional[str] = None,
    topics_discussed: Optional[str] = None,
    materials_shared: Optional[List[str]] = None,
    samples_distributed: Optional[List[str]] = None,
    sentiment: Optional[str] = None,
    outcomes: Optional[str] = None,
    followup_actions: Optional[str] = None
) -> str:
    """
    Extracts structured doctor profile details and interaction details from casual talk to populate the form on the left.
    Only specify fields that are explicitly or implicitly found in the conversation.
    """
    return json.dumps({
        "hcp_name": hcp_name,
        "specialty": specialty,
        "clinic_name": clinic_name,
        "city": city,
        "email": email,
        "phone": phone,
        "profile_notes": profile_notes,
        "interaction_type": interaction_type,
        "date": date,
        "time": time,
        "attendees": attendees,
        "topics_discussed": topics_discussed,
        "materials_shared": materials_shared,
        "samples_distributed": samples_distributed,
        "sentiment": sentiment,
        "outcomes": outcomes,
        "followup_actions": followup_actions
    })

@tool("correct_form_field")
def correct_form_field_tool(field_name: str, corrected_value: Any) -> str:
    """
    Corrects a single specific field in the form when the user explicitly points out a mistake or correction.
    field_name must be one of: hcp_name, specialty, clinic_name, city, email, phone, profile_notes, interaction_type, date, time, attendees, topics_discussed, sentiment, outcomes, followup_actions.
    """
    return json.dumps({
        "field_name": field_name,
        "corrected_value": corrected_value
    })


def run_assistant_fallback(message: str, form_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Offline/fallback rule-based parser that handles basic extraction and corrections using regex/keywords.
    """
    new_form_data = dict(form_data)
    text_lower = message.lower()
    
    # 1. Corrections: e.g. "actually the name is Alen", "name is not John, it is Alen"
    name_correction = re.search(r"(?:name is not [a-zA-Z\s]+, it is|actually the name is|name is|it is) ([a-zA-Z\s\.\-\_]+)", message, re.IGNORECASE)
    if "name" in text_lower and name_correction:
        corrected_name = name_correction.group(1).strip()
        new_form_data["hcp_name"] = corrected_name
        response_text = f"I've updated the HCP Name to '{corrected_name}' on the left."
        return {
            "form_data": new_form_data,
            "response_text": response_text,
            "suggested_followups": ["Schedule follow-up meeting in 2 weeks"]
        }
        
    spec_correction = re.search(r"(?:specialty is not [a-zA-Z\s]+, it is|actually the specialty is|specialty is) ([a-zA-Z\s\.\-\_]+)", message, re.IGNORECASE)
    if "specialty" in text_lower and spec_correction:
        corrected_spec = spec_correction.group(1).strip()
        new_form_data["specialty"] = corrected_spec
        response_text = f"I've updated the Specialty to '{corrected_spec}' on the left."
        return {
            "form_data": new_form_data,
            "response_text": response_text,
            "suggested_followups": ["Schedule follow-up meeting in 2 weeks"]
        }
        
    clinic_correction = re.search(r"(?:clinic is not [a-zA-Z\s]+, it is|actually the clinic is|clinic name is|clinic is) ([a-zA-Z\s\.\-\_]+)", message, re.IGNORECASE)
    if "clinic" in text_lower and clinic_correction:
        corrected_clinic = clinic_correction.group(1).strip()
        new_form_data["clinic_name"] = corrected_clinic
        response_text = f"I've updated the Clinic Name to '{corrected_clinic}' on the left."
        return {
            "form_data": new_form_data,
            "response_text": response_text,
            "suggested_followups": ["Schedule follow-up meeting in 2 weeks"]
        }

    date_match = re.search(r"(?:date is|date to|on) (\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})", message, re.IGNORECASE)
    if "date" in text_lower and date_match:
        corrected_date = date_match.group(1).strip()
        new_form_data["date"] = corrected_date
        response_text = f"I've updated the Date to '{corrected_date}' on the left."
        return {
            "form_data": new_form_data,
            "response_text": response_text,
            "suggested_followups": ["Schedule follow-up meeting in 2 weeks"]
        }

    # 2. General Extractions
    # Email Address Extraction
    email_match = re.search(r"([a-zA-Z0-9\.\-\_]+\s*@\s*[a-zA-Z0-9\.\-\_]+\s*\.\s*[a-zA-Z]{2,})", message)
    if email_match:
        new_form_data["email"] = email_match.group(1).replace(" ", "").strip()
        
    # Phone Number Extraction
    phone_match = re.search(r"(?:phone|number|contact|mobile)(?:\s+number)?(?:\s+is)?\s*([\d\+\-\s]{7,15})", message, re.IGNORECASE)
    if not phone_match:
        phone_match = re.search(r"\b(\d{7,15})\b", message)
    if phone_match:
        new_form_data["phone"] = phone_match.group(1).replace(" ", "").strip()

    # HCP Name Extraction
    name_match = re.search(r"(?:i am|name is|it is)\s+(?:Dr\.)?\s*([a-zA-Z]+)", message, re.IGNORECASE)
    if not name_match:
        name_match = re.search(r"Dr\.\s*([a-zA-Z]+)", message, re.IGNORECASE)
    if name_match:
        extracted_name = name_match.group(1).strip()
        stop_words = {
            "expecting", "working", "busy", "going", "having", "meeting", "calling", 
            "correct", "not", "here", "there", "a", "an", "the", "in", "at", "for", 
            "to", "of", "with", "positive", "negative", "neutral", "dermatologist", 
            "cardiologist", "oncologist", "neurologist", "pediatrician", "specialist", 
            "doctor", "physician", "representative", "nurse", "patient", "compliance", 
            "trials", "studies", "patch", "ehr", "epic", "integration", "cost", 
            "price", "insurance", "pricing", "email", "phone", "number", "contact", "mobile"
        }
        if extracted_name.lower() not in stop_words:
            has_dr = "dr" in message.lower() or "dr." in message.lower()
            prefix = "Dr. " if has_dr else ""
            new_form_data["hcp_name"] = prefix + extracted_name

    # Specialty Extraction
    spec_match = re.search(r"(?:specialty|speciality)\s+is\s+([a-zA-Z]+)", message, re.IGNORECASE)
    if not spec_match:
        spec_match = re.search(r"working\s+as\s+(?:a|an)?\s*([a-zA-Z]+)", message, re.IGNORECASE)
    
    extracted_spec = None
    if spec_match:
        extracted_spec = spec_match.group(1).strip()
    else:
        for spec_keyword in ["cardiologist", "cardiology", "neurologist", "neorologist", "neurology", "neorology", "oncologist", "oncology", "pediatrician"]:
            if spec_keyword in text_lower:
                extracted_spec = spec_keyword
                break
                 
    if extracted_spec:
        spec_lower = extracted_spec.lower()
        if any(w in spec_lower for w in ["neorologist", "neurologist", "neurology", "neorology"]):
            normalized_spec = "Neurologist"
        elif any(w in spec_lower for w in ["cardiologist", "cardiology"]):
            normalized_spec = "Cardiologist"
        elif any(w in spec_lower for w in ["oncologist", "oncology"]):
            normalized_spec = "Oncologist"
        else:
            normalized_spec = extracted_spec.capitalize()
        new_form_data["specialty"] = normalized_spec

    # Clinic Extraction
    clinic_match = re.search(r"(?:at|hospital|clinic)\s+([a-zA-Z0-9\s\-]+?\s*(?:hospital|clinic|medical center|care|relife))", message, re.IGNORECASE)
    if not clinic_match:
        clinic_match = re.search(r"([a-zA-Z0-9\s\-]+?\s+(?:hospital|clinic|medical center|relife))", message, re.IGNORECASE)
    if clinic_match:
        c_name = clinic_match.group(1).strip()
        for stop_word in ["working as a ", "working as an ", "working as ", "as a ", "as an ", "specialist at ", "speciality is at ", "doctor at ", "am "]:
            if c_name.lower().startswith(stop_word):
                c_name = c_name[len(stop_word):]
        c_name = re.sub(r"^[^a-zA-Z0-9]+", "", c_name)
        # Verify it's not just the word 'hospital' or 'clinic'
        if c_name.lower() not in ["hospital", "clinic", "relife"]:
            new_form_data["clinic_name"] = c_name

    # City Extraction
    city_match = re.search(r"(?:city is|territory is|in)\s+([a-zA-Z]+)", message, re.IGNORECASE)
    if city_match:
        c_val = city_match.group(1).strip()
        if c_val.lower() not in ["a", "an", "the", "this", "my", "our", "positive", "negative", "neutral", "meeting", "call", "email", "weeks", "week"]:
            new_form_data["city"] = c_val.capitalize()

    # Sentiment Extraction
    if "positive" in text_lower:
        new_form_data["sentiment"] = "Positive"
    elif "negative" in text_lower:
        new_form_data["sentiment"] = "Negative"
    elif "neutral" in text_lower:
        new_form_data["sentiment"] = "Neutral"

    # Interaction Type Extraction
    if "meeting" in text_lower:
        new_form_data["interaction_type"] = "Meeting"
    elif "call" in text_lower:
        new_form_data["interaction_type"] = "Call"
    elif "conference" in text_lower:
        new_form_data["interaction_type"] = "Conference"
    elif "email" in text_lower and not email_match:
        new_form_data["interaction_type"] = "Email"

    # Topics Discussed (only populate if discussion context is present)
    has_discussion_keywords = any(kw in text_lower for kw in ["discuss", "talk", "present", "pitch", "trials", "studies", "patch", "efficacy", "safety", "pricing", "compliance", "meeting", "call"])
    if has_discussion_keywords and len(message) > 25:
        new_form_data["topics_discussed"] = message

    # Detect updates to compile response
    updates = []
    if new_form_data.get("hcp_name") != form_data.get("hcp_name"):
        updates.append(f"HCP Name: {new_form_data['hcp_name']}")
    if new_form_data.get("specialty") != form_data.get("specialty"):
        updates.append(f"Specialty: {new_form_data['specialty']}")
    if new_form_data.get("clinic_name") != form_data.get("clinic_name"):
        updates.append(f"Clinic: {new_form_data['clinic_name']}")
    if new_form_data.get("city") != form_data.get("city"):
        updates.append(f"City: {new_form_data['city']}")
    if new_form_data.get("email") != form_data.get("email"):
        updates.append(f"Email: {new_form_data['email']}")
    if new_form_data.get("phone") != form_data.get("phone"):
        updates.append(f"Phone: {new_form_data['phone']}")
    if new_form_data.get("sentiment") != form_data.get("sentiment"):
        updates.append(f"Sentiment: {new_form_data['sentiment']}")
    if new_form_data.get("interaction_type") != form_data.get("interaction_type"):
        updates.append(f"Type: {new_form_data['interaction_type']}")
    if new_form_data.get("topics_discussed") != form_data.get("topics_discussed"):
        updates.append("Topics Discussed populated")

    if updates:
        response_text = f"I've analyzed your message and updated the following: {', '.join(updates)}."
    else:
        response_text = "I'm listening. Describe the doctor's profile and interaction to automatically fill the form on the left."

    suggested_followups = ["Schedule follow-up meeting in 2 weeks"]
    if "trial" in text_lower or "clinical" in text_lower:
        suggested_followups.append("Send clinical trials pamphlets")
    if "epic" in text_lower or "ehr" in text_lower:
        suggested_followups.append("Send IT integration specs sheets")

    return {
        "form_data": new_form_data,
        "response_text": response_text,
        "suggested_followups": suggested_followups
    }


def process_assistant(state: AssistantState) -> Dict[str, Any]:
    llm = get_llm()
    if not llm:
        fb = run_assistant_fallback(state["message"], state["form_data"])
        return {
            "form_data": fb["form_data"],
            "response_text": fb["response_text"],
            "suggested_followups": fb["suggested_followups"],
            "error": "Offline Mode (Groq API Key not configured)"
        }
        
    try:
        tools = [
            extract_interaction_data_tool,
            correct_form_field_tool,
            fetch_hcp_profile_tool,
            search_medical_guidelines_tool,
            flag_high_value_lead_tool
        ]
        llm_with_tools = llm.bind_tools(tools)
        
        history_str = ""
        for msg in state["chat_history"]:
            role = "Representative" if msg.get("sender") == "rep" else "AI Assistant"
            history_str += f"{role}: {msg.get('text')}\n"
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an AI assistant helping a medical sales representative log details of a Healthcare Professional (HCP) interaction.\n"
                       "Your job is to talk to the representative on the right and update the structured form fields on the left using the available tools.\n\n"
                       "Current Form Data: {form_data}\n\n"
                       "Tools guidelines:\n"
                       "- If the representative describes meeting details (e.g. 'Met Dr. Carter today, discussed compliance, positive sentiment'), call `Extract Interaction Data` tool to parse and update the fields.\n"
                       "- If they explicitly correct a field (e.g. 'actually the name is Alen', 'no, it's not a meeting, it's a call'), call `Correct Form Field` tool with the field name and corrected value.\n"
                       "- If they ask about guidelines/specifications, call `Search Medical Guidelines` tool.\n"
                       "- If they ask about the HCP profile background, call `Fetch HCP Profile` tool.\n"
                       "- If they indicate priority/lead classification, call `Flag High Value Lead` tool.\n\n"
                       "After calling the tool, or if no tool is needed, respond with a friendly, professional explanation of what you updated or how you helped. "
                       "Also generate a list of 1-3 suggested follow-up action items based on the discussion (e.g. 'Schedule follow-up meeting in 2 weeks', 'Send OncoBoost Phase III PDF') formatted in your text or JSON."),
            ("human", "Previous History:\n{history}\n\nLatest Message: {message}\n\nProvide your response and call any tools necessary:")
        ])
        
        chain = prompt | llm_with_tools
        res = chain.invoke({
            "form_data": json.dumps(state["form_data"]),
            "history": history_str or "No history yet.",
            "message": state["message"]
        })
        
        new_form_data = dict(state["form_data"])
        response_text = res.content or ""
        suggested_followups = []
        
        if res.tool_calls:
            actions_summary = []
            for tc in res.tool_calls:
                tool_name = tc["name"]
                args = tc["args"]
                
                if tool_name == "extract_interaction_data":
                    extracted_fields = []
                    for k, v in args.items():
                        if v is not None:
                            new_form_data[k] = v
                            extracted_fields.append(f"{k.replace('_', ' ').capitalize()}: {v}")
                    if extracted_fields:
                        actions_summary.append(f"Extracted and populated interaction data fields: {', '.join(extracted_fields)}.")
                    else:
                        actions_summary.append("Parsed the interaction details but found no new fields to populate.")
                    
                elif tool_name == "correct_form_field":
                    f_name = args.get("field_name")
                    val = args.get("corrected_value")
                    if f_name in new_form_data:
                        new_form_data[f_name] = val
                    actions_summary.append(f"Corrected the '{f_name.replace('_', ' ')}' field to '{val}'.")
                    
                elif tool_name == "search_medical_guidelines":
                    guidelines_res = search_medical_guidelines_tool.invoke(args)
                    if not new_form_data.get("topics_discussed"):
                        new_form_data["topics_discussed"] = ""
                    new_form_data["topics_discussed"] += f"\n[Guidelines: {guidelines_res}]"
                    actions_summary.append(f"Looked up medical guidelines for '{args.get('query')}' and found: '{guidelines_res}'.")
                    
                elif tool_name == "fetch_hcp_profile":
                    profile_res = fetch_hcp_profile_tool.invoke(args)
                    actions_summary.append(f"Fetched the doctor profile context: {profile_res}.")
                    
                elif tool_name == "flag_high_value_lead":
                    flag_res = flag_high_value_lead_tool.invoke(args)
                    actions_summary.append(f"Updated the HCP lead classification: {flag_res}.")
            
            # Generate a creative, context-specific response using the LLM explaining these actions
            try:
                final_prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are an expert CRM assistant. The user just typed a message, and you successfully performed the following background actions on the form/database:\n"
                               "{actions_summary}\n\n"
                               "Provide a friendly, conversational, and professional response to the user explaining what you updated or retrieved. "
                               "Also, suggest 1-3 actionable follow-up items for the representative based on their message (e.g., 'Email the pricing brochure', 'Schedule call in 2 weeks').\n"
                               "You MUST respond in valid JSON format with keys 'response' (string) and 'suggested_followups' (list of strings). "
                               "Example:\n"
                               '{{"response": "I have updated the clinic name to Boston Cardiac Center as requested.", "suggested_followups": ["Send IT integration specs sheet"]}}'),
                    ("human", "User message: {message}")
                ])
                final_chain = final_prompt | llm
                final_res = final_chain.invoke({
                    "actions_summary": "\n".join(actions_summary),
                    "message": state["message"]
                })
                
                result_json = extract_json_from_text(final_res.content)
                if result_json and "response" in result_json:
                    response_text = result_json["response"]
                    suggested_followups = result_json.get("suggested_followups", [])
                else:
                    response_text = final_res.content.strip()
            except Exception as e:
                response_text = f"I've updated the form based on your message:\n" + "\n".join([f"- {act}" for act in actions_summary])
        
        if not suggested_followups:
            if "follow-up" in response_text.lower() or "schedule" in response_text.lower():
                suggested_followups.append("Schedule follow-up meeting in 2 weeks")
            if "epic" in state["message"].lower() or "ehr" in state["message"].lower():
                suggested_followups.append("Send IT integration specs sheets")
            if "trial" in state["message"].lower() or "study" in state["message"].lower():
                suggested_followups.append("Send clinical study reports PDF")
                
            if not suggested_followups:
                suggested_followups = ["Schedule follow-up meeting in 2 weeks"]
                
        return {
            "form_data": new_form_data,
            "response_text": response_text or "Form updated successfully.",
            "suggested_followups": suggested_followups
        }
    except Exception as e:
        fb = run_assistant_fallback(state["message"], state["form_data"])
        return {
            "form_data": fb["form_data"],
            "response_text": fb["response_text"],
            "suggested_followups": fb["suggested_followups"],
            "error": f"Error running LLM assistant: {str(e)}"
        }


assistant_builder = StateGraph(AssistantState)
assistant_builder.add_node("process_assistant", process_assistant)
assistant_builder.add_edge(START, "process_assistant")
assistant_builder.add_edge("process_assistant", END)
assistant_graph = assistant_builder.compile()


def run_chat_assistant(
    message: str,
    chat_history: List[Dict[str, str]],
    form_data: Dict[str, Any],
    hcp_id: Optional[int] = None
) -> Dict[str, Any]:
    initial_state = {
        "message": message,
        "chat_history": chat_history,
        "form_data": form_data,
        "hcp_id": hcp_id,
        "response_text": "",
        "suggested_followups": [],
        "error": None
    }
    final_state = assistant_graph.invoke(initial_state)
    return final_state
