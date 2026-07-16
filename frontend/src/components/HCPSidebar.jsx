import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import HCPCard from './HCPCard';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';

function HCPSidebar({ onOpenRegisterModal }) {
  const hcpList = useSelector((state) => state.hcp.list);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  // Extract unique list of specialties for filter dropdown
  const specialties = ['All Specialties', ...new Set(hcpList.map(hcp => hcp.specialty))];

  // Perform search and filter locally
  const filteredHCPs = hcpList.filter(hcp => {
    const matchesSearch = 
      hcp.name.toLowerCase().includes(search.toLowerCase()) ||
      (hcp.clinic_name && hcp.clinic_name.toLowerCase().includes(search.toLowerCase())) ||
      (hcp.city && hcp.city.toLowerCase().includes(search.toLowerCase()));

    const matchesSpecialty = 
      !specialtyFilter || 
      specialtyFilter === 'All Specialties' || 
      hcp.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'rgba(24, 27, 42, 0.4)',
      width: '100%'
    }}>
      {/* Header controls */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>HCPs Registry</h2>
          <button 
            className="btn btn-primary" 
            onClick={onOpenRegisterModal}
            style={{ 
              padding: '0.5rem 0.875rem', 
              fontSize: '0.875rem', 
              display: 'flex', 
              gap: '0.375rem', 
              alignItems: 'center' 
            }}
          >
            <Plus size={16} />
            <span>Add HCP</span>
          </button>
        </div>

        {/* Search input bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search name, clinic, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem 0.625rem 2.25rem',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SlidersHorizontal size={14} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              outline: 'none'
            }}
          >
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List items rendering */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1.25rem 1.25rem 2rem 1.25rem',
        maxHeight: 'calc(100vh - 170px)'
      }}>
        {filteredHCPs.length > 0 ? (
          filteredHCPs.map(hcp => (
            <HCPCard key={hcp.id} hcp={hcp} />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.875rem' }}>No Healthcare Professionals found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HCPSidebar;
