import React, { useState, useEffect } from 'react';
import { fetchPendingWorkflowTransitions, fetchCompletedCalls, performTransitionAction } from '../../services/workflowService';
import {
  plantSetupService,
  rawMaterialService,
  productRecipeService,
  approvedAshSGService,
  approvedQAPService
} from '../../services/plantDeclarationService';
import { getStoredUser } from '../../services/authService';

const PlantDeclarationDashboard = () => {
  const [pendingList, setPendingList] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [statusTab, setStatusTab] = useState('PENDING'); // 'PENDING' or 'COMPLETED'
  const [loading, setLoading] = useState(true);

  // Selected state
  const [selectedModuleId, setSelectedModuleId] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Remarks and Verification Action Center state
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const user = getStoredUser();

  // The 5 sub-modules as per database schema
  const modules = [
    {
      id: 1,
      title: 'Plant Setup',
      icon: '🏗️',
      color: '#3b82f6',
      bgGrad: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      desc: 'Verify manufacturing layout, unit count, machinery, and RDSO plant capacity approvals.'
    },
    {
      id: 2,
      title: 'Raw Material Source',
      icon: '🪵',
      color: '#f59e0b',
      bgGrad: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      desc: 'Verify raw material suppliers, grade details, procurement sources, and baseline certificates.'
    },
    {
      id: 4,
      title: 'Product Recipe',
      icon: '🧪',
      color: '#10b981',
      bgGrad: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      desc: 'Verify IRS T-55-2023 chemical compounding recipe recipes, ingredients, and virgin rubber composition.'
    },
    {
      id: 5,
      title: 'Approved Ash & S.G.',
      icon: '📉',
      color: '#ef4444',
      bgGrad: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      desc: 'Verify reference baseline specific gravity & ash content laboratory verification results.'
    },
    {
      id: 6,
      title: 'Approved QAP Values',
      icon: '📋',
      color: '#8b5cf6',
      bgGrad: 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)',
      desc: 'Verify mixing and moulding control curing temperature, cycle time, and hydraulic pressure parameters.'
    }
  ];

  useEffect(() => {
    loadPendingList();
  }, []);

  const loadPendingList = async () => {
    setLoading(true);
    try {
      // Role is "Rail Process IE" as per workflow rules
      const [pendingData, completedData] = await Promise.all([
        fetchPendingWorkflowTransitions('Rail Process IE'),
        fetchCompletedCalls()
      ]);

      const mapList = async (list) => {
        return await Promise.all((list || []).map(async (tx) => {
          let productName = '—';
          let rdsoApprovalLetterNo = '—';
          try {
            if (tx.moduleId === 1) {
              const detail = await plantSetupService.getById(tx.requestId);
              if (detail && detail.units && detail.units.length > 0) {
                const firstUnit = detail.units[0];
                if (firstUnit.products && firstUnit.products.length > 0) {
                  productName = firstUnit.products[0].productName || '—';
                  rdsoApprovalLetterNo = firstUnit.products[0].approvalNo || '—';
                }
              }
            } else if (tx.moduleId === 2) {
              const detail = await rawMaterialService.getById(tx.requestId);
              productName = detail.materialName || '—';
              rdsoApprovalLetterNo = detail.docRefNo || '—';
            } else if (tx.moduleId === 4) {
              const detail = await productRecipeService.getById(tx.requestId);
              productName = detail.padType || '—';
              rdsoApprovalLetterNo = detail.recipeIdentification || '—';
            } else if (tx.moduleId === 5) {
              const detail = await approvedAshSGService.getById(tx.requestId);
              productName = detail.padType || '—';
              rdsoApprovalLetterNo = detail.approvalRefNo || '—';
            } else if (tx.moduleId === 6) {
              const detail = await approvedQAPService.getById(tx.requestId);
              if (detail && detail.productDetails && detail.productDetails.length > 0) {
                productName = detail.productDetails[0].padType || '—';
              }
              rdsoApprovalLetterNo = detail.qapNo || '—';
            }
          } catch (err) {
            console.error("Error fetching detail for tx mapping:", err);
          }
          return {
            ...tx,
            productName,
            rdsoApprovalLetterNo
          };
        }));
      };

      const mappedPending = await mapList(pendingData);
      const mappedCompleted = await mapList(completedData);

      setPendingList(mappedPending);
      setCompletedList(mappedCompleted);
    } catch (err) {
      console.error('Error fetching transitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPendingCount = (moduleId) => {
    return pendingList.filter((tx) => tx.moduleId === moduleId).length;
  };

  const getVerifiedCount = (moduleId) => {
    return completedList.filter((tx) => tx.moduleId === moduleId).length;
  };

  const handleCardClick = (moduleId) => {
    setSelectedModuleId(moduleId);
    setSelectedTx(null);
    setDetailData(null);
  };

  const handleSelectTransaction = async (tx) => {
    setSelectedTx(tx);
    setRemarks(tx.remarks || '');
    setDetailLoading(true);
    setDetailData(null);

    try {
      let data = null;
      const id = tx.requestId; // The transaction ID representing the primary key of that specific form submission

      switch (tx.moduleId) {
        case 1:
          data = await plantSetupService.getById(id);
          break;
        case 2:
          data = await rawMaterialService.getById(id);
          break;
        case 4:
          data = await productRecipeService.getById(id);
          break;
        case 5:
          data = await approvedAshSGService.getById(id);
          break;
        case 6:
          data = await approvedQAPService.getById(id);
          break;
        default:
          throw new Error('Unknown module ID');
      }

      setDetailData(data);
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      showNotification('Error fetching transaction details from database', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    if (!remarks.trim()) {
      showNotification('Please enter review remarks before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        workflowTransitionId: selectedTx.workflowTransitionId,
        moduleId: selectedTx.moduleId,
        requestId: selectedTx.requestId,
        action: actionType,
        remarks: remarks,
        actionBy: user.userId,
        shift: 'General'
      };

      const result = await performTransitionAction(payload);
      if (result.responseStatus?.statusCode === 0) {
        showNotification(
          actionType === 'VERIFY'
            ? 'Transaction successfully verified & baseline approved!'
            : 'Transaction returned to vendor with remarks.',
          'success'
        );
        setSelectedTx(null);
        setDetailData(null);
        // Reload list and refresh the transaction count badges
        await loadPendingList();
      } else {
        showNotification(result.responseStatus?.message || 'Failed to complete workflow transition.', 'error');
      }
    } catch (err) {
      console.error('Error performing transition:', err);
      showNotification('Error performing transition action.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const selectedModuleObj = modules.find(m => m.id === selectedModuleId);
  const activeList = statusTab === 'PENDING' ? pendingList : completedList;
  const moduleTransactions = activeList.filter(tx => tx.moduleId === selectedModuleId);

  return (
    <div style={{ padding: '24px', fontFamily: '"Outfit", sans-serif', color: '#1e293b', background: '#f8fafc', minHeight: '85vh' }}>

      {/* Skeleton Shimmer Keyframes */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }
      `}</style>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '16px 24px',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            background: notification.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      {/* Persistent Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛠️</span> Plant Setup & baseline Declarations
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Select any baseline card to manage pending verifications for that module.
          </p>
        </div>
      </div>

      {/* PERSISTENT 5 IMMINENT INTERACTIVE CARDS AT THE TOP */}
      <div style={{ animation: 'fadeIn 0.4s ease-out', marginBottom: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {modules.map((mod) => {
            const pendingCount = getPendingCount(mod.id);
            const isSelected = selectedModuleId === mod.id;
            return (
              <div
                key={mod.id}
                onClick={() => handleCardClick(mod.id)}
                style={{
                  background: '#ffffff',
                  border: isSelected ? `2px solid ${mod.color}` : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected
                    ? '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)'
                    : '0 2px 4px -1px rgba(0,0,0,0.03), 0 1px 2px -1px rgba(0,0,0,0.02)',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '175px'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)';
                    e.currentTarget.style.borderColor = mod.color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0,0,0,0.03), 0 1px 2px -1px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                {/* Subtle top indicator line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: mod.color }} />

                <div>
                  {/* Header: Icon & Notification Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      background: mod.bgGrad,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}>
                      {mod.icon}
                    </div>

                    {/* Dynamic Pending Count pill */}
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '9px',
                      fontWeight: '800',
                      background: pendingCount > 0 ? '#fee2e2' : '#ecfdf5',
                      color: pendingCount > 0 ? '#dc2626' : '#059669',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {pendingCount > 0 ? `${pendingCount} Pndg` : 'OK'}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.2' }}>
                    {mod.title}
                  </h3>

                  {/* Card Description */}
                  <p style={{ fontSize: '10.5px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    {mod.desc}
                  </p>
                </div>

                {/* Click to enter CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: mod.color, fontSize: '9.5px', fontWeight: '800', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>{isSelected ? 'ACTIVE' : 'SELECT'}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW 2: TRANSACTIONS LIST VIEW OR TRANSACTION DETAILS VIEW */}
      {selectedTx ? (
        // Transaction Details view if a specific transaction is active
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>

          {/* Back button to return to active transactions list */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <button
              onClick={() => { setSelectedTx(null); setDetailData(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12px',
                color: '#475569',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              ← Back to {selectedModuleObj?.title} Pending list
            </button>
          </div>

          {/* Details Body */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '300px', marginBottom: '24px' }}>
            {detailLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
                <div className="skeleton-shimmer" style={{ width: '250px', height: '20px' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton-shimmer" style={{ height: '56px', borderRadius: '10px' }}></div>
                  ))}
                </div>
                <div className="skeleton-shimmer" style={{ height: '180px', borderRadius: '12px', marginTop: '10px' }}></div>
              </div>
            ) : !detailData ? (
              <p style={{ color: '#ef4444', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                Failed to load transaction data from database. Please verify the ID or contact admin.
              </p>
            ) : (
              <div>

                {/* 1. PLANT SETUP DETAILS */}
                {selectedTx.moduleId === 1 && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>🏗️ Submitted Plant Setup Layout</h3>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div><strong>Total Declared Units:</strong> {detailData.numberOfUnits} unit(s)</div>
                        <div><strong>Operational Shift:</strong> {detailData.shift || 'General'}</div>
                      </div>
                    </div>

                    {detailData.units?.map((unit, idx) => (
                      <div key={unit.id || idx} style={{ marginBottom: '16px', padding: '16px', background: '#fafbfc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>Unit #{idx + 1}: {unit.unitName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}><strong>Factory Address:</strong> {unit.address} | <strong>Manufacturing Lines:</strong> {unit.numLines}</div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                              <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'left' }}>Product Name</th>
                              <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'left' }}>RDSO Approval Letter No.</th>
                              <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'left' }}>Approval Date</th>
                              <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'right' }}>Declared Capacity (Pcs/M)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unit.products?.map((prod, pIdx) => (
                              <tr key={pIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 12px', fontWeight: '600' }}>{prod.productName}</td>
                                <td style={{ padding: '8px 12px' }}>{prod.approvalNo}</td>
                                <td style={{ padding: '8px 12px' }}>{prod.approvalDate}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700' }}>{prod.capacity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. RAW MATERIAL SOURCE DETAILS */}
                {selectedTx.moduleId === 2 && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>🪵 Submitted Raw Material Source</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', background: '#fafbfc', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Material Name</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.materialName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Material Type</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.materialType || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Supplier / Manufacturer Source</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.supplierName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Reference Document Number</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.docRefNo}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Document Issued Date</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.docDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Declared Status</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>{detailData.status}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PRODUCT RECIPE DETAILS */}
                {selectedTx.moduleId === 4 && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>🧪 Submitted Product Chemical Recipe</h3>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div><strong>Recipe ID Reference:</strong> {detailData.recipeIdentification}</div>
                        <div style={{ marginTop: '4px' }}><strong>Rail Pad Grade/Type:</strong> {detailData.padType}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div><strong>Total composition percentage:</strong> {detailData.totalPercentage}%</div>
                        <div style={{ marginTop: '4px', color: '#059669' }}><strong>Virgin rubber sum:</strong> {detailData.virginTotalPercentage}% (Min 50%)</div>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>Chemical Recipe Ingredients Breakdown</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                          <th style={{ padding: '10px 16px', fontWeight: '700' }}>Ingredient / Raw Material Name</th>
                          <th style={{ padding: '10px 16px', fontWeight: '700', textAlign: 'center' }}>Proportion Percentage (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.ingredients?.map((ing, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontWeight: '600' }}>{ing.rawMaterial}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '700', color: '#2563eb' }}>{ing.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. APPROVED ASH & S.G. DETAILS */}
                {selectedTx.moduleId === 5 && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>📉 Submitted Baseline Ash & Specific Gravity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: '#fafbfc', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Rail Pad Type</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.padType}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Ash Content A (%)</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.ashContentA}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Specific Gravity A</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.specificGravityA}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Ash Content B (%)</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.ashContentB ? `${detailData.ashContentB}%` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Specific Gravity B</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.specificGravityB || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Approval Reference Number</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.approvalRefNo}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Approval Reference Date</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{detailData.approvalDate}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. APPROVED QAP VALUES DETAILS */}
                {selectedTx.moduleId === 6 && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>📋 Submitted QAP Process Limits</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>QAP Number</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{detailData.qapNo}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Approving Authority</div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{detailData.approvingAuthority}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Approval / Effective Date</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{detailData.approvalDate} / {detailData.effectiveDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#ef4444', textTransform: 'uppercase', fontWeight: '700' }}>Validity Date</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{detailData.validityDate}</div>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569', fontWeight: '700' }}>QAP Parameter Threshold Limits</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                      {detailData.productDetails?.map((detail, dIdx) => (
                        <div key={dIdx} style={{ background: '#fafbfc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px' }}>
                          <div style={{ fontWeight: '800', color: '#8b5cf6', fontSize: '13px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '12px' }}>
                            Rail Pad Type: {detail.padType}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '700', color: '#475569', marginBottom: '6px' }}>🔄 Mixing Parameters</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span>Time: {detail.minMixingTime} - {detail.maxMixingTime} min</span>
                                <span>Temp: {detail.minMixingTemp} - {detail.maxMixingTemp} °C</span>
                                <span>Weight: {detail.mixingWeight} Kg</span>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#475569', marginBottom: '6px' }}>🏭 Moulding Parameters</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span>Cure Time: {detail.minCuringTime} - {detail.maxCuringTime} min</span>
                                <span>Cure Temp: {detail.minCuringTemp} - {detail.maxCuringTemp} °C</span>
                                <span>Pressure: {detail.minCuringPressure} - {detail.maxCuringPressure} Kg/cm²</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* IE Verification Remarks & Actions Panel */}
          {detailData && (
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #cbd5e1' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🛡️ IE Verification & Baseline Approval Center
                </h3>
              </div>
              <div style={{ padding: '24px' }}>
                {selectedTx && (selectedTx.status === 'COMPLETED' || selectedTx.status === 'VERIFIED') ? (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '20px', color: '#065f46' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>
                      <span>✅</span> Verification Completed & Setup Approved
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      <strong>Approval Remarks:</strong> {selectedTx.remarks || 'No remarks provided during baseline approval.'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Review / Return Remarks *
                      </label>
                      <textarea
                        rows="3"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter thorough evaluation feedback, lab verification findings, approval reasons, or details for returning..."
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'border 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => (e.target.style.borderColor = selectedModuleObj?.color || '#21808d')}
                        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleAction('RETURN_TO_VENDOR')}
                        style={{
                          padding: '12px 28px',
                          background: '#fef2f2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSubmitting ? 'Processing...' : '⚠️ Return to Vendor'}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleAction('VERIFY')}
                        style={{
                          padding: '12px 36px',
                          background: '#059669',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px rgba(5,150,105,0.2)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isSubmitting ? 'Verifying...' : '✅ Verify & Approve Setup'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        // VIEW 2: TRANSACTIONS LIST VIEW
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{selectedModuleObj?.icon}</span> {selectedModuleObj?.title} – {statusTab === 'PENDING' ? 'Pending Verifications' : 'Verified Baselines'}
            </h2>

            {/* Beautiful Toggles */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(226, 232, 240, 0.6)', padding: '4px', borderRadius: '10px' }}>
                <button
                  onClick={() => { setStatusTab('PENDING'); setSelectedTx(null); setDetailData(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: statusTab === 'PENDING' ? '#ffffff' : 'transparent',
                    color: statusTab === 'PENDING' ? '#21808d' : '#64748b',
                    boxShadow: statusTab === 'PENDING' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  Pending
                  <span style={{ background: 'rgba(33, 128, 141, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {getPendingCount(selectedModuleId)}
                  </span>
                </button>
                <button
                  onClick={() => { setStatusTab('COMPLETED'); setSelectedTx(null); setDetailData(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: statusTab === 'COMPLETED' ? '#ffffff' : 'transparent',
                    color: statusTab === 'COMPLETED' ? '#21808d' : '#64748b',
                    boxShadow: statusTab === 'COMPLETED' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                  Verified
                  <span style={{ background: 'rgba(33, 128, 141, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {getVerifiedCount(selectedModuleId)}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Vendor Info</th>
                  <th style={{ padding: '14px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                    {selectedModuleId === 1 ? 'Product Name & RDSO Approval Letter No.' :
                      selectedModuleId === 2 ? 'Material Name & Ref Doc No.' :
                        selectedModuleId === 4 ? 'Pad Type & Recipe Ref' :
                          selectedModuleId === 5 ? 'Pad Type & Approval Ref' :
                            selectedModuleId === 6 ? 'Pad Type & QAP No.' :
                              'Product Name & Approval Letter No.'}
                  </th>
                  <th style={{ padding: '14px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Plant ID</th>
                  <th style={{ padding: '14px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 24px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="skeleton-shimmer" style={{ width: '180px', height: '16px' }}></div>
                        <div className="skeleton-shimmer" style={{ width: '100px', height: '12px', marginTop: '6px' }}></div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="skeleton-shimmer" style={{ width: '220px', height: '16px' }}></div>
                        <div className="skeleton-shimmer" style={{ width: '150px', height: '12px', marginTop: '6px' }}></div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="skeleton-shimmer" style={{ width: '80px', height: '16px' }}></div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div className="skeleton-shimmer" style={{ width: '70px', height: '22px', borderRadius: '12px' }}></div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div className="skeleton-shimmer" style={{ width: '100px', height: '32px', borderRadius: '8px', margin: '0 auto' }}></div>
                      </td>
                    </tr>
                  ))
                ) : moduleTransactions.length > 0 ? (
                  moduleTransactions.map((tx) => (
                    <tr key={tx.workflowTransitionId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{tx.vendorName || 'Vendor Manufacturer'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Code: {tx.vendorCode || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{tx.productName || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Ref: {tx.rdsoApprovalLetterNo || '—'}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: '600', color: '#475569' }}>
                        Plant #{tx.plantId || '1'}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: (tx.status === 'COMPLETED' || tx.status === 'VERIFIED') ? '#d1fae5' : '#fee2e2',
                          color: (tx.status === 'COMPLETED' || tx.status === 'VERIFIED') ? '#065f46' : '#b91c1c'
                        }}>
                          {tx.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleSelectTransaction(tx)}
                          style={{
                            padding: '8px 18px',
                            background: statusTab === 'COMPLETED' ? '#64748b' : (selectedModuleObj?.color || '#21808d'),
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                          }}
                        >
                          {statusTab === 'COMPLETED' ? '👁️ View Details' : 'Review & Verify'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{statusTab === 'PENDING' ? '🎉' : '📂'}</div>
                      <h3 style={{ margin: '0 0 4px 0', color: '#475569' }}>
                        {statusTab === 'PENDING' ? 'All Clear!' : 'No Records'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        {statusTab === 'PENDING'
                          ? 'No pending declarations for this module.'
                          : 'No verified baseline entries found for this module.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantDeclarationDashboard;
