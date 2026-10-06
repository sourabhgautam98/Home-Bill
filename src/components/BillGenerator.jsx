import React, { useState, useEffect } from 'react';
import {
  Zap,
  Home,
  Droplet,
  Gauge,
  PlusCircle,
  Calculator,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, numberToWords } from '../utils/numberToWords';
import CustomDatePicker from './CustomDatePicker';

export default function BillGenerator({
  tenants,
  onSaveBill,
  onOpenAddTenant,
  currencySymbol = '₹'
}) {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Automatically compute billing month label from the selected Bill Date
  const computedBillingMonth = billDate
    ? new Date(billDate + 'T00:00:00').toLocaleDateString('default', { month: 'long', year: 'numeric' })
    : '';

  // Auto-loaded & editable fields
  const [rentAmount, setRentAmount] = useState('');
  const [waterBill, setWaterBill] = useState('');
  const [previousReading, setPreviousReading] = useState('');
  const [unitRate, setUnitRate] = useState('');

  // Dynamic inputs
  const [newReading, setNewReading] = useState('');
  const [extraChargesList, setExtraChargesList] = useState([
    { id: 1, note: '', amount: '' }
  ]);

  // Status message
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select first tenant on load if available, or keep selected tenant synced
  useEffect(() => {
    if (tenants.length > 0) {
      if (!selectedTenantId) {
        handleSelectTenant(tenants[0].id);
      } else {
        const tenant = tenants.find(t => t.id === selectedTenantId);
        if (tenant) {
          setPreviousReading(tenant.previousReading !== undefined ? tenant.previousReading : 0);
          setRentAmount(tenant.rent || 0);
          setWaterBill(tenant.waterBill !== undefined ? tenant.waterBill : 200);
          setUnitRate(tenant.unitRate || 12);
        }
      }
    } else {
      setSelectedTenantId('');
    }
  }, [tenants, selectedTenantId]);

  const handleSelectTenant = (tenantId) => {
    setSelectedTenantId(tenantId);
    setErrorMsg('');
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setRentAmount(tenant.rent || 0);
      setWaterBill(tenant.waterBill !== undefined ? tenant.waterBill : 200);
      setPreviousReading(tenant.previousReading !== undefined ? tenant.previousReading : 0);
      setUnitRate(tenant.unitRate || 12);
      setNewReading('');
      setExtraChargesList([{ id: Date.now(), note: '', amount: '' }]);
    }
  };

  const handleAddExtraCharge = () => {
    setExtraChargesList(prev => [...prev, { id: Date.now(), note: '', amount: '' }]);
  };

  const handleRemoveExtraCharge = (id) => {
    setExtraChargesList(prev => {
      const remaining = prev.filter(item => item.id !== id);
      return remaining.length > 0 ? remaining : [{ id: Date.now(), note: '', amount: '' }];
    });
  };

  const handleExtraChargeChange = (id, field, val) => {
    setExtraChargesList(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  // Calculations
  const prevR = Number(previousReading) || 0;
  const newR = newReading === '' ? null : Number(newReading);
  const unitsConsumed = newR !== null && newR >= prevR ? newR - prevR : 0;
  const rate = Number(unitRate) || 0;
  const electricityTotal = unitsConsumed * rate;
  const rentVal = Number(rentAmount) || 0;
  const waterVal = Number(waterBill) || 0;
  const totalExtraCharges = extraChargesList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const grandTotal = rentVal + waterVal + electricityTotal + totalExtraCharges;

  const isReadingInvalid = newR !== null && newR < prevR;

  const handleNumberKeyDown = (e, allowDecimals = true) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
    if (!allowDecimals && e.key === '.') {
      e.preventDefault();
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTenant) {
      setErrorMsg('Please select or register a kirayedaar first.');
      return;
    }

    if (previousReading === '' || isNaN(prevR) || prevR < 0) {
      setErrorMsg('Old Reading me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    if (newReading === '' || isNaN(newR) || newR < 0) {
      setErrorMsg('New Reading me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    if (newR < prevR) {
      setErrorMsg(`New reading (${newR}) cannot be less than previous reading (${prevR}). Please check the meter.`);
      return;
    }

    if (unitRate === '' || isNaN(rate) || rate <= 0) {
      setErrorMsg('Unit Rate me valid number hona chahiye (0 se jyada).');
      return;
    }

    if (rentAmount !== '' && (isNaN(rentVal) || rentVal < 0)) {
      setErrorMsg('Room Rent me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    if (waterBill !== '' && (isNaN(waterVal) || waterVal < 0)) {
      setErrorMsg('Water Bill me valid number hona chahiye (0 ya usse jyada).');
      return;
    }

    for (const item of extraChargesList) {
      if (item.amount !== '' && (isNaN(Number(item.amount)) || Number(item.amount) < 0)) {
        setErrorMsg('Extra charges me valid number hona chahiye (0 ya usse jyada).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const activeExtraList = extraChargesList
        .filter(item => (Number(item.amount) > 0 || item.note.trim()))
        .map(item => ({
          id: item.id,
          amount: Number(item.amount) || 0,
          note: item.note.trim()
        }));

      const extraChargesNoteCombined = activeExtraList
        .map(item => item.note ? `${item.note}: ${currencySymbol}${item.amount}` : `${currencySymbol}${item.amount}`)
        .join(', ');

      const billData = {
        billNo: 'INV-' + Math.floor(100000 + Math.random() * 900000),
        billDate,
        billingMonth: computedBillingMonth,
        tenantId: selectedTenant.id,
        tenantName: selectedTenant.name,
        room: selectedTenant.room || '',
        phone: selectedTenant.phone || '',
        rentAmount: rentVal,
        waterBill: waterVal,
        previousReading: prevR,
        newReading: newR,
        unitsConsumed,
        unitRate: rate,
        electricityTotal,
        extraCharges: totalExtraCharges,
        extraChargesNote: extraChargesNoteCombined,
        extraChargesList: activeExtraList,
        grandTotal,
        status: 'Paid'
      };

      const saved = await onSaveBill(billData);

      if (saved) {
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (err) { }

        // Reset new reading & extra charges for next entry
        setPreviousReading(newR);
        setNewReading('');
        setExtraChargesList([{ id: Date.now(), note: '', amount: '' }]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate bill: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 800 }}>
          Create <span className="gradient-text">Monthly Bills</span>
        </h2>
      </div>

      {tenants.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Home size={28} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No Kirayedaar Registered Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 20px' }}>
            To generate your first bill, register your kirayedaar with their rent, water charges, and initial meter reading.
          </p>
          <button onClick={onOpenAddTenant} className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <PlusCircle size={18} />
            <span>Register Kirayedaar</span>
          </button>
        </div>
      ) : (
        /* 2-Column Responsive Layout */
        <div className="bill-generator-grid">
          {/* Left Column: Input Form */}
          <form onSubmit={handleGenerate} autoComplete="off" autoCorrect="off" spellCheck="false" className="glass-card" style={{ padding: 24 }}>
            <h3 style={{
              fontSize: '1.15rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 14
            }}>
              <FileText size={18} color="#818cf8" />
              <span>Bill Details & Meter Input</span>
            </h3>

            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-rose-light)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fb7185',
                fontSize: '0.875rem',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tenant Selection */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="input-label" htmlFor="tenant-select">
                  Select Kirayedaar *
                </label>
              </div>

              <select
                id="tenant-select"
                className="form-select"
                value={selectedTenantId}
                onChange={(e) => handleSelectTenant(e.target.value)}
                style={{ fontSize: '1rem', fontWeight: 600 }}
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bill Date using custom dark-mode datepicker */}
            <CustomDatePicker
              value={billDate}
              onChange={(dateStr) => setBillDate(dateStr)}
              label="Bill Date *"
            />

            {/* Fixed Charges Grid: Rent & Water */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: 18
            }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Home size={14} color="#818cf8" />
                  <span>Room Rent ({currencySymbol})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  value={rentAmount}
                  onKeyDown={(e) => handleNumberKeyDown(e, true)}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Droplet size={14} color="#06b6d4" />
                  <span>Water Bill ({currencySymbol})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  value={waterBill}
                  onKeyDown={(e) => handleNumberKeyDown(e, true)}
                  onChange={(e) => setWaterBill(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Electricity Meter Reading Section */}
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(99, 102, 241, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              marginBottom: 18
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#a5b4fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Gauge size={16} />
                  <span>Electricity Meter Readings</span>
                </span>
                <span className="badge badge-primary">
                  Rate: {currencySymbol}{rate}/unit
                </span>
              </div>

              <div className="meter-inputs-grid">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="input-label" style={{ fontSize: '0.72rem', margin: 0 }}>
                      Old Reading
                    </label>
                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>
                      Auto
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    value={previousReading}
                    onKeyDown={(e) => handleNumberKeyDown(e, true)}
                    onChange={(e) => setPreviousReading(e.target.value)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#38bdf8', fontWeight: 700 }}
                    title="Previous reading registered or auto-carried from last bill"
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                    New Reading *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    value={newReading}
                    onKeyDown={(e) => handleNumberKeyDown(e, true)}
                    onChange={(e) => setNewReading(e.target.value)}
                    placeholder="e.g. 1580"
                    autoFocus
                    style={{
                      borderColor: isReadingInvalid ? '#f43f5e' : (newReading ? '#06b6d4' : 'var(--border-color)'),
                      boxShadow: newReading ? '0 0 0 2px rgba(6, 182, 212, 0.2)' : 'none',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>
                    Unit Rate ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    className="form-input"
                    value={unitRate}
                    onKeyDown={(e) => handleNumberKeyDown(e, true)}
                    onChange={(e) => setUnitRate(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>

              {/* Dynamic Calculation preview banner inside meter card */}
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isReadingInvalid ? 'rgba(244, 63, 94, 0.15)' : 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} color={isReadingInvalid ? '#fb7185' : '#fbbf24'} />
                  <span style={{ color: isReadingInvalid ? '#fb7185' : 'var(--text-muted)' }}>
                    Units Consumed:
                  </span>
                  <strong style={{ color: isReadingInvalid ? '#fb7185' : '#ffffff' }}>
                    {isReadingInvalid ? 'Invalid Reading' : `${unitsConsumed} Units`}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Amount:</span>
                  <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>
                    {formatCurrency(electricityTotal, currencySymbol)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Extra Charges Section with Dynamic Add Button */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <PlusCircle size={14} color="#f59e0b" />
                  <span>Extra Charges (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddExtraCharge}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: '#f59e0b',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                  title="Add another extra charge item"
                >
                  <Plus size={13} />
                  <span>Add Extra Charge</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {extraChargesList.map((item, index) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 130px) 1fr auto', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      value={item.amount}
                      onKeyDown={(e) => handleNumberKeyDown(e, true)}
                      onChange={(e) => handleExtraChargeChange(item.id, 'amount', e.target.value)}
                      placeholder={`${currencySymbol} Amount`}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={item.note}
                      onChange={(e) => handleExtraChargeChange(item.id, 'note', e.target.value)}
                      placeholder={index === 0 ? "Reason (e.g. Maintenance, Cleaning)" : "Reason (e.g. Parking, Repair)"}
                    />
                    {extraChargesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraCharge(item.id)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.12)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: '#fb7185',
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove this extra charge"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || isReadingInvalid}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                minHeight: '48px',
                opacity: isSubmitting || isReadingInvalid ? 0.6 : 1
              }}
            >
              <Sparkles size={18} />
              <span>{isSubmitting ? 'Generating Bill...' : 'Generate & Save Bill'}</span>
            </button>
          </form>

          {/* Right Column: Real-time Live Bill Breakdown Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{
              padding: 24,
              border: '1px solid rgba(99, 102, 241, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle accent glow */}
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 140,
                height: 140,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="badge badge-emerald">
                  <CheckCircle2 size={13} />
                  <span>Live Calculation</span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {computedBillingMonth}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedTenant ? selectedTenant.name : 'Select Kirayedaar'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedTenant?.room ? `${selectedTenant.room} • ` : ''}
                  {selectedTenant?.phone ? `Mob: ${selectedTenant.phone}` : ''}
                </div>
              </div>

              {/* Line Items Breakdown Table */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                borderTop: '1px solid var(--border-color)',
                paddingTop: 16,
                marginBottom: 20
              }}>
                {/* Rent Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Home size={15} color="var(--text-dim)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Monthly Room Rent</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(rentVal, currencySymbol)}</span>
                </div>

                {/* Water Bill Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Droplet size={15} color="#06b6d4" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Water Charges</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(waterVal, currencySymbol)}</span>
                </div>

                {/* Electricity Item */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Zap size={15} color="#f59e0b" style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Electricity Charges</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {prevR} → {newR !== null ? newR : '—'} ({unitsConsumed} units @ {currencySymbol}{rate})
                      </div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(electricityTotal, currencySymbol)}</span>
                </div>

                {/* Extra Charges Items (if any) */}
                {totalExtraCharges > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {extraChargesList.filter(item => Number(item.amount) > 0).map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <PlusCircle size={14} color="#ec4899" />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            {item.note.trim() ? item.note.trim() : 'Extra Charge'}
                          </span>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f43f5e' }}>
                          +{formatCurrency(Number(item.amount), currencySymbol)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Banner */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Total Amount Due
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#a5b4fc', marginTop: 2 }}>
                    {numberToWords(grandTotal)}
                  </div>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
                  {formatCurrency(grandTotal, currencySymbol)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
