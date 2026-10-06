import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Share2,
  Zap,
  Droplet,
  Home,
  PlusCircle,
  Building2,
  MessageCircle,
  Mail,
  Copy,
  Check
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { formatCurrency, numberToWords } from '../utils/numberToWords';

export default function BillReceiptModal({
  bill,
  onClose,
  onUpdateStatus,
  propertySettings,
  currencySymbol = '₹'
}) {
  const receiptRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  if (!bill) return null;

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);

    try {
      const element = receiptRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Bill_${bill.tenantName.replace(/\s+/g, '_')}_${bill.billingMonth.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800,
          onclone: (clonedDoc) => {
            const paper = clonedDoc.querySelector('.receipt-paper-card');
            if (paper) {
              paper.style.width = '640px';
              paper.style.padding = '28px';
              paper.style.borderRadius = '12px';
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  // Helper: Formatted bill summary text for sharing
  const getBillSummaryText = () => {
    return `*RENT & UTILITY BILL* 🧾\n` +
      `*Owner:* Gautam Rent, Owner\n` +
      `*Kirayedaar:* ${bill.tenantName} (${bill.room ? `Room ${bill.room}` : 'Resident'})\n` +
      (bill.rentDueDay ? `📅 *Kiraya Tareekh:* Har mahine ki ${bill.rentDueDay} tareekh\n` : '') +
      `*Date:* ${bill.billDate || ''} (${bill.billingMonth})\n` +
      `--------------------------------\n` +
      `🏠 *Rent:* ${currencySymbol}${bill.rentAmount}\n` +
      `💧 *Water:* ${currencySymbol}${bill.waterBill}\n` +
      `⚡ *Electricity:* ${currencySymbol}${bill.electricityTotal}\n` +
      `   (Meter: ${bill.previousReading} -> ${bill.newReading} = ${bill.unitsConsumed} units @ ${currencySymbol}${bill.unitRate})\n` +
      (bill.extraChargesList && bill.extraChargesList.length > 0
        ? bill.extraChargesList.map(item => `➕ *Extra:* ${currencySymbol}${item.amount} (${item.note || 'Extra'})\n`).join('')
        : (bill.extraCharges > 0 ? `➕ *Extra:* ${currencySymbol}${bill.extraCharges} (${bill.extraChargesNote || 'Extra'})\n` : '')) +
      `--------------------------------\n` +
      `💰 *TOTAL AMOUNT:* ${currencySymbol}${bill.grandTotal}\n\n` +
      `Thank you!`;
  };

  // Handle Share: Shares PDF file directly via Web Share API or falls back to Gmail / WhatsApp
  const handleShare = async () => {
    if (!receiptRef.current) return;
    setIsSharing(true);

    try {
      const element = receiptRef.current;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Bill_${bill.tenantName.replace(/\s+/g, '_')}_${bill.billingMonth.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800,
          onclone: (clonedDoc) => {
            const paper = clonedDoc.querySelector('.receipt-paper-card');
            if (paper) {
              paper.style.width = '640px';
              paper.style.padding = '28px';
              paper.style.borderRadius = '12px';
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 1. Generate PDF as Blob
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
      const fileName = `Bill_${bill.tenantName.replace(/\s+/g, '_')}_${bill.billingMonth.replace(/\s+/g, '_')}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 2. Try native PDF file sharing (supports Gmail, WhatsApp, Drive, etc. on mobile & supported desktop)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Bill - ${bill.tenantName} (${bill.billingMonth})`,
          text: `Rent & Utility Bill for ${bill.tenantName} (${bill.billingMonth})`
        });
        return;
      }

      // 3. If file share isn't supported, try text sharing
      if (navigator.share) {
        await navigator.share({
          title: `Bill - ${bill.tenantName} (${bill.billingMonth})`,
          text: getBillSummaryText()
        });
        return;
      }

      // 4. If Web Share is not supported (e.g. desktop Chrome without share API), show Gmail & WhatsApp options
      setShowShareOptions(true);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShowShareOptions(true);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(getBillSummaryText());
    const phone = bill.phone ? bill.phone.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10
      ? `https://wa.me/91${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleOpenGmail = () => {
    const subject = encodeURIComponent(`Rent & Utility Bill - ${bill.tenantName} (${bill.billingMonth})`);
    const body = encodeURIComponent(getBillSummaryText());
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(getBillSummaryText());
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card receipt-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 20,
          overflow: 'hidden'
        }}
      >
        {/* Top Action Bar: ONLY 2 buttons (Download PDF & Share) */}
        <div className="no-print receipt-modal-header" style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
              Bill Preview
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* 1. Download PDF button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              title="Download as PDF file"
            >
              <Download size={15} color="#38bdf8" />
              <span>{isDownloading ? 'Saving PDF...' : 'Download PDF'}</span>
            </button>

            {/* 2. Share button (Shares PDF to WhatsApp, Gmail, etc.) */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                cursor: 'pointer'
              }}
              title="Share PDF to WhatsApp, Gmail, etc."
            >
              <Share2 size={15} />
              <span>{isSharing ? 'Preparing...' : 'Share'}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px 8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="receipt-modal-body" style={{ overflowY: 'auto', overflowX: 'hidden', padding: 24 }}>
          {/* Official Printable Receipt Card */}
          <div
            ref={receiptRef}
            className="print-only-container receipt-paper-card"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: 12,
              padding: 28,
              border: '2px solid #e2e8f0',
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Header: Property / Landlord */}
            <div className="receipt-header-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #4f46e5',
              paddingBottom: 16,
              marginBottom: 18,
              gap: 12
            }}>
              <div>
                <div className="receipt-brand-title" style={{
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: '#1e1b4b',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Building2 size={24} color="#4f46e5" />
                  <span>Gautam Rent</span>
                </div>
                {propertySettings?.ownerPhone && (
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 3 }}>
                    Contact: {propertySettings.ownerPhone}
                  </div>
                )}
                {propertySettings?.address && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{propertySettings.address}</div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="receipt-badge-title" style={{
                  display: 'inline-block',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: 6,
                  letterSpacing: '0.05em'
                }}>
                  RENT & UTILITY BILL
                </div>
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
                  Bill #: {bill.billNo || 'INV-001'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Date: {bill.billDate || new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* Tenant Info & Billing Period Grid */}
            <div className="receipt-meta-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              backgroundColor: '#f8fafc',
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  BILLED TO (TENANT)
                </div>
                <div className="receipt-meta-name" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {bill.tenantName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {bill.room ? `Room / Flat: ${bill.room}` : 'Resident'}
                  {bill.phone ? ` • Mob: ${bill.phone}` : ''}
                </div>
                {bill.rentDueDay && (
                  <div style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, marginTop: 3 }}>
                    Kiraya Tareekh: Har mahine ki {bill.rentDueDay} tareekh
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  BILLING PERIOD / MONTH
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4f46e5', marginTop: 2 }}>
                  {bill.billingMonth}
                </div>
              </div>
            </div>

            {/* Electricity Meter Reading Detailed Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Zap size={15} color="#4f46e5" />
                <span>Electricity Meter Consumption Details</span>
              </div>

              <div className="receipt-table-scroll" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="receipt-meter-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Purani Reading</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Nayi Reading</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Units Consumed</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Rate per Unit</th>
                      <th style={{ padding: '8px 8px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Electricity Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {bill.previousReading}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700, color: '#4f46e5' }}>
                        {bill.newReading}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                        {bill.unitsConsumed} Units
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
                        {currencySymbol}{bill.unitRate}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(bill.electricityTotal, currencySymbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Itemized Final Breakdown Table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 8
              }}>
                Bill Item Summary
              </div>

              <div className="receipt-table-scroll" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="receipt-summary-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                      <th style={{ padding: '9px 12px', textAlign: 'left', border: '1px solid #cbd5e1' }}>#</th>
                      <th style={{ padding: '9px 12px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Particulars / Description</th>
                      <th style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1' }}>1</td>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1', fontWeight: 500 }}>
                        Monthly Room Rent ({bill.billingMonth})
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {formatCurrency(bill.rentAmount, currencySymbol)}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1' }}>2</td>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1', fontWeight: 500 }}>
                        Water Charges (Fixed)
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {formatCurrency(bill.waterBill, currencySymbol)}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1' }}>3</td>
                      <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1', fontWeight: 500 }}>
                        Electricity Charges ({bill.unitsConsumed} Units @ {currencySymbol}{bill.unitRate})
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {formatCurrency(bill.electricityTotal, currencySymbol)}
                      </td>
                    </tr>

                    {bill.extraChargesList && bill.extraChargesList.length > 0 ? (
                      bill.extraChargesList.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1' }}>{4 + idx}</td>
                          <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1', fontWeight: 500 }}>
                            Extra Charge: {item.note || 'Maintenance / Other'}
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                            {formatCurrency(item.amount, currencySymbol)}
                          </td>
                        </tr>
                      ))
                    ) : bill.extraCharges > 0 ? (
                      <tr>
                        <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1' }}>4</td>
                        <td style={{ padding: '9px 12px', border: '1px solid #cbd5e1', fontWeight: 500 }}>
                          Extra Charges: {bill.extraChargesNote || 'Maintenance / Other'}
                        </td>
                        <td style={{ padding: '9px 12px', textAlign: 'right', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                          {formatCurrency(bill.extraCharges, currencySymbol)}
                        </td>
                      </tr>
                    ) : null}

                    {/* Grand Total Row */}
                    <tr style={{ backgroundColor: '#eef2ff' }}>
                      <td colSpan={2} className="receipt-grand-total-label" style={{ padding: '12px', textAlign: 'right', border: '2px solid #4f46e5', fontWeight: 800, fontSize: '1.05rem', color: '#1e1b4b' }}>
                        TOTAL PAYABLE AMOUNT:
                      </td>
                      <td className="receipt-grand-total-val" style={{ padding: '12px', textAlign: 'right', border: '2px solid #4f46e5', fontWeight: 900, fontSize: '1.25rem', color: '#4338ca' }}>
                        {formatCurrency(bill.grandTotal, currencySymbol)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Amount in words */}
            <div className="receipt-in-words" style={{
              backgroundColor: '#f8fafc',
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              marginBottom: 24,
              fontSize: '0.85rem',
              wordBreak: 'break-word'
            }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>In Words: </span>
              <span style={{ fontStyle: 'italic', fontWeight: 600, color: '#0f172a' }}>
                {numberToWords(bill.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback Share Options Modal (when native share is not available on desktop) */}
      {showShareOptions && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: 16
          }}
          onClick={() => setShowShareOptions(false)}
        >
          <div
            className="glass-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 390,
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Share2 size={18} color="#818cf8" />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  Share Bill
                </h4>
              </div>
              <button
                onClick={() => setShowShareOptions(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Share bill for <strong style={{ color: '#ffffff' }}>"{bill.tenantName}"</strong> directly via:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* WhatsApp */}
              <button
                onClick={() => {
                  handleOpenWhatsApp();
                  setShowShareOptions(false);
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#22c55e',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={20} />
                <span>Share via WhatsApp</span>
              </button>

              {/* Gmail */}
              <button
                onClick={() => {
                  handleOpenGmail();
                  setShowShareOptions(false);
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#f87171',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Mail size={20} />
                <span>Share via Gmail</span>
              </button>

              {/* Copy summary */}
              <button
                onClick={handleCopySummary}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {copyFeedback ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                <span>{copyFeedback ? 'Copied to Clipboard!' : 'Copy Bill Summary'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
