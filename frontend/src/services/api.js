const BASE_URL = '/api/api/v1';

export const api = {
  // HCP Endpoints
  async getHCPs() {
    const response = await fetch(`${BASE_URL}/hcp/`);
    if (!response.ok) throw new Error('Failed to fetch HCPs');
    return response.json();
  },

  async getHCPById(id) {
    const response = await fetch(`${BASE_URL}/hcp/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch HCP with ID ${id}`);
    return response.json();
  },

  async createHCP(hcpData) {
    const response = await fetch(`${BASE_URL}/hcp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hcpData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to create HCP');
    }
    return response.json();
  },

  async updateHCP(id, hcpData) {
    const response = await fetch(`${BASE_URL}/hcp/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hcpData),
    });
    if (!response.ok) throw new Error(`Failed to update HCP with ID ${id}`);
    return response.json();
  },

  async deleteHCP(id) {
    const response = await fetch(`${BASE_URL}/hcp/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete HCP with ID ${id}`);
    return true;
  },

  // Assessment Endpoints
  async createAssessment(hcpId, transcript) {
    const response = await fetch(`${BASE_URL}/hcp/${hcpId}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // matches the backend expecting raw string for transcript_data
      body: transcript,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to generate assessment');
    }
    return response.json();
  },

  async simulateChat(personaName, personaTitle, messages) {
    const response = await fetch(`${BASE_URL}/hcp/simulate-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona_name: personaName,
        persona_title: personaTitle,
        messages: messages.map(m => ({ sender: m.sender, text: m.text }))
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to simulate chat');
    }
    return response.json();
  },

  async chatAssistant(message, chatHistory, formData, hcpId = null) {
    const response = await fetch(`${BASE_URL}/hcp/chat-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        chat_history: chatHistory.map(m => ({ sender: m.sender, text: m.text })),
        form_data: formData,
        hcp_id: hcpId
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to communicate with AI Assistant');
    }
    return response.json();
  },
};
