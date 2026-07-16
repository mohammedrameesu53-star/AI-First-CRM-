import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteHCP } from '../store/hcpSlice';
import { 
  Building2, Mail, Phone, MapPin, Edit, Trash2, 
  Clock, Award, BrainCircuit, BarChart3, 
  MessageSquareQuote, UserCheck2, ListTodo, Smile
} from 'lucide-react';

function HCPDetail({ onOpenEditModal }) {
  const dispatch = useDispatch();
  const hcp = useSelector((state) => state.hcp.selectedHCP);


  if (!hcp) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(99, 102, 241, 0.05)',
          border: '1px dashed var(--primary)',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <BrainCircuit size={48} style={{ color: 'var(--primary)' }} />
        </div>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 700 }}>
          HCP Assessment Workspace
        </h3>
        <p style={{ maxWidth: '420px', fontSize: '0.9375rem' }}>
          Select a Healthcare Professional from the registry or register a new one to view their profile, submit interaction transcripts, and generate AI insights.
        </p>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${hcp.name}? This will permanently remove all transcript assessments.`)) {
      dispatch(deleteHCP(hcp.id));
    }
  };


  // Sort assessments in descending order (newest first)
  const sortedAssessments = hcp.assessments && hcp.assessments.length > 0
    ? [...hcp.assessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  const getClassificationStyle = (cls) => {
    if (!cls) return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' };
    const lower = cls.toLowerCase();
    if (lower.includes('high')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    if (lower.includes('lead')) return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
    return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'transparent',
      overflowY: 'auto',
      padding: '1.5rem 2rem 3rem 2rem'
    }}>
      {/* Detail Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {hcp.name}
            </h2>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              backgroundColor: hcp.status === 'Active' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: hcp.status === 'Active' ? '#10b981' : '#ef4444',
              border: hcp.status === 'Active' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {hcp.status}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontWeight: 500 }}>
            {hcp.specialty}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onOpenEditModal} className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem', display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.875rem' }}>
            <Edit size={14} />
            <span>Edit Profile</span>
          </button>
          <button onClick={handleDelete} className="btn btn-secondary" style={{ padding: '0.5rem 0.875rem', display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.875rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Meta Profile Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {hcp.clinic_name && (
          <div style={metaCardStyle}>
            <Building2 size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={metaCardLabelStyle}>Clinic / Facility</p>
              <p style={metaCardValueStyle}>{hcp.clinic_name}</p>
            </div>
          </div>
        )}
        
        {hcp.email && (
          <div style={metaCardStyle}>
            <Mail size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={metaCardLabelStyle}>Email Address</p>
              <p style={metaCardValueStyle}>{hcp.email}</p>
            </div>
          </div>
        )}

        {hcp.phone && (
          <div style={metaCardStyle}>
            <Phone size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={metaCardLabelStyle}>Phone Number</p>
              <p style={metaCardValueStyle}>{hcp.phone}</p>
            </div>
          </div>
        )}

        {hcp.city && (
          <div style={metaCardStyle}>
            <MapPin size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <p style={metaCardLabelStyle}>City / Territory</p>
              <p style={metaCardValueStyle}>{hcp.city}</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Bio / Notes */}
      {hcp.notes && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Background & Profile Notes
          </h4>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
            {hcp.notes}
          </p>
        </div>
      )}


      {/* Historical Evaluations Timeline */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        Assessment History
      </h3>

      {sortedAssessments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedAssessments.map((assess) => {
            const priorityBadge = getClassificationStyle(assess.classification);
            return (
              <div key={assess.id} style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(24, 27, 42, 0.25)',
                overflow: 'hidden'
              }}>
                {/* Timeline Card Header */}
                <div style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    <Clock size={14} />
                    <span>{new Date(assess.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                      <Award size={14} style={{ color: 'var(--accent)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Confidence: </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {assess.confidence_score ? `${Math.round(assess.confidence_score * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      backgroundColor: priorityBadge.bg,
                      color: priorityBadge.color
                    }}>
                      {assess.classification || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Timeline Card Body */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Summary */}
                  {assess.summary && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <MessageSquareQuote size={14} style={{ color: 'var(--primary)' }} />
                        <span>AI Executive Summary</span>
                      </h5>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {assess.summary}
                      </p>
                    </div>
                  )}

                  {/* AI Structured Metrics (Sentiment, Needs, Tasks) */}
                  {assess.report && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1rem',
                      borderTop: '1px dashed var(--border-color)',
                      paddingTop: '1.25rem',
                      marginTop: '0.25rem'
                    }}>
                      {/* Sentiment */}
                      {assess.report.sentiment && (
                        <div style={reportMetricColStyle}>
                          <h6 style={metricHeaderStyle}>
                            <Smile size={14} style={{ color: 'var(--secondary)' }} />
                            <span>Sentiment</span>
                          </h6>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              color: assess.report.sentiment.toLowerCase() === 'positive' ? '#10b981' : assess.report.sentiment.toLowerCase() === 'negative' ? '#ef4444' : '#fbbf24'
                            }}>
                              {assess.report.sentiment}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Needs */}
                      {assess.report.needs && assess.report.needs.length > 0 && (
                        <div style={reportMetricColStyle}>
                          <h6 style={metricHeaderStyle}>
                            <UserCheck2 size={14} style={{ color: 'var(--primary)' }} />
                            <span>Identified Needs</span>
                          </h6>
                          <ul style={metricListStyle}>
                            {assess.report.needs.map((need, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>{need}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up Tasks */}
                      {assess.report.followups && assess.report.followups.length > 0 && (
                        <div style={reportMetricColStyle}>
                          <h6 style={metricHeaderStyle}>
                            <ListTodo size={14} style={{ color: 'var(--accent)' }} />
                            <span>Follow-up Actions</span>
                          </h6>
                          <ul style={metricListStyle}>
                            {assess.report.followups.map((task, idx) => (
                              <li key={idx} style={{ marginBottom: '0.25rem' }}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transcript Expand/Collapse Toggle */}
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none', userSelect: 'none', fontWeight: 500 }}>
                      View Full Conversation Transcript
                    </summary>
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem',
                      marginTop: '0.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {assess.transcript}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(24, 27, 42, 0.1)'
        }}>
          <BarChart3 size={32} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }}>No assessments generated yet</p>
          <p style={{ fontSize: '0.8125rem' }}>Use the assessment workspace above to submit interaction logs and run AI evaluation.</p>
        </div>
      )}
    </div>
  );
}

// Styling Constants
const metaCardStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  padding: '0.875rem 1.125rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem'
};

const metaCardLabelStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  margin: 0,
};

const metaCardValueStyle = {
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  fontWeight: 600,
  margin: 0,
};

const reportMetricColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem'
};

const metricHeaderStyle = {
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  margin: 0,
};

const metricListStyle = {
  margin: '0.25rem 0 0 1rem',
  padding: 0,
  fontSize: '0.8125rem',
  color: 'var(--text-primary)',
  lineHeight: 1.4
};

const spinnerStyle = {
  width: '14px',
  height: '14px',
  border: '2px solid rgba(255,255,255,0.2)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 0.6s linear infinite',
  marginRight: '0.25rem'
};

export default HCPDetail;
