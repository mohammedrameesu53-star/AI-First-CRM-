import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHCPById } from '../store/hcpSlice';
import { User, MapPin, Tag } from 'lucide-react';

function HCPCard({ hcp }) {
  const dispatch = useDispatch();
  const selectedHCP = useSelector((state) => state.hcp.selectedHCP);
  
  const isSelected = selectedHCP && selectedHCP.id === hcp.id;

  // Find the latest assessment to get the classification tag
  const latestAssessment = hcp.assessments && hcp.assessments.length > 0
    ? [...hcp.assessments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;

  const handleSelect = () => {
    dispatch(fetchHCPById(hcp.id));
  };

  const getClassificationStyle = (cls) => {
    if (!cls) return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' };
    const lower = cls.toLowerCase();
    if (lower.includes('high')) return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }; // Success Green
    if (lower.includes('lead')) return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }; // Primary Indigo
    return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }; // Accent Amber
  };

  const badge = getClassificationStyle(latestAssessment?.classification);

  return (
    <div 
      onClick={handleSelect}
      className={`card-list-item ${isSelected ? 'selected' : ''}`}
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {hcp.name}
        </h4>
        <span style={{ 
          fontSize: '0.75rem', 
          padding: '0.125rem 0.5rem', 
          borderRadius: 'var(--radius-full)', 
          fontWeight: 600,
          backgroundColor: badge.bg,
          color: badge.color
        }}>
          {latestAssessment?.classification || 'Unassessed'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        <User size={13} style={{ color: 'var(--primary)' }} />
        <span>{hcp.specialty}</span>
      </div>

      {hcp.clinic_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <MapPin size={13} />
          <span>{hcp.clinic_name}{hcp.city ? `, ${hcp.city}` : ''}</span>
        </div>
      )}
    </div>
  );
}

export default HCPCard;
