import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHCPs, clearSelectedHCP } from '../store/hcpSlice';
import HCPSidebar from './HCPSidebar';
import HCPDetail from './HCPDetail';
import HCPModal from './HCPModal';
import InteractionWorkspace from './InteractionWorkspace';
import { BrainCircuit, Database, ShieldAlert, Users } from 'lucide-react';

function HCPDashboard() {
  const dispatch = useDispatch();
  const { loading, error, selectedHCP } = useSelector((state) => state.hcp);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAddingHCP, setIsAddingHCP] = useState(false);

  useEffect(() => {
    dispatch(fetchHCPs());
  }, [dispatch]);

  useEffect(() => {
    if (selectedHCP) {
      setIsAddingHCP(false);
    }
  }, [selectedHCP]);

  const handleOpenRegister = () => {
    dispatch(clearSelectedHCP());
    setEditMode(false);
    setIsAddingHCP(true);
  };

  const handleOpenEdit = () => {
    setEditMode(true);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Central Header Navigation */}
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(24, 27, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => dispatch(clearSelectedHCP())}>
          <BrainCircuit size={26} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            AI-First HCP <span style={{ color: 'var(--primary)' }}>CRM</span>
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8125rem',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            <Database size={14} style={{ color: 'var(--secondary)' }} />
            <span>Database Status: Connected</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Area split: Left Sidebar / Right Detail Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {loading && !selectedHCP && (
          <div style={loadingOverlayStyle}>
            <div className="spinner" style={bigSpinnerStyle}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading registry records...</p>
          </div>
        )}

        {error && !selectedHCP && (
          <div style={loadingOverlayStyle}>
            <ShieldAlert size={48} style={{ color: 'var(--danger)' }} />
            <p style={{ marginTop: '1rem', color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {/* Sidebar panel (30% or 360px minimum width) */}
        <div style={{ width: '350px', flexShrink: 0, height: '100%' }}>
          <HCPSidebar onOpenRegisterModal={handleOpenRegister} />
        </div>

        {/* Workspace Detail (70% remaining space) */}
        <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          {isAddingHCP ? (
            <div style={{ height: '100%', overflow: 'hidden', padding: '1.5rem 2rem 2.5rem 2rem' }}>
              <InteractionWorkspace onCancel={() => setIsAddingHCP(false)} />
            </div>
          ) : (
            <HCPDetail onOpenEditModal={handleOpenEdit} />
          )}
        </div>
      </div>

      {/* Register/Edit profile Modal Overlay */}
      <HCPModal 
        isOpen={modalOpen} 
        onClose={handleCloseModal} 
        editHcp={editMode ? selectedHCP : null} 
      />
    </div>
  );
}

// Styling Constants
const loadingOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--bg-dark)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 50
};

const bigSpinnerStyle = {
  width: '32px',
  height: '32px',
  border: '3px solid rgba(255,255,255,0.08)',
  borderTopColor: 'var(--primary)',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite'
};

export default HCPDashboard;
