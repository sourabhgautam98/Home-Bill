import React from 'react';
import {
  Zap,
  Users,
  Receipt,
  Lock,
  Clock
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  tenantCount = 0,
  billCount = 0,
  onTabClick,
  sessionRemainingSeconds = null,
  onLockNow
}) {
  const formatTime = (secs) => {
    if (secs === null || secs === undefined) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowTime = sessionRemainingSeconds !== null && sessionRemainingSeconds < 120;

  return (
    <header className="no-print app-header">
      <div className="app-header-container">
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            flexShrink: 0
          }}>
            <Zap size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: '1.25rem',
                margin: 0,
                lineHeight: 1.2,
                fontWeight: 800
              }}>
                <span className="gradient-text">Gautam-Rent</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right side controls: Navigation Tabs + Session Timer & Lock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Navigation Tabs */}
          <nav className="header-nav-tabs">
            <button
              onClick={() => {
                setActiveTab('generate');
                if (onTabClick) onTabClick('generate');
              }}
              className={`nav-tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            >
              <Zap size={15} />
              <span className="tab-label-full">Generate Bill</span>
              <span className="tab-label-short">Bill</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tenants');
                if (onTabClick) onTabClick('tenants');
              }}
              className={`nav-tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
            >
              <Users size={15} />
              <span className="tab-label-full">Kirayedaar</span>
              <span className="tab-label-short">Rent</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                if (onTabClick) onTabClick('history');
              }}
              className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            >
              <Receipt size={15} />
              <span>History</span>
            </button>
          </nav>

          {/* Session Timer & Quick Lock Button */}
          {sessionRemainingSeconds !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isLowTime ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isLowTime ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-color)'}`,
              padding: '4px 8px 4px 10px',
              borderRadius: 12,
              transition: 'all 0.2s ease'
            }}>
              <Clock
                size={14}
                color={isLowTime ? '#fb7185' : '#06b6d4'}
                style={{ animation: isLowTime ? 'pulse 1s infinite' : 'none' }}
              />
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: isLowTime ? '#fb7185' : 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {formatTime(sessionRemainingSeconds)}
              </span>
              <button
                type="button"
                onClick={onLockNow}
                title="Lock App (PIN screen)"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginLeft: 2,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Lock size={12} />
                <span>Lock</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
