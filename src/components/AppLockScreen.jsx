import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Zap,
  Clock,
  RotateCcw
} from 'lucide-react';
import { verifySecurityPin } from '../services/firebase';

export default function AppLockScreen({ onUnlock, lockReason = '' }) {
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async (pinToVerify) => {
    const fullPin = pinToVerify !== undefined ? pinToVerify : pinDigits.join('');
    if (fullPin.length !== 4) {
      setError('Kripya pura 4-digit PIN dalein');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifySecurityPin(fullPin);
      if (isValid) {
        onUnlock();
      } else {
        setError('Incorrect PIN! Database se verify nahi hua.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPinDigits(['', '', '', '']);
        setTimeout(() => {
          if (inputRefs[0].current) inputRefs[0].current.focus();
        }, 80);
      }
    } catch (err) {
      console.error('Error during PIN verification:', err);
      setError('Verification error: ' + (err.message || 'Network error'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...pinDigits];
      newDigits[index] = '';
      setPinDigits(newDigits);
      return;
    }

    // Pasted multiple digits
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

    // Auto advance
    if (index < 3 && cleanVal) {
      if (inputRefs[index + 1].current) {
        inputRefs[index + 1].current.focus();
      }
    }

    // Auto submit on 4th digit
    const updatedFullPin = newDigits.join('');
    if (index === 3 && cleanVal && updatedFullPin.length === 4) {
      handleVerify(updatedFullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!pinDigits[index] && index > 0) {
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

  const handleClear = () => {
    if (isVerifying) return;
    setPinDigits(['', '', '', '']);
    setError('');
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  };

  const hasAnyDigit = pinDigits.some(d => d !== '');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, rgba(6, 182, 212, 0.1) 40%, #0a0e17 80%)'
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 320,
        height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Lock Container Card */}
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '36px 28px',
          backgroundColor: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 24,
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.25)',
          position: 'relative',
          zIndex: 1,
          animation: shake ? 'shake 0.4s ease-in-out' : 'fadeInUp 0.35s ease-out'
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-10px); }
            40%, 80% { transform: translateX(10px); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseRing {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 0.3; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
        `}</style>

        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <div style={{
            position: 'relative',
            width: 68,
            height: 68,
            marginBottom: 16
          }}>
            {/* Glowing ring animation */}
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 24,
              border: '2px solid rgba(99, 102, 241, 0.4)',
              animation: 'pulseRing 3s infinite ease-in-out'
            }} />
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.45)'
            }}>
              <Lock size={32} color="#ffffff" strokeWidth={2.4} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={18} color="#818cf8" />
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              <span className="gradient-text">Gautam-Rent</span>
            </h1>
          </div>

          <h2 style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '4px 0 6px'
          }}>
            Security PIN Required
          </h2>

          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            margin: 0,
            maxWidth: 320,
            lineHeight: 1.45
          }}>
            Website access is locked. Enter your 4-digit PIN to unlock bills and kirayedaar records.
          </p>
        </div>

        {/* Lock / Expiry Notice Banner */}
        {lockReason && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 16,
            color: '#fbbf24',
            fontSize: '0.825rem',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            <Clock size={16} style={{ flexShrink: 0 }} />
            <span>{lockReason}</span>
          </div>
        )}

        {/* Error Notice Banner */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#fb7185',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.825rem',
            fontWeight: 600,
            marginBottom: 16
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Discrete PIN Input Boxes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 14,
          marginBottom: 16
        }}>
          {pinDigits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="tel"
              name={`app-lock-pin-${index}`}
              id={`app-lock-pin-box-${index}`}
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
                width: 60,
                height: 66,
                textAlign: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: digit
                  ? '2px solid #818cf8'
                  : error
                    ? '2px solid #f43f5e'
                    : '2px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 14,
                outline: 'none',
                boxShadow: digit ? '0 0 16px rgba(129, 140, 248, 0.35)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                WebkitTextSecurity: 'disc',
                textSecurity: 'disc',
                cursor: 'text'
              }}
            />
          ))}
        </div>

        {/* Clear Digits Action Link */}
        {hasAnyDigit && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <RotateCcw size={13} />
              <span>Clear PIN</span>
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => handleVerify()}
          className="btn btn-primary"
          disabled={isVerifying || pinDigits.some(d => !d)}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 8px 25px rgba(99, 102, 241, 0.35)',
            cursor: isVerifying || pinDigits.some(d => !d) ? 'not-allowed' : 'pointer',
            marginTop: hasAnyDigit ? 0 : 8
          }}
        >
          {isVerifying ? (
            <>
              <div style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Verifying Cloud PIN...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Unlock Gautam-Rent</span>
            </>
          )}
        </button>

        {/* Footer Security Badges */}
        <div style={{
          marginTop: 22,
          paddingTop: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-dim)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <KeyRound size={13} color="#6366f1" />
            <span>Database Secured</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} color="#06b6d4" />
            <span>15-Min Auto-Lock</span>
          </div>
        </div>
      </div>
    </div>
  );
}
