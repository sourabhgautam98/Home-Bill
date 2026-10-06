import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName = '',
  itemType = 'record',
  warningExtra = ''
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '28px 24px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          textAlign: 'center'
        }}
      >
        {/* Top Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 4 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Trash Warning Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 20px rgba(244, 63, 94, 0.2)'
        }}>
          <Trash2 size={26} color="#f43f5e" />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete {itemType}{' '}
          <strong style={{ color: '#ffffff' }}>"{itemName}"</strong>?
        </p>

        {warningExtra && (
          <div style={{
            margin: '-4px 0 16px',
            padding: '10px 14px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 10,
            fontSize: '0.825rem',
            color: '#fca5a5',
            lineHeight: 1.4
          }}>
            {warningExtra}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          marginBottom: 24
        }}>
          <AlertTriangle size={13} color="#f59e0b" />
          <span>Security PIN will be required to confirm deletion.</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', minHeight: 44, fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              handleClose();
              onConfirm();
            }}
            className="btn btn-danger"
            style={{ flex: 1.3, padding: '12px', minHeight: 44, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Trash2 size={15} />
            <span>Yes, Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
