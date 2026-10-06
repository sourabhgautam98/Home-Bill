import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BillGenerator from './components/BillGenerator';
import TenantManager from './components/TenantManager';
import BillHistory from './components/BillHistory';
import BillReceiptModal from './components/BillReceiptModal';
import KirayedaarModal from './components/KirayedaarModal';
import SecurityPinModal from './components/SecurityPinModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import {
  fetchTenants,
  createTenant,
  updateTenantDetails,
  removeTenant,
  fetchBills,
  createBill,
  removeBill,
  updateBillPaymentStatus,
  getPropertySettings
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertySettings] = useState(getPropertySettings());

  // Modals state
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);

  // Security PIN Modal state
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: 'Security PIN Required',
    subtitle: 'Enter your 4-digit PIN to proceed',
    onSuccess: null,
    onCancel: null
  });

  // Custom Delete Confirmation Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: 'Delete Confirmation',
    itemName: '',
    itemType: 'record',
    warningExtra: '',
    onConfirm: null
  });

  // Tab reset keys for instant view refresh on tab click
  const [tabResetKey, setTabResetKey] = useState({ history: 0, tenants: 0 });

  // Helper function to prompt for 4-digit Security PIN before executing sensitive actions
  const promptPin = ({ title, subtitle, action, onCancelAction }) => {
    return new Promise((resolve) => {
      setPinModal({
        isOpen: true,
        title: title || 'Security PIN Required',
        subtitle: subtitle || 'Enter 4-digit PIN to proceed',
        onSuccess: async () => {
          try {
            const result = await action();
            resolve(result !== undefined ? result : true);
          } catch (err) {
            console.error('Action failed after PIN verification:', err);
            resolve(false);
          }
        },
        onCancel: () => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          if (onCancelAction) onCancelAction();
          resolve(false);
        }
      });
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, bList] = await Promise.all([fetchTenants(), fetchBills()]);
      setTenants(tList);
      setBills(bList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any previous demo tenants from browser localStorage to ensure clean state
    try {
      const raw = localStorage.getItem('rentpulse_local_tenants');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter(t => !t.id?.startsWith('demo-'));
        if (filtered.length !== list.length) {
          localStorage.setItem('rentpulse_local_tenants', JSON.stringify(filtered));
        }
      }
    } catch (e) { }
    loadData();
  }, []);

  // 1. Save Bill handler (Protected by Security PIN)
  const handleSaveBill = async (billData) => {
    return promptPin({
      title: 'Authorize Bill Generation',
      subtitle: `Enter 4-digit PIN to generate and save bill for ${billData.tenantName || 'Kirayedaar'}`,
      action: async () => {
        const saved = await createBill(billData);
        await loadData();
        // Auto show generated bill receipt
        setViewingBill(saved);
        return saved;
      },
      onCancelAction: () => {
        // Stay cleanly on Generate Bill page
      }
    });
  };

  // 2. Add Kirayedaar handler (Protected by Security PIN)
  const handleAddTenant = async (tenantData) => {
    return promptPin({
      title: 'Confirm Registration',
      subtitle: `Enter 4-digit PIN to register "${tenantData.name}" as Kirayedaar`,
      action: async () => {
        const saved = await createTenant(tenantData);
        await loadData();
        setIsTenantModalOpen(false);
        setEditingTenant(null);
        return saved;
      },
      onCancelAction: () => {
        // Return directly to Kirayedaar page on cancel
        setIsTenantModalOpen(false);
        setEditingTenant(null);
      }
    });
  };

  // 3. Update Kirayedaar handler (Protected by Security PIN)
  const handleUpdateTenant = async (id, updateData) => {
    return promptPin({
      title: 'Save Kirayedaar Changes',
      subtitle: `Enter 4-digit PIN to save updates for "${updateData.name || 'Kirayedaar'}"`,
      action: async () => {
        await updateTenantDetails(id, updateData);
        await loadData();
        setIsTenantModalOpen(false);
        setEditingTenant(null);
        return true;
      },
      onCancelAction: () => {
        // Return directly to Kirayedaar page on cancel
        setIsTenantModalOpen(false);
        setEditingTenant(null);
      }
    });
  };

  // 4. Delete Kirayedaar handler (Protected by Custom Delete Modal + Security PIN)
  const handleDeleteTenant = (tenantOrId) => {
    const tenant = typeof tenantOrId === 'object' && tenantOrId !== null
      ? tenantOrId
      : tenants.find(t => t.id === tenantOrId) || { id: tenantOrId, name: 'Kirayedaar' };

    // Calculate how many bills belong to this tenant
    const tenantBills = bills.filter(b =>
      b.tenantId === tenant.id ||
      (tenant.name && b.tenantName && b.tenantName.trim().toLowerCase() === tenant.name.trim().toLowerCase())
    );

    const billsNotice = tenantBills.length > 0
      ? `Is kirayedaar ke sabhi ${tenantBills.length} bill records (history) bhi saath me delete ho jayenge.`
      : `Is kirayedaar ke saath iska pura record aur history permanently delete ho jayegi.`;

    setDeleteModal({
      isOpen: true,
      title: 'Delete Kirayedaar & Bill History',
      itemName: tenant.name + (tenant.room ? ` (Room ${tenant.room})` : ''),
      itemType: 'kirayedaar',
      warningExtra: billsNotice,
      onConfirm: () => {
        promptPin({
          title: 'Authorize Kirayedaar Deletion',
          subtitle: `Enter 4-digit PIN to permanently delete "${tenant.name}" and all their bills`,
          action: async () => {
            await removeTenant(tenant.id, tenant.name);
            await loadData();
            if (viewingBill && (viewingBill.tenantId === tenant.id || (tenant.name && viewingBill.tenantName === tenant.name))) {
              setViewingBill(null);
            }
          },
          onCancelAction: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    });
  };

  // 5. Delete Bill handler (Protected by Custom Delete Modal + Security PIN)
  const handleDeleteBill = (billOrId) => {
    const bill = typeof billOrId === 'object' && billOrId !== null
      ? billOrId
      : bills.find(b => b.id === billOrId) || { id: billOrId, billNo: 'Bill', tenantName: '' };

    setDeleteModal({
      isOpen: true,
      title: 'Delete Bill Record',
      itemName: `${bill.billNo || 'Bill'} (${bill.billingMonth || ''} - ${bill.tenantName || 'Kirayedaar'})`,
      itemType: 'bill record',
      onConfirm: () => {
        promptPin({
          title: 'Authorize Bill Deletion',
          subtitle: `Enter 4-digit PIN to permanently delete bill ${bill.billNo || ''}`,
          action: async () => {
            await removeBill(bill.id);
            await loadData();
            if (viewingBill?.id === bill.id) {
              setViewingBill(null);
            }
          },
          onCancelAction: () => {
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      }
    });
  };

  // Update Bill Status handler
  const handleUpdateBillStatus = async (id, status) => {
    await updateBillPaymentStatus(id, status);
    await loadData();
    if (viewingBill?.id === id) {
      setViewingBill(prev => ({ ...prev, status }));
    }
  };

  // Open Add / Edit Tenant Modal handlers
  const handleOpenAddTenant = () => {
    setEditingTenant(null);
    setIsTenantModalOpen(true);
  };

  const handleOpenEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setIsTenantModalOpen(true);
  };

  // Select tenant from list and jump to bill creation
  const handleSelectForBill = (tenantId) => {
    setActiveTab('generate');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Clean Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenantCount={tenants.length}
        billCount={bills.length}
        onOpenAddTenantModal={handleOpenAddTenant}
        propertyName={propertySettings?.propertyName}
        onTabClick={(tab) => {
          if (tab === 'history') {
            setTabResetKey(prev => ({ ...prev, history: prev.history + 1 }));
          } else if (tab === 'tenants') {
            setTabResetKey(prev => ({ ...prev, tenants: prev.tenants + 1 }));
          }
        }}
      />

      {/* Main Dynamic View */}
      <main style={{ flex: 1, paddingBottom: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 32,
                height: 32,
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: '#6366f1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span>Loading Data...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'generate' && (
              <BillGenerator
                tenants={tenants}
                onSaveBill={handleSaveBill}
                onOpenAddTenant={handleOpenAddTenant}
                currencySymbol={propertySettings?.currencySymbol || '₹'}
              />
            )}

            {activeTab === 'tenants' && (
              <TenantManager
                key={tabResetKey.tenants}
                tenants={tenants}
                onOpenAddTenant={handleOpenAddTenant}
                onEditTenant={handleOpenEditTenant}
                onDeleteTenant={handleDeleteTenant}
                onSelectForBill={handleSelectForBill}
                currencySymbol={propertySettings?.currencySymbol || '₹'}
              />
            )}

            {activeTab === 'history' && (
              <BillHistory
                key={tabResetKey.history}
                bills={bills}
                onViewBill={(bill) => setViewingBill(bill)}
                onDeleteBill={handleDeleteBill}
                onUpdateStatus={handleUpdateBillStatus}
                currencySymbol={propertySettings?.currencySymbol || '₹'}
              />
            )}
          </>
        )}
      </main>

      {/* Global Kirayedaar Modal (Works seamlessly from Bill Generator, Kirayedaar tab, etc.) */}
      {isTenantModalOpen && (
        <KirayedaarModal
          isOpen={isTenantModalOpen}
          tenant={editingTenant}
          onClose={() => {
            setIsTenantModalOpen(false);
            setEditingTenant(null);
          }}
          onSave={async (tenantData) => {
            if (editingTenant) {
              return await handleUpdateTenant(editingTenant.id, tenantData);
            } else {
              return await handleAddTenant(tenantData);
            }
          }}
          currencySymbol={propertySettings?.currencySymbol || '₹'}
        />
      )}

      {/* Bill Printable Receipt / PDF Modal */}
      {viewingBill && (
        <BillReceiptModal
          bill={viewingBill}
          onClose={() => setViewingBill(null)}
          onUpdateStatus={handleUpdateBillStatus}
          propertySettings={propertySettings}
          currencySymbol={propertySettings?.currencySymbol || '₹'}
        />
      )}


      {/* Custom Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        itemType={deleteModal.itemType}
        warningExtra={deleteModal.warningExtra}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModal.onConfirm}
      />

      {/* Security PIN Authorization Modal */}
      <SecurityPinModal
        isOpen={pinModal.isOpen}
        actionTitle={pinModal.title}
        actionSubtitle={pinModal.subtitle}
        onClose={() => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          setPinModal(prev => ({ ...prev, isOpen: false }));
        }}
        onSuccess={() => {
          if (pinModal.onSuccess) pinModal.onSuccess();
        }}
        onCancel={() => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          if (pinModal.onCancel) pinModal.onCancel();
        }}
      />
    </div>
  );
}
