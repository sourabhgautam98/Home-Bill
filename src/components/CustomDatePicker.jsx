import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
  value,
  onChange,
  label = 'Bill Date *',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date from value or fallback to today
  const parseDate = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const initial = parseDate(value);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0-11

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Generate calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 for Sunday
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handleSelectDay = (day) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${m}-${d}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const setPreset = (type) => {
    const now = new Date();
    let dateStr = '';
    if (type === 'today') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    } else if (type === 'first') {
      const y = viewYear;
      const m = String(viewMonth + 1).padStart(2, '0');
      dateStr = `${y}-${m}-01`;
    }
    onChange(dateStr);
    setIsOpen(false);
  };

  // Format readable display
  const formatDisplay = (str) => {
    if (!str) return 'Select date';
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    const y = parts[0];
    const m = MONTH_NAMES[parseInt(parts[1], 10) - 1]?.slice(0, 3) || parts[1];
    const d = parts[2];
    return `${d} ${m} ${y}`;
  };

  const isSelected = (day) => {
    if (!value) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1 && d === day;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: 18 }}>
      {label && (
        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <CalendarIcon size={14} color="#818cf8" />
          <span>{label}</span>
        </label>
      )}

      {/* Trigger Button / Input Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '10px 14px',
          borderColor: isOpen ? '#6366f1' : 'var(--border-color)',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <CalendarIcon size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#ffffff' }}>
              {formatDisplay(value)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Click to choose date
            </div>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          padding: '4px 8px',
          borderRadius: 6,
          color: '#a5b4fc',
          fontWeight: 600
        }}>
          {value || 'YYYY-MM-DD'}
        </span>
      </div>

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1300,
            width: 310,
            padding: 16,
            backgroundColor: '#0b1120',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Calendar Header with Month/Year Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#ffffff',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div style={{ fontSize: '0.925rem', fontWeight: 800, color: '#ffffff' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#ffffff',
                borderRadius: 8,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of week header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            marginBottom: 8
          }}>
            {DAYS_OF_WEEK.map((d, i) => (
              <div
                key={i}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: i === 0 || i === 6 ? '#f43f5e' : 'var(--text-dim)'
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            textAlign: 'center'
          }}>
            {/* Blank cells for previous month padding */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div
                key={`prev-${i}`}
                style={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.15)',
                  fontSize: '0.75rem'
                }}
              >
                {prevMonthDays - firstDayIndex + i + 1}
              </div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const sel = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    fontSize: '0.85rem',
                    fontWeight: sel || today ? 700 : 500,
                    cursor: 'pointer',
                    border: today && !sel ? '1px solid #818cf8' : 'none',
                    background: sel
                      ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                      : 'transparent',
                    color: sel ? '#ffffff' : (today ? '#a5b4fc' : '#f1f5f9'),
                    boxShadow: sel ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!sel) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    if (!sel) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick preset buttons */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setPreset('today')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPreset('first')}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem' }}
            >
              1st of Month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
