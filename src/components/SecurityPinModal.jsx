import React, { useState, useRef, useEffect } from 'react';
import { Lock, X, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { verifySecurityPin } from '../services/firebase';

export default function SecurityPinModal({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
  actionTitle = 'Security PIN Required',
  actionSubtitle = 'Enter your 4-digit PIN to proceed'
}) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Reset and auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '']);
      setError('');
      setIsVerifying(false);
      setShake(false);
      const timer = setTimeout(() => {
        if (inputRefs[0].current) {
          inputRefs[0].current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle verify submission
  const handleVerify = async (pinToVerify) => {
    const fullPin = pinToVerify !== undefined ? pinToVerify : pinDigits.join('');
    if (fullPin.length !== 4) {
      setError('Please enter complete 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifySecurityPin(fullPin);
      if (isValid) {
        onSuccess();
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPinDigits(['', '', '', '']);
        setTimeout(() => {
          if (inputRefs[0].current) inputRefs[0].current.focus();
        }, 50);
      }
    } catch (err) {
      setError('Error verifying PIN: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (index, value) => {
    // Only allow numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...pinDigits];
      newDigits[index] = '';
      setPinDigits(newDigits);
      return;
    }

    // If pasted multiple digits
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 4).split('');
      const newDigits = [...pinDigits];
      pasted.forEach((char, i) => {
        if (i < 4) newDigits[i] = char;
      });
      setPinDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 3);
      if (inputRefs[focusIndex].current) inputRefs[focusIndex].current.focus();

      if (newDigits.every(d => d !== '') && newDigits.join('').length === 4) {
        handleVerify(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal[cleanVal.length - 1];
    setPinDigits(newDigits);
    setError('');

    // Auto advance to next box
    if (index < 3 && cleanVal) {
      if (inputRefs[index + 1].current) {
        inputRefs[index + 1].current.focus();
      }
    }

    // If 4 digits completed, auto trigger verification
    const updatedFullPin = newDigits.join('');
    if (index === 3 && cleanVal && updatedFullPin.length === 4) {
      handleVerify(updatedFullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...pinDigits];
        newDigits[index - 1] = '';
        setPinDigits(newDigits);
        if (inputRefs[index - 1].current) {
          inputRefs[index - 1].current.focus();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleCancel = () => {
    // Blur any active element immediately to dismiss any browser autofill prompt or touch focus
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel} style={{ zIndex: 1200 }}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '28px 24px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
          animation: shake ? 'shake 0.4s ease-in-out' : 'none'
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Top Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 4 }}>
          <button
            type="button"
            onClick={handleCancel}
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

        {/* Lock Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)'
        }}>
          <Lock size={26} color="#818cf8" strokeWidth={2.3} />
        </div>

        {/* Title & Subtitle */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
          {actionTitle}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 22px 0', lineHeight: 1.4 }}>
          {actionSubtitle}
        </p>

        {/* Error message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            color: '#fb7185',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: '0.825rem',
            marginBottom: 18
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Discrete PIN Input Boxes - Using type="tel" and text-security to mask without triggering Chrome password manager autofill */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          {pinDigits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="tel"
              name={`pin-box-${index}`}
              id={`security-pin-box-${index}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              style={{
                width: 52,
                height: 58,
                textAlign: 'center',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: digit 
                  ? '2px solid #818cf8' 
                  : error 
                    ? '2px solid #f43f5e' 
                    : '2px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                outline: 'none',
                boxShadow: digit ? '0 0 12px rgba(129, 140, 248, 0.3)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                WebkitTextSecurity: 'disc',
                textSecurity: 'disc'
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', minHeight: 44, fontSize: '0.9rem' }}
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleVerify()}
            className="btn btn-primary"
            style={{ flex: 1.5, padding: '12px', minHeight: 44, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            disabled={isVerifying || pinDigits.some(d => !d)}
          >
            {isVerifying ? (
              <span>Verifying...</span>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Verify & Proceed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
