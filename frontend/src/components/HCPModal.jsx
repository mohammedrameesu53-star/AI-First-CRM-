import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createHCP, updateHCP, clearHCPError } from '../store/hcpSlice';
import { X } from 'lucide-react';

function HCPModal({ isOpen, onClose, editHcp = null }) {
  const dispatch = useDispatch();
  const { actionLoading, error } = useSelector((state) => state.hcp);

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    clinic_name: '',
    email: '',
    phone: '',
    city: '',
    status: 'Active',
    notes: '',
  });

  // Reset or fill form on open/edit change
  useEffect(() => {
    if (editHcp) {
      setFormData({
        name: editHcp.name || '',
        specialty: editHcp.specialty || '',
        clinic_name: editHcp.clinic_name || '',
        email: editHcp.email || '',
        phone: editHcp.phone || '',
        city: editHcp.city || '',
        status: editHcp.status || 'Active',
        notes: editHcp.notes || '',
      });
    } else {
      setFormData({
        name: '',
        specialty: '',
        clinic_name: '',
        email: '',
        phone: '',
        city: '',
        status: 'Active',
        notes: '',
      });
    }
    dispatch(clearHCPError());
  }, [editHcp, isOpen, dispatch]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.specialty) return;

    let success = false;
    if (editHcp) {
      const result = await dispatch(updateHCP({ id: editHcp.id, data: formData }));
      if (updateHCP.fulfilled.match(result)) success = true;
    } else {
      const result = await dispatch(createHCP(formData));
      if (createHCP.fulfilled.match(result)) success = true;
    }

    if (success) {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 17, 26, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div 
        className="fade-in"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '550px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {editHcp ? 'Edit Profile Details' : 'Register New HCP'}
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '1.5rem',
            maxHeight: '70vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--danger)',
                color: '#fca5a5',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {/* Basic Info Rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Jane Doe"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Specialty *</label>
                <input
                  type="text"
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Cardiology"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane.doe@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Clinic and City */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Clinic/Hospital Name</label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  placeholder="Mercy General"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Boston"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Status Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1rem'
                }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Bio Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Background Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Key preferences, office hours, or general background info..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Saving...' : editHcp ? 'Save Changes' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '0.625rem 0.875rem',
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  transition: 'border-color var(--transition-fast)'
};

export default HCPModal;
