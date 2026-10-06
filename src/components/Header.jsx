import React from 'react';
import {
  Zap,
  Users,
  Receipt
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  tenantCount = 0,
  billCount = 0,
  onTabClick
}) {
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
      </div>
    </header>
  );
}
