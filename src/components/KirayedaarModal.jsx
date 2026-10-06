import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';

export default function KirayedaarModal({
  isOpen,
  onClose,
  onSave,
  tenant = null,
  currencySymbol = '₹'
}) {
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    phone: '',
    previousReading: '',
    rent: '',
    waterBill: '200',
    unitRate: '12'
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        room: tenant.room || '',
        phone: tenant.phone || '',
        previousReading: tenant.previousReading !== undefined && tenant.previousReading !== null ? tenant.previousReading : '',
        rent: tenant.rent !== undefined ? tenant.rent : '',
        waterBill: tenant.waterBill !== undefined ? tenant.waterBill : '200',
        unitRate: tenant.unitRate || '12'
      });
    } else {
      setFormData({
        name: '',
        room: '',
        phone: '',
        previousReading: '',
        rent: '',
        waterBill: '200',
        unitRate: '12'
      });
    }
    setFormError('');
    setIsSaving(false);
  }, [tenant, isOpen]);

  if (!isOpen) return null;

  const handleNumberKeyDown = (e, allowDecimals = true) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
    if (!allowDecimals && e.key === '.') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Kirayedaar name is required.');
      return;
    }

    const cleanPhone = formData.phone ? formData.phone.trim() : '';
    if (!cleanPhone) {
      setFormError('Mobile number is required.');
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setFormError(`Mobile number me pure 10 digit hone chahiye (abhi sirf ${cleanPhone.length} digit hai).`);
      return;
    }

    if (formData.previousReading === '' || isNaN(formData.previousReading) || Number(formData.previousReading) < 0) {
      setFormError('Old Reading me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    if (formData.unitRate === '' || isNaN(formData.unitRate) || Number(formData.unitRate) <= 0) {
      setFormError('Per Unit Rate me valid number hona chahiye (0 se jyada).');
      return;
    }

    if (formData.rent === '' || isNaN(formData.rent) || Number(formData.rent) < 0) {
      setFormError('Monthly Rent me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    if (formData.waterBill === '' || isNaN(formData.waterBill) || Number(formData.waterBill) < 0) {
      setFormError('Fixed Water Bill me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    try {
      setIsSaving(true);
      const success = await onSave({
        ...formData,
        name: formData.name.trim(),
        room: formData.room ? formData.room.trim() : '',
        phone: cleanPhone,
        previousReading: Number(formData.previousReading),
        unitRate: Number(formData.unitRate),
        rent: Number(formData.rent),
        waterBill: Number(formData.waterBill)
      });
      if (success) {
        onClose();
      }
    } catch (err) {
      setFormError('Error saving kirayedaar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          padding: 24,
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={20} color="#818cf8" />
            <span>{tenant ? 'Edit Kirayedaar' : 'Register Kirayedaar'}</span>
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {formError && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-rose-light)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: 16
          }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" autoCorrect="off" spellCheck="false" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Kirayedaar Name */}
          <div>
            <label className="input-label">Kirayedaar Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              autoFocus
            />
          </div>

          {/* Room Number */}
          <div>
            <label className="input-label">Room Number (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Room 101"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Phone */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-label" style={{ margin: 0 }}>
                Mobile Number *
              </label>
              <span style={{ 
                fontSize: '0.72rem', 
                color: formData.phone.length === 10 ? '#10b981' : (formData.phone.length > 0 ? '#f59e0b' : 'var(--text-muted)'),
                fontWeight: 600
              }}>
                {formData.phone.length}/10 Digits
              </span>
            </div>
            <input
              type="tel"
              required
              className="form-input"
              placeholder="e.g. 9876543210"
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]{10}"
              value={formData.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: digits });
              }}
            />
          </div>

          {/* Meter Reading & Rate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label" style={{ color: '#38bdf8' }}>
                Old Reading *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                className="form-input"
                placeholder=""
                value={formData.previousReading}
                onKeyDown={(e) => handleNumberKeyDown(e, true)}
                onChange={(e) => setFormData({ ...formData, previousReading: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Per Unit Rate ({currencySymbol}) *</label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                className="form-input"
                placeholder="12"
                value={formData.unitRate}
                onKeyDown={(e) => handleNumberKeyDown(e, true)}
                onChange={(e) => setFormData({ ...formData, unitRate: e.target.value })}
              />
            </div>
          </div>

          {/* Rent & Water */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Monthly Rent ({currencySymbol}) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                className="form-input"
                placeholder="0"
                value={formData.rent}
                onKeyDown={(e) => handleNumberKeyDown(e, true)}
                onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Fixed Water Bill ({currencySymbol}) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                className="form-input"
                placeholder="200"
                value={formData.waterBill}
                onKeyDown={(e) => handleNumberKeyDown(e, true)}
                onChange={(e) => setFormData({ ...formData, waterBill: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: 44 }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.5, minHeight: 44 }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (tenant ? 'Save Changes' : 'Register Kirayedaar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
