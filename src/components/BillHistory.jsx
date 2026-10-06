import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Eye, 
  Trash2, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  Building, 
  Phone,
  FileText,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/numberToWords';

export default function BillHistory({ 
  bills, 
  onViewBill, 
  onDeleteBill, 
  currencySymbol = '₹' 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTenants, setExpandedTenants] = useState({});

  // Group bills by Kirayedaar name
  const tenantGroups = useMemo(() => {
    const groups = {};
    bills.forEach(bill => {
      const name = bill.tenantName?.trim() || 'Other Kirayedaar';
      if (!groups[name]) {
        groups[name] = {
          name,
          room: bill.room || '',
          phone: bill.phone || '',
          bills: [],
          totalAmount: 0,
          latestDate: bill.billDate || ''
        };
      }
      groups[name].bills.push(bill);
      groups[name].totalAmount += (Number(bill.grandTotal) || 0);
      if (bill.room && !groups[name].room) groups[name].room = bill.room;
      if (bill.phone && !groups[name].phone) groups[name].phone = bill.phone;
      if (bill.billDate && (!groups[name].latestDate || bill.billDate > groups[name].latestDate)) {
        groups[name].latestDate = bill.billDate;
      }
    });

    // Sort bills in each group by billDate descending (newest first)
    Object.values(groups).forEach(g => {
      g.bills.sort((a, b) => new Date(b.billDate || 0) - new Date(a.billDate || 0));
    });

    // Return list sorted alphabetically by tenant name
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [bills]);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return tenantGroups;
    const q = searchQuery.toLowerCase();
    return tenantGroups.filter(g => {
      const matchesName = g.name.toLowerCase().includes(q);
      const matchesRoom = g.room.toLowerCase().includes(q);
      const matchesPhone = g.phone.includes(q);
      const matchesBills = g.bills.some(b => 
        (b.billNo && b.billNo.toLowerCase().includes(q)) ||
        (b.billingMonth && b.billingMonth.toLowerCase().includes(q)) ||
        (b.billDate && b.billDate.includes(q))
      );
      return matchesName || matchesRoom || matchesPhone || matchesBills;
    });
  }, [tenantGroups, searchQuery]);

  // Toggle tenant expand/collapse
  const toggleTenant = (name) => {
    setExpandedTenants(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const toggleAll = (expand) => {
    const next = {};
    filteredGroups.forEach(g => {
      next[g.name] = expand;
    });
    setExpandedTenants(next);
  };

  // Overall Statistics (All bills are Paid)
  const totalAmountReceived = bills.reduce((acc, b) => acc + (Number(b.grandTotal) || 0), 0);
  const totalBillsCount = bills.length;
  const totalTenantsCount = tenantGroups.length;

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>Bill <span className="gradient-text">History</span></span>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 20,
            padding: '2px 10px'
          }}>
            {bills.length}
          </span>
        </h2>
      </div>

      {/* Summary Stat Cards */}
      <div className="history-stats-grid" style={{ marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Total Amount Received
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {formatCurrency(totalAmountReceived, currencySymbol)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Across all {totalBillsCount} bills
          </div>
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Total Bills Generated
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            {totalBillsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Complete billing records
          </div>
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Kirayedaar with Bills
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {totalTenantsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
            Grouped by tenant name
          </div>
        </div>
      </div>

      {/* Search & Expand Controls Bar */}
      <div className="glass-card" style={{
        padding: '12px 16px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 240, flex: 1 }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search Kirayedaar name, room, bill #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            style={{ paddingLeft: 34, paddingRight: searchQuery ? 36 : 12, fontSize: '0.875rem' }}
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

        {/* Expand / Collapse All controls */}
        {filteredGroups.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => toggleAll(true)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Expand All
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Grouped Kirayedaar Bill History List */}
      {filteredGroups.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Receipt size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>No bills found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
            {bills.length === 0
              ? "Generate your first bill using the 'Generate Bill' tab to view records here."
              : `No records match "${searchQuery}".`}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <X size={15} />
              <span>Clear Filter & Show All Bills ({bills.length})</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredGroups.map(group => {
            const isExpanded = expandedTenants[group.name] !== undefined ? expandedTenants[group.name] : true;
            return (
              <div 
                key={group.name} 
                className="glass-card" 
                style={{ 
                  borderRadius: 14, 
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: isExpanded ? '0 4px 20px rgba(99, 102, 241, 0.12)' : 'none'
                }}
              >
                {/* Clickable Kirayedaar Group Header */}
                <div 
                  onClick={() => toggleTenant(group.name)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isExpanded ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'background-color 0.15s ease',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Tenant Avatar & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={20} color="#818cf8" />
                    </div>

                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{group.name}</span>
                        {group.room && (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#cbd5e1'
                          }}>
                            {group.room}
                          </span>
                        )}
                      </div>
                      {group.phone && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} />
                          <span>{group.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Summary badges & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {group.bills.length} {group.bills.length === 1 ? 'Bill' : 'Bills'}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                        {formatCurrency(group.totalAmount, currencySymbol)}
                      </div>
                    </div>

                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: isExpanded ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isExpanded ? '#818cf8' : 'var(--text-muted)'
                    }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Bills List */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    {/* Desktop Table View */}
                    <div className="desktop-table-container" style={{ padding: 0 }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        fontSize: '0.85rem'
                      }}>
                        <thead>
                          <tr style={{
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            color: 'var(--text-muted)'
                          }}>
                            <th style={{ padding: '12px 18px' }}>Month & Bill #</th>
                            <th style={{ padding: '12px 18px' }}>Bill Date</th>
                            <th style={{ padding: '12px 18px' }}>Meter Reading</th>
                            <th style={{ padding: '12px 18px' }}>Electricity</th>
                            <th style={{ padding: '12px 18px' }}>Rent & Water</th>
                            <th style={{ padding: '12px 18px' }}>Total Amount</th>
                            <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.bills.map((bill, index) => (
                            <tr 
                              key={bill.id} 
                              style={{ 
                                borderBottom: index === group.bills.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                                backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                              }}
                            >
                              {/* Month & Bill # */}
                              <td style={{ padding: '12px 18px' }}>
                                <div style={{ fontWeight: 700, color: '#ffffff' }}>
                                  {bill.billingMonth}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  {bill.billNo || 'INV-001'}
                                </div>
                              </td>

                              {/* Bill Date */}
                              <td style={{ padding: '12px 18px', color: '#cbd5e1' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Calendar size={13} color="#818cf8" />
                                  <span>{bill.billDate}</span>
                                </div>
                              </td>

                              {/* Meter Details */}
                              <td style={{ padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <Zap size={13} color="#f59e0b" />
                                  <span style={{ fontWeight: 600 }}>{bill.unitsConsumed} units</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  {bill.previousReading} → {bill.newReading} (@ {currencySymbol}{bill.unitRate})
                                </div>
                              </td>

                              {/* Electricity Total */}
                              <td style={{ padding: '12px 18px', fontWeight: 600, color: '#38bdf8' }}>
                                {formatCurrency(bill.electricityTotal, currencySymbol)}
                              </td>

                              {/* Rent & Water */}
                              <td style={{ padding: '12px 18px' }}>
                                <div style={{ fontSize: '0.825rem' }}>
                                  Rent: {formatCurrency(bill.rentAmount, currencySymbol)}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                  Water: {formatCurrency(bill.waterBill, currencySymbol)}
                                  {bill.extraCharges > 0 ? ` • Extra: ${formatCurrency(bill.extraCharges, currencySymbol)}` : ''}
                                </div>
                              </td>

                              {/* Total Amount Paid */}
                              <td style={{ padding: '12px 18px' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                                  {formatCurrency(bill.grandTotal, currencySymbol)}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    onClick={() => onViewBill(bill)}
                                    className="btn btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                    title="View / Print PDF Receipt"
                                  >
                                    <Eye size={13} />
                                    <span>Receipt</span>
                                  </button>

                                  <button
                                    onClick={() => onDeleteBill(bill)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px 8px' }}
                                    title="Delete Bill"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View: Compact Cards */}
                    <div className="mobile-bills-list" style={{ padding: 12 }}>
                      {group.bills.map(bill => (
                        <div
                          key={bill.id}
                          style={{
                            padding: 14,
                            borderRadius: 10,
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                                {bill.billingMonth}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                                {bill.billNo || 'INV-001'} • {bill.billDate}
                              </div>
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                              {formatCurrency(bill.grandTotal, currencySymbol)}
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            fontSize: '0.78rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            padding: '8px 10px',
                            borderRadius: 8
                          }}>
                            <div>
                              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>METER (UNITS)</div>
                              <div style={{ fontWeight: 600 }}>{bill.unitsConsumed} units</div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>RENT + WATER</div>
                              <div style={{ fontWeight: 600 }}>
                                {formatCurrency((bill.rentAmount || 0) + (bill.waterBill || 0), currencySymbol)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 8 }}>
                            <button
                              onClick={() => onViewBill(bill)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <Eye size={13} />
                              <span>View Receipt</span>
                            </button>
                            <button
                              onClick={() => onDeleteBill(bill)}
                              className="btn btn-danger"
                              style={{ padding: '6px 8px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
