import React, { useState } from 'react';
import { Settings, X, Save, Building, Phone, MapPin } from 'lucide-react';
import { getPropertySettings, savePropertySettings } from '../services/firebase';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [settings, setSettings] = useState(() => getPropertySettings());

  if (!isOpen) return null;

  const handleClose = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    savePropertySettings(settings);
    onSettingsUpdated && onSettingsUpdated(settings);
    handleClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 20,
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Settings size={20} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>
                Property & Bill Header Settings
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Customizes the official name and terms printed on receipts
              </p>
            </div>
          </div>

          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" autoCorrect="off" spellCheck="false" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Property / Building Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={settings.propertyName}
              onChange={(e) => setSettings({ ...settings, propertyName: e.target.value })}
              placeholder="e.g. Shree Krishna Nivas"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Owner / Landlord Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="input-label" style={{ margin: 0 }}>Owner Contact Phone</label>
                {settings.ownerPhone && (
                  <span style={{ fontSize: '0.72rem', color: settings.ownerPhone.length === 10 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {settings.ownerPhone.length}/10 Digits
                  </span>
                )}
              </div>
              <input
                type="tel"
                maxLength={10}
                className="form-input"
                value={settings.ownerPhone}
                onChange={(e) => setSettings({ ...settings, ownerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Address</label>
            <input
              type="text"
              className="form-input"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="e.g. Sector 14, Near City Center"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <label className="input-label">Currency</label>
              <input
                type="text"
                className="form-input"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                placeholder="₹"
              />
            </div>
            <div>
              <label className="input-label">Terms on Invoice</label>
              <input
                type="text"
                className="form-input"
                value={settings.termsText}
                onChange={(e) => setSettings({ ...settings, termsText: e.target.value })}
                placeholder="Pay before 5th of every month..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              <Save size={16} />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
