import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { evaluateTranscript } from '../store/assessmentSlice';
import { createHCP, fetchHCPById } from '../store/hcpSlice';
import { api } from '../services/api';
import {
  Send, CheckCircle, BrainCircuit, Sparkles,
  Plus, Trash, FileText, User, ArrowLeft
} from 'lucide-react';

function InteractionWorkspace({ onCancel }) {
  const dispatch = useDispatch();
  const { loading: assessLoading } = useSelector((state) => state.assessment);

  // Form State containing both HCP profile details and interaction details
  const [formData, setFormData] = useState({
    hcp_name: '',
    specialty: '',
    clinic_name: '',
    city: '',
    email: '',
    phone: '',
    profile_notes: '',
    interaction_type: 'Meeting',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    attendees: '',
    topics_discussed: '',
    materials_shared: [],
    samples_distributed: [],
    sentiment: 'Neutral',
    outcomes: '',
    followup_actions: ''
  });

  // Inputs for arrays
  const [materialInput, setMaterialInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');

  // AI Assistant Chat State (Public general chatbot)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I'm your AI Assistant. Describe your interaction here (e.g., 'Met Dr. Sarah Carter who is a cardiologist at Mercy Hospital today. We discussed trials and compliance, sentiment was positive, and she shared a Price Manual'), and I will automatically populate the form on the left. You can also ask me to correct any fields (e.g., 'actually the name is Alen').",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState([
    "Schedule follow-up meeting in 2 weeks",
    "Send IT integration specs sheets",
    "Add to advisory board invite list"
  ]);

  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Form Field change handler
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add/Remove Materials
  const handleAddMaterial = (e) => {
    if (e) e.preventDefault();
    if (!materialInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      materials_shared: [...prev.materials_shared, materialInput.trim()]
    }));
    setMaterialInput('');
  };

  const handleRemoveMaterial = (item) => {
    setFormData(prev => ({
      ...prev,
      materials_shared: prev.materials_shared.filter(m => m !== item)
    }));
  };

  // Add/Remove Samples
  const handleAddSample = (e) => {
    if (e) e.preventDefault();
    if (!sampleInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      samples_distributed: [...prev.samples_distributed, sampleInput.trim()]
    }));
    setSampleInput('');
  };

  const handleRemoveSample = (item) => {
    setFormData(prev => ({
      ...prev,
      samples_distributed: prev.samples_distributed.filter(s => s !== item)
    }));
  };

  // Add Suggested Follow-up
  const handleAddSuggestedFollowup = (item) => {
    setFormData(prev => {
      const current = prev.followup_actions ? prev.followup_actions.trim() : '';
      const separator = current ? '\n' : '';
      return {
        ...prev,
        followup_actions: `${current}${separator}- ${item}`
      };
    });
  };

  // Simulated Voice Note Summary
  const handleVoiceNoteSummary = (e) => {
    e.preventDefault();
    alert("Voice recording module initiated. Listening... (Simulated)");
    setFormData(prev => ({
      ...prev,
      topics_discussed: "Physician showed high interest in water-resistance capabilities and battery longevity of the clinical heart patches."
    }));
  };

  // Send message to AI Assistant
  const handleSendAssistantMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'rep',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    const textToSend = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await api.chatAssistant(textToSend, updatedHistory, formData, null);

      if (res) {
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          text: res.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        if (res.form_data) {
          // Merge incoming fields
          setFormData(prev => ({
            ...prev,
            ...res.form_data
          }));
        }

        if (res.suggested_followups && res.suggested_followups.length > 0) {
          setSuggestedFollowups(res.suggested_followups);
        }
      }
    } catch (err) {
      console.warn("AI Assistant API call failed, calling local rule-based fallback:", err);
      // Fallback
      setTimeout(() => {
        const text_lower = textToSend.toLowerCase();
        let new_form_data = { ...formData };
        let response_text = "";

        // Match Name correction
        const name_correction = textToSend.match(/(?:name is not [a-zA-Z\s]+, it is|actually the name is|name is|it is) ([a-zA-Z\s\.\-\_]+)/i);
        const specialty_correction = textToSend.match(/(?:specialty is not [a-zA-Z\s]+, it is|actually the specialty is|specialty is) ([a-zA-Z\s\.\-\_]+)/i);
        const clinic_correction = textToSend.match(/(?:clinic is not [a-zA-Z\s]+, it is|actually the clinic is|clinic name is|clinic is) ([a-zA-Z\s\.\-\_]+)/i);

        if (text_lower.includes("name") && name_correction) {
          const corrected_name = name_correction[1].trim();
          const stopWords = new Set([
            "expecting", "working", "busy", "going", "having", "meeting", "calling",
            "correct", "not", "here", "there", "a", "an", "the", "in", "at", "for",
            "to", "of", "with", "positive", "negative", "neutral", "dermatologist",
            "cardiologist", "oncologist", "neurologist", "pediatrician", "specialist",
            "doctor", "physician", "representative", "nurse", "patient", "compliance",
            "trials", "studies", "patch", "ehr", "epic", "integration", "cost",
            "price", "insurance", "pricing", "email", "phone", "number", "contact", "mobile"
          ]);
          if (!stopWords.has(corrected_name.toLowerCase())) {
            new_form_data.hcp_name = corrected_name;
            response_text = `I've updated the HCP Name to '${corrected_name}' on the left.`;
          } else {
            response_text = "I'm listening. Describe the doctor's profile and interaction or ask for a correction.";
          }
        } else if (text_lower.includes("specialty") && specialty_correction) {
          const corrected_spec = specialty_correction[1].trim();
          new_form_data.specialty = corrected_spec;
          response_text = `I've updated the Specialty to '${corrected_spec}' on the left.`;
        } else if (text_lower.includes("clinic") && clinic_correction) {
          const corrected_clinic = clinic_correction[1].trim();
          new_form_data.clinic_name = corrected_clinic;
          response_text = `I've updated the Clinic Name to '${corrected_clinic}' on the left.`;
        } else {
          let extracted = [];

          if (text_lower.includes("dr.")) {
            const dr_match = textToSend.match(/Dr\.\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)?/i);
            if (dr_match) {
              new_form_data.hcp_name = dr_match[0];
              extracted.push(`HCP Name: ${dr_match[0]}`);
            }
          }
          if (text_lower.includes("cardiologist") || text_lower.includes("cardiology")) {
            new_form_data.specialty = "Cardiologist";
            extracted.push("Specialty: Cardiologist");
          } else if (text_lower.includes("oncologist") || text_lower.includes("oncology")) {
            new_form_data.specialty = "Oncologist";
            extracted.push("Specialty: Oncologist");
          }

          const clinic_match = textToSend.match(/([a-zA-Z\s]+ hospital|[a-zA-Z\s]+ clinic)/i);
          if (clinic_match) {
            new_form_data.clinic_name = clinic_match[0].trim();
            extracted.push(`Clinic: ${clinic_match[0]}`);
          }

          if (text_lower.includes("positive")) {
            new_form_data.sentiment = "Positive";
            extracted.push("Sentiment: Positive");
          } else if (text_lower.includes("negative")) {
            new_form_data.sentiment = "Negative";
            extracted.push("Sentiment: Negative");
          }

          if (text_lower.includes("call")) {
            new_form_data.interaction_type = "Call";
            extracted.push("Type: Call");
          } else if (text_lower.includes("meeting")) {
            new_form_data.interaction_type = "Meeting";
            extracted.push("Type: Meeting");
          }

          if (textToSend.length > 20) {
            new_form_data.topics_discussed = textToSend;
            extracted.push("Topics Discussed populated");
          }

          if (extracted.length > 0) {
            response_text = `I've analyzed your message and updated the following: ${extracted.join(', ')}.`;
          } else {
            response_text = "I'm listening. Describe the doctor's profile and interaction or ask for a correction.";
          }
        }

        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'assistant',
          text: response_text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setFormData(new_form_data);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  // Compile & Log Interaction to DB (Creates HCP, then Logs Interaction Assessment)
  const handleFinalizeLog = async (e) => {
    if (e) e.preventDefault();
    if (!formData.hcp_name || !formData.specialty || !formData.topics_discussed) {
      alert("HCP Name, Specialty, and Topics Discussed are required to register.");
      return;
    }

    try {
      // 1. Create/Register the HCP Profile
      const hcpPayload = {
        name: formData.hcp_name,
        specialty: formData.specialty,
        clinic_name: formData.clinic_name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        city: formData.city || '',
        status: 'Active',
        notes: formData.profile_notes || ''
      };

      const newHcp = await dispatch(createHCP(hcpPayload)).unwrap();

      if (newHcp && newHcp.id) {
        const newHcpId = newHcp.id;

        // 2. Submit interaction logs transcript for Assessment
        const compiledTranscript = `Log Interaction Report:
HCP Name: ${formData.hcp_name}
Specialty: ${formData.specialty}
Clinic Name: ${formData.clinic_name || 'None specified'}
City: ${formData.city || 'None specified'}
Interaction Type: ${formData.interaction_type}
Date: ${formData.date}
Time: ${formData.time}
Attendees: ${formData.attendees || 'None specified'}
Topics Discussed: ${formData.topics_discussed}
Materials Shared: ${formData.materials_shared.join(', ') || 'None'}
Samples Distributed: ${formData.samples_distributed.join(', ') || 'None'}
Sentiment: ${formData.sentiment}
Key Outcomes: ${formData.outcomes || 'None'}
Follow-up Actions: ${formData.followup_actions || 'None'}`;

        await dispatch(evaluateTranscript({ hcpId: newHcpId, transcript: compiledTranscript })).unwrap();

        // 3. Re-fetch and Select this newly registered HCP card
        dispatch(fetchHCPById(newHcpId));
      }
    } catch (err) {
      console.error("Registration & Log failed:", err);
      alert("Failed to register and log: " + err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', overflow: 'hidden' }}>

      {/* Title with Back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem'
            }}
            title="Back to registry"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <BrainCircuit size={22} style={{ color: 'var(--primary)' }} />
            <span>Log HCP Interaction & Registry Registration</span>
          </h3>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left Column: Form */}
        <div className="card" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          backgroundColor: 'rgba(255,255,255,0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          height: '100%',
          overflowY: 'auto'
        }}>

          {/* Section 1: Doctor Profile */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.875rem 0', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Doctor Profile Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>HCP Name *</label>
                  <input
                    type="text"
                    name="hcp_name"
                    value={formData.hcp_name}
                    onChange={handleFieldChange}
                    placeholder="Search or select HCP..."
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Specialty *</label>
                  <input
                    type="text"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleFieldChange}
                    placeholder="e.g. Cardiologist"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Clinic / Hospital Name</label>
                  <input
                    type="text"
                    name="clinic_name"
                    value={formData.clinic_name}
                    onChange={handleFieldChange}
                    placeholder="e.g. Mercy Hospital"
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>City / Territory</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFieldChange}
                    placeholder="e.g. Chicago"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFieldChange}
                    placeholder="e.g. name@clinic.com"
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFieldChange}
                    placeholder="e.g. 555-0199"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Profile Notes / Background</label>
                <textarea
                  name="profile_notes"
                  value={formData.profile_notes}
                  onChange={handleFieldChange}
                  placeholder="Notes about clinical background, satisfaction, or preferences..."
                  rows={2}
                  style={textareaStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Interaction Details */}
          <div style={{ marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.875rem 0', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Interaction Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Interaction Type</label>
                  <select
                    name="interaction_type"
                    value={formData.interaction_type}
                    onChange={handleFieldChange}
                    style={selectStyle}
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Conference">Conference</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFieldChange}
                      style={inputStyle}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Time</label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleFieldChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Attendees</label>
                <input
                  type="text"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleFieldChange}
                  placeholder="Enter representative or nurse names..."
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Topics Discussed *</label>
                <textarea
                  name="topics_discussed"
                  value={formData.topics_discussed}
                  onChange={handleFieldChange}
                  placeholder="Enter key discussion points..."
                  rows={3}
                  style={textareaStyle}
                  required
                />
                <button
                  type="button"
                  onClick={handleVoiceNoteSummary}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                    color: '#818cf8',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    marginTop: '0.375rem',
                    width: 'fit-content',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <Sparkles size={12} />
                  <span>Summarize from Voice Note (Requires Consent)</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Materials Shared</label>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <input
                      type="text"
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                      placeholder="e.g. Price Manual"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      style={{ ...actionButtonStyle, padding: '0.5rem 0.75rem' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={tagsContainerStyle}>
                    {formData.materials_shared.map((m, idx) => (
                      <span key={idx} style={tagStyle}>
                        <span>{m}</span>
                        <Trash
                          size={10}
                          onClick={() => handleRemoveMaterial(m)}
                          style={{ cursor: 'pointer', marginLeft: '0.25rem', color: '#f87171' }}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Samples Distributed</label>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <input
                      type="text"
                      value={sampleInput}
                      onChange={(e) => setSampleInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSample()}
                      placeholder="e.g. Heart Monitor v2"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={handleAddSample}
                      style={{ ...actionButtonStyle, padding: '0.5rem 0.75rem' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div style={tagsContainerStyle}>
                    {formData.samples_distributed.map((s, idx) => (
                      <span key={idx} style={tagStyle}>
                        <span>{s}</span>
                        <Trash
                          size={10}
                          onClick={() => handleRemoveSample(s)}
                          style={{ cursor: 'pointer', marginLeft: '0.25rem', color: '#f87171' }}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Observed/Inferred HCP Sentiment</label>
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.25rem 0' }}>
                  {['Positive', 'Neutral', 'Negative'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
                      <input
                        type="radio"
                        name="sentiment"
                        value={s}
                        checked={formData.sentiment === s}
                        onChange={handleFieldChange}
                        style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      <span>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Outcomes</label>
                <textarea
                  name="outcomes"
                  value={formData.outcomes}
                  onChange={handleFieldChange}
                  placeholder="Key outcomes or agreements..."
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Follow-up Actions</label>
                <textarea
                  name="followup_actions"
                  value={formData.followup_actions}
                  onChange={handleFieldChange}
                  placeholder="Enter next steps or tasks..."
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              {suggestedFollowups.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>AI Suggested Follow-ups:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {suggestedFollowups.map((sf, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAddSuggestedFollowup(sf)}
                        style={{
                          fontSize: '0.75rem',
                          color: '#818cf8',
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          border: '1px dashed rgba(99, 102, 241, 0.3)',
                          transition: 'all var(--transition-fast)'
                        }}
                        title="Click to add to Follow-up Actions"
                      >
                        + {sf}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant Chat */}
        <div className="card" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'rgba(0,0,0,0.12)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Sparkles size={18} style={{ color: '#818cf8' }} />
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>AI Assistant</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Log interaction via chat</span>
            </div>
          </div>

          {/* Chat Window */}
          <div style={{
            flex: 1,
            minHeight: 0,
            backgroundColor: 'rgba(0,0,0,0.15)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'rep' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'rep' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  borderTopRightRadius: msg.sender === 'rep' ? '0' : 'var(--radius-md)',
                  borderTopLeftRadius: msg.sender === 'assistant' ? '0' : 'var(--radius-md)',
                  backgroundColor: msg.sender === 'rep' ? 'var(--primary)' : 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.4,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                  {msg.sender === 'rep' ? 'Rep' : 'AI Assistant'} • {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AI Assistant is thinking</span>
                <span className="dot-typing" style={dotTypingStyle}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSendAssistantMessage} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Describe interaction..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '0.625rem 0.875rem',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isTyping || !chatInput.trim()}
              style={{ padding: '0.625rem 0.875rem', display: 'flex', gap: '0.375rem', alignItems: 'center' }}
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </form>

          {/* Log Final Action */}
          <button
            onClick={handleFinalizeLog}
            className="btn btn-primary"
            disabled={assessLoading || !formData.hcp_name || !formData.specialty || !formData.topics_discussed}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.75rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--secondary)'
            }}
          >
            <CheckCircle size={16} />
            <span>{assessLoading ? 'Registering...' : 'Register'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline Styles
const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem'
};

const labelStyle = {
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text-secondary)'
};

const inputStyle = {
  padding: '0.625rem 0.875rem',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  transition: 'border-color var(--transition-fast)'
};

const selectStyle = {
  padding: '0.625rem 0.875rem',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'border-color var(--transition-fast)'
};

const textareaStyle = {
  padding: '0.625rem 0.875rem',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.8125rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  resize: 'vertical',
  transition: 'border-color var(--transition-fast)'
};

const actionButtonStyle = {
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem',
  transition: 'all var(--transition-fast)'
};

const tagsContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.375rem',
  marginTop: '0.25rem'
};

const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  backgroundColor: 'rgba(99, 102, 241, 0.12)',
  color: '#818cf8',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  padding: '0.25rem 0.5rem',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.75rem',
  fontWeight: 600
};

const dotTypingStyle = {
  width: '4px',
  height: '4px',
  borderRadius: '50%',
  backgroundColor: 'var(--text-secondary)',
  boxShadow: '9px 0 0 0 var(--text-secondary), 18px 0 0 0 var(--text-secondary)',
  animation: 'pulse 1s infinite alternate',
  marginLeft: '4px'
};

export default InteractionWorkspace;
