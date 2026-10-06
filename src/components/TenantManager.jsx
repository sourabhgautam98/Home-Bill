import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Home,
  Zap,
  Droplet,
  Phone,
  Edit3,
  Trash2,
  Search,
  PlusCircle,
  FileText,
  X,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

export default function TenantManager({
  tenants,
  onOpenAddTenant,
  onEditTenant,
  onDeleteTenant,
  onSelectForBill,
  currencySymbol = '₹'
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.room && t.room.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.phone && t.phone.includes(searchQuery))
  );

  return (
    <div className="page-container">
      {/* Header bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Registered <span className="gradient-text">Kirayedaar</span></span>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 20,
              padding: '2px 10px'
            }}>
              {tenants.length}
            </span>
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: 'auto' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: 200, flex: 1 }}>
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              placeholder="Search kirayedaar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ paddingLeft: 36, paddingRight: searchQuery ? 36 : 12, fontSize: '0.875rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button onClick={onOpenAddTenant} className="btn btn-primary" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
            <UserPlus size={16} />
            <span>+ Register Kirayedaar</span>
          </button>
        </div>
      </div>

      {/* Tenants Grid */}
      {filteredTenants.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Users size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No Kirayedaar Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 18 }}>
            {searchQuery ? `No kirayedaar matches "${searchQuery}".` : 'Register your first kirayedaar to get started.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
                <X size={15} />
                <span>Show All Kirayedaar ({tenants.length})</span>
              </button>
            )}
            <button onClick={onOpenAddTenant} className="btn btn-primary">
              <PlusCircle size={16} />
              <span>Register Kirayedaar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="tenants-grid">
          {filteredTenants.map(tenant => (
            <div
              key={tenant.id}
              className="glass-card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Card Top: Name & Room badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#ffffff' }}>
                      {tenant.name}
                    </h3>
                    {tenant.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <Phone size={12} />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>

                  {tenant.room && (
                    <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>
                      <Home size={12} />
                      <span>{tenant.room}</span>
                    </span>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: 16
                }}>
                  {/* Current Reading */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Old Reading
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={14} />
                      <span>{tenant.previousReading !== undefined ? tenant.previousReading : '0'}</span>
                    </div>
                  </div>

                  {/* Monthly Rent */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Monthly Rent
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                      {formatCurrency(tenant.rent, currencySymbol)}
                    </div>
                  </div>

                  {/* Water Bill */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Water Charges
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Droplet size={13} color="#06b6d4" />
                      <span>{formatCurrency(tenant.waterBill, currencySymbol)}</span>
                    </div>
                  </div>

                  {/* Electricity Rate */}
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Unit Rate
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fbbf24' }}>
                      {currencySymbol}{tenant.unitRate || 12}/unit
                    </div>
                  </div>
                </div>

                {/* Kiraya Lene Ki Tareekh (Rent Due Day) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.22)',
                  padding: '9px 12px',
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: '0.825rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc', fontWeight: 600 }}>
                    <Calendar size={14} color="#818cf8" />
                    <span>Kiraya Lene Ki Tareekh:</span>
                  </div>
                  <div style={{ fontWeight: 800, color: tenant.rentDueDay ? '#38bdf8' : '#fb7185' }}>
                    {tenant.rentDueDay ? `Har mahine ki ${tenant.rentDueDay} tareekh` : 'Not Set'}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                paddingTop: 14,
                gap: 8
              }}>
                <button
                  onClick={() => onSelectForBill(tenant.id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <FileText size={15} />
                  <span>Create Bill</span>
                </button>

                <button
                  onClick={() => onEditTenant(tenant)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 10px' }}
                  title="Edit Kirayedaar"
                >
                  <Edit3 size={15} />
                </button>

                <button
                  onClick={() => onDeleteTenant(tenant)}
                  className="btn btn-danger"
                  style={{ padding: '8px 10px' }}
                  title="Delete Kirayedaar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
