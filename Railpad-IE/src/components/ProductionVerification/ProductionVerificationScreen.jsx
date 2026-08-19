import React, { useState, useMemo } from 'react';
import CustomSelect from '../common/CustomSelect';

const REJECTION_REASONS = [
  'NIL',
  'Short Moulding',
  'Bubbles / Blisters',
  'Surface Roughness',
  'Nylon Cord Exposure',
  'Uneven Edges',
  'Unclean Cut Sides',
  'Blow Holes',
  'Porosity',
  'Improper Grooves'
];

const ProductionVerificationScreen = ({ declaration, onBack, onVerify, onReturn, isSubmitting }) => {
  // ─── ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP ───
  const isReadOnly = (declaration?.status === 'Verified') && !declaration?.forceEdit;

  const [rejections, setRejections] = useState(Array.isArray(declaration?.rejections) ? declaration.rejections : []);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');

  // Safe items array - always an array, never null
  const safeItems = useMemo(() => {
    if (!declaration || !Array.isArray(declaration.items)) return [];
    return declaration.items.filter(Boolean);
  }, [declaration]);

  // Flatten products and batches for the dropdowns
  const availableBatches = useMemo(() => {
    const map = {};
    safeItems.forEach(item => {
      if (!item || !item.productType) return;
      if (!map[item.productType]) {
        map[item.productType] = [];
      }
      const safeBatches = Array.isArray(item.batches) ? item.batches.filter(Boolean) : [];
      safeBatches.forEach(b => {
        if (!b) return;
        const batchValue = b.batchNo || (b.compoundA && b.compoundB ? `${b.compoundA} + ${b.compoundB}` : '');
        let label = b.batchNo || '';
        if (b.compoundA && b.compoundB) {
          label = `Comp A: ${b.compoundA} | Comp B: ${b.compoundB}`;
        }
        if (batchValue && !map[item.productType].some(existing => existing.value === batchValue)) {
          map[item.productType].push({ value: batchValue, label: label || batchValue });
        }
      });
    });
    return map;
  }, [safeItems]);

  const batchToDrawings = useMemo(() => {
    const map = {};
    safeItems.forEach(item => {
      if (!item || !item.productType || !item.drawingNo) return;
      const pt = item.productType;
      if (!map[pt]) map[pt] = {};
      
      const safeBatches = Array.isArray(item.batches) ? item.batches.filter(Boolean) : [];
      safeBatches.forEach(b => {
        if (!b) return;
        const batchValue = b.batchNo || (b.compoundA && b.compoundB ? `${b.compoundA} + ${b.compoundB}` : '');
        if (batchValue) {
          if (!map[pt][batchValue]) {
            map[pt][batchValue] = new Set();
          }
          map[pt][batchValue].add(item.drawingNo);
        }
      });
    });
    
    // Convert Sets to arrays
    const finalMap = {};
    Object.keys(map).forEach(pt => {
      finalMap[pt] = {};
      Object.keys(map[pt]).forEach(batch => {
        finalMap[pt][batch] = Array.from(map[pt][batch]);
      });
    });
    return finalMap;
  }, [safeItems]);

  const productTypes = Object.keys(availableBatches);

  // Summary Calculations — safe against null/undefined
  const totalProduced = useMemo(() => {
    let total = 0;
    safeItems.forEach(item => {
      if (!item) return;
      const safeBatches = Array.isArray(item.batches) ? item.batches.filter(Boolean) : [];
      safeBatches.forEach(b => {
        if (!b) return;
        total += parseInt(b.qtyProduced) || 0;
      });
    });
    return total;
  }, [safeItems]);

  const totalRejected = useMemo(() => {
    const currentRejections = Array.isArray(rejections) ? rejections : [];
    return currentRejections.reduce((sum, rej) => sum + (rej ? (parseInt(rej.rejectedQty) || 0) : 0), 0);
  }, [rejections]);

  const totalAccepted = totalProduced - totalRejected;

  // ─── Now we can safely return early if declaration is missing ───
  if (!declaration) {
    return (
      <div className="pv-screen">
        <div className="pv-screen-header">
          <button className="pv-back-btn" onClick={onBack}>← Back</button>
          <div className="pv-screen-title">
            <h2>Shift Production Verification</h2>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <h3>Error: No declaration data found.</h3>
          <p>Please go back and try again.</p>
        </div>
      </div>
    );
  }

  // ─── Handlers ───
  const getManufacturedQty = (productType, batchNo, drawingNo) => {
    let total = 0;
    safeItems.forEach(item => {
      if (item && item.productType === productType && (!drawingNo || item.drawingNo === drawingNo)) {
        const safeBatches = Array.isArray(item.batches) ? item.batches.filter(Boolean) : [];
        safeBatches.forEach(b => {
          if (!b) return;
          const bNo = b.batchNo || (b.compoundA && b.compoundB ? `${b.compoundA} + ${b.compoundB}` : '');
          if (bNo === batchNo) {
            total += parseInt(b.qtyProduced) || 0;
          }
        });
      }
    });
    return total;
  };

  const getOtherRejectedQtySum = (currentRejections, excludeId, productType, batchNo, drawingNo) => {
    return currentRejections.reduce((sum, r) => {
      if (r.id !== excludeId && r.productType === productType && r.batchNo === batchNo && r.drawingNo === drawingNo) {
        return sum + (parseInt(r.rejectedQty) || 0);
      }
      return sum;
    }, 0);
  };

  const handleAddRejection = () => {
    setRejections(prev => [
      ...prev,
      { id: Date.now(), productType: '', batchNo: '', drawingNo: '', rejectedQty: '', reason: 'NIL' }
    ]);
  };

  const handleUpdateRejection = (id, field, value) => {
    setRejections(prev => prev.map(rej => {
      if (rej.id !== id) return rej;
      let updated = { ...rej, [field]: value };

      if (field === 'productType') {
        updated.batchNo = '';
        updated.drawingNo = '';
        updated.reason = 'NIL';
        updated.rejectedQty = '';
      }

      if (field === 'batchNo') {
        updated.drawingNo = '';
        if (value) {
          const currentQty = parseInt(updated.rejectedQty) || 0;
          const otherUsedReasons = prev
            .filter(r => r.id !== id && r.productType === updated.productType && r.batchNo === value)
            .map(r => r.reason);
          if (currentQty > 0) {
            if (updated.reason === 'NIL' || otherUsedReasons.includes(updated.reason)) {
              const available = REJECTION_REASONS.filter(r => r !== 'NIL' && !otherUsedReasons.includes(r));
              updated.reason = available.length > 0 ? available[0] : 'NIL';
            }
          } else {
            updated.reason = 'NIL';
          }
        } else {
          updated.reason = 'NIL';
          updated.rejectedQty = '';
        }
      }

      if (field === 'rejectedQty') {
        const qty = value === '' ? 0 : parseInt(value) || 0;
        updated.rejectedQty = qty > 0 ? qty : '';
        if (qty === 0) {
          updated.reason = 'NIL';
        } else {
          const otherUsedReasons = prev
            .filter(r => r.id !== id && r.productType === updated.productType && r.batchNo === updated.batchNo)
            .map(r => r.reason);
          if (updated.reason === 'NIL' || otherUsedReasons.includes(updated.reason)) {
            const available = REJECTION_REASONS.filter(r => r !== 'NIL' && !otherUsedReasons.includes(r));
            updated.reason = available.length > 0 ? available[0] : 'NIL';
          }
        }
      }

      if (field === 'reason') {
        if (value === 'NIL') {
          updated.rejectedQty = 0;
        } else {
          if (parseInt(updated.rejectedQty) === 0 || !updated.rejectedQty) {
            updated.rejectedQty = 1;
          }
          const otherUsedReasons = prev
            .filter(r => r.id !== id && r.productType === updated.productType && r.batchNo === updated.batchNo)
            .map(r => r.reason);
          if (otherUsedReasons.includes(value)) {
            alert(`The reason "${value}" is already logged for this product and batch combination.`);
            return rej;
          }
        }
      }

      // Validate rejected quantity against manufactured quantity
      if (updated.productType && updated.batchNo) {
        const manufacturedQty = getManufacturedQty(updated.productType, updated.batchNo, updated.drawingNo);
        const otherRejectionsSum = getOtherRejectedQtySum(prev, id, updated.productType, updated.batchNo, updated.drawingNo);
        const maxAllowed = Math.max(0, manufacturedQty - otherRejectionsSum);
        
        let currentQty = parseInt(updated.rejectedQty) || 0;
        if (currentQty > maxAllowed) {
          currentQty = maxAllowed;
          updated.rejectedQty = currentQty > 0 ? currentQty : '';
        }
      }

      return updated;
    }));
  };

  const handleRemoveRejection = (id) => {
    setRejections(prev => prev.filter(rej => rej.id !== id));
  };

  const getAvailableReasons = (currentRej) => {
    if (!currentRej || !currentRej.productType || !currentRej.batchNo) return REJECTION_REASONS;
    const usedReasons = rejections
      .filter(r => r && r.id !== currentRej.id && r.productType === currentRej.productType && r.batchNo === currentRej.batchNo)
      .map(r => r.reason);
    return REJECTION_REASONS.filter(reason => !usedReasons.includes(reason) || reason === currentRej.reason);
  };

  const handleFinalSubmit = () => {
    const hasIncomplete = rejections.some(r => !r.productType || !r.batchNo);
    if (hasIncomplete) {
      alert('Please complete all rejection entries (Select Product and Batch).');
      return;
    }

    const seen = new Set();
    let hasDuplicate = false;
    let duplicateInfo = '';
    for (const r of rejections) {
      if (r.productType && r.batchNo && r.reason && r.reason !== 'NIL') {
        const key = `${r.productType}|${r.batchNo}|${r.reason}`;
        if (seen.has(key)) {
          hasDuplicate = true;
          const batches = availableBatches[r.productType] || [];
          const matchedBatch = batches.find(b => b.value === r.batchNo);
          duplicateInfo = `"${r.reason}" for Product: ${r.productType}, Batch: ${matchedBatch ? matchedBatch.label : r.batchNo}`;
          break;
        }
        seen.add(key);
      }
    }
    if (hasDuplicate) {
      alert(`Duplicate rejection reason found: ${duplicateInfo}. Each reason can only be logged once per product and batch combination.`);
      return;
    }

    if (totalAccepted < 0) {
      alert('Total accepted pieces cannot be negative. Please check rejections.');
      return;
    }

    onVerify({ rejections, summary: { totalProduced, totalRejected, totalAccepted } });
  };

  const handleConfirmReturn = () => {
    if (!returnRemarks.trim()) {
      alert('Remarks are required to return to vendor.');
      return;
    }
    onReturn(returnRemarks);
    setShowReturnModal(false);
  };

  // ─── Render ───
  return (
    <div className="pv-screen">
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal-content remarks-modal">
            <div className="modal-header">
              <h3>Return to Vendor</h3>
              <button className="modal-close-btn" onClick={() => setShowReturnModal(false)}>×</button>
            </div>
            <div className="modal-body ultra-compact">
              <div className="modal-context-info-slim">
                <span><b>{declaration.vendorName}</b> (#{declaration.id}) | {declaration.date}</span>
              </div>
              <div className="modal-input-section">
                <textarea
                  className="remarks-textarea ultra-compact"
                  placeholder="Reason for returning (required)..."
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="modal-confirm-btn" onClick={handleConfirmReturn}>Confirm &amp; Send to Vendor</button>
            </div>
          </div>
        </div>
      )}

      <div className="pv-screen-header">
        <button className="pv-back-btn" onClick={onBack}>← Back</button>
        <div className="pv-screen-title">
          <h2>Shift Production Verification</h2>
          <span>{declaration.vendorName} | {declaration.date} | Shift {declaration.shift}</span>
        </div>
        {!isReadOnly && (
          <div className="pv-header-actions">
            {/* 
            <button
              className="pv-return-btn"
              disabled={isSubmitting}
              onClick={() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                setTimeout(() => setShowReturnModal(true), 500);
              }}
            >
              Return to Vendor
            </button>
            */}
          </div>
        )}
      </div>

      <div className="pv-sections-container">
        {/* Section 1: Vendor Production Information (Read-Only) */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-num">1</span>
            <h3>Vendor Production Information</h3>
            <span className="pv-readonly-badge">Read-Only</span>
          </div>

          {safeItems.length === 0 ? (
            <div className="pv-no-rejections">
              <p>No production items found in this declaration.</p>
            </div>
          ) : (
            <div className="pv-vendor-data-grid">
              {safeItems.map((item, idx) => {
                const safeBatches = Array.isArray(item.batches) ? item.batches.filter(Boolean) : [];
                return (
                  <div key={idx} className="pv-product-group">
                    <div className="pv-product-header" style={{ display: 'flex', alignItems: 'baseline' }}>
                      <h4 style={{ margin: 0 }}>{item.productType}</h4>
                      {item.drawingNo && (
                        <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>({item.drawingNo})</span>
                      )}
                    </div>
                    <table className="pv-data-table">
                      <thead>
                        <tr>
                          <th>Batch No.</th>
                          <th>Initial Wt. (kg)</th>
                          <th>Final Wt. (kg)</th>
                          <th>Final Product Numbers (Nos.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeBatches.map((batch, bIdx) => {
                          const qty = parseInt(batch.qtyProduced) || 0;
                          return (
                            <tr key={bIdx}>
                              <td>
                                {batch.batchNo
                                  ? batch.batchNo
                                  : (batch.compoundA
                                    ? `${batch.compoundA} + ${batch.compoundB}`
                                    : '—')}
                                {batch.batchNo && batch.compoundA && (
                                  <div className="pv-compound-info">
                                    Comp A: {batch.compoundA} | Comp B: {batch.compoundB}
                                  </div>
                                )}
                              </td>
                              <td>{batch.initialWeight ?? '—'}</td>
                              <td>{batch.finalWeight ?? '—'}</td>
                              <td>{qty.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Log Physical Rejections */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-num">2</span>
            <h3>Log Physical Rejections</h3>
            {!isReadOnly && <button className="pv-add-rej-btn" onClick={handleAddRejection}>+ Add Rejection</button>}
          </div>

          {rejections.length === 0 ? (
            <div className="pv-no-rejections">
              <p>No rejections logged. Click "+ Add Rejection" if any defects were found.</p>
            </div>
          ) : (
            <table className="pv-rejection-table">
              <thead>
                <tr>
                  <th>Product Type</th>
                  <th>Batch No.</th>
                  <th>Drawing No.</th>
                  <th style={{ width: '120px' }}>Rejected Qty</th>
                  <th style={{ width: '25%' }}>Reason</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {rejections.filter(Boolean).map(rej => (
                  <tr key={rej.id}>
                    <td>
                      <select
                        value={rej.productType}
                        onChange={(e) => handleUpdateRejection(rej.id, 'productType', e.target.value)}
                        disabled={isReadOnly}
                        style={{ border: !rej.productType ? '1px solid #fda4af' : '1px solid #e2e8f0' }}
                      >
                        <option value="">-- Select Product --</option>
                        {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        value={rej.batchNo}
                        onChange={(e) => handleUpdateRejection(rej.id, 'batchNo', e.target.value)}
                        disabled={isReadOnly || !rej.productType}
                        style={{ border: !rej.batchNo ? '1px solid #fda4af' : '1px solid #e2e8f0' }}
                      >
                        <option value="">-- Select Batch --</option>
                        {rej.productType && availableBatches[rej.productType]?.map(b => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {rej.productType && rej.productType.includes('NCRGRSP') ? (
                        <select
                          value={rej.drawingNo || ''}
                          onChange={(e) => handleUpdateRejection(rej.id, 'drawingNo', e.target.value)}
                          disabled={isReadOnly || !rej.batchNo}
                          style={{ border: (!rej.drawingNo && batchToDrawings[rej.productType]?.[rej.batchNo]?.length > 0) ? '1px solid #fda4af' : '1px solid #e2e8f0' }}
                        >
                          <option value="">-- Select Drawing --</option>
                          {rej.productType && rej.batchNo && batchToDrawings[rej.productType]?.[rej.batchNo]
                            ?.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={rej.rejectedQty}
                        onChange={(e) => handleUpdateRejection(rej.id, 'rejectedQty', e.target.value)}
                        min="0"
                        disabled={isReadOnly}
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <CustomSelect
                        options={getAvailableReasons(rej)}
                        value={rej.reason}
                        onChange={(value) => handleUpdateRejection(rej.id, 'reason', value)}
                        disabled={isReadOnly}
                        placeholder="Select Reason"
                      />
                    </td>
                    <td>
                      {!isReadOnly && (
                        <button className="pv-remove-btn" onClick={() => handleRemoveRejection(rej.id)}>×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 3: Production Summary */}
      <div className="pv-summary-footer">
        <div className="pv-summary-grid">
          <div className="pv-summary-item">
            <label>Total Pieces Produced</label>
            <div className="pv-value">{totalProduced.toLocaleString()}</div>
          </div>
          <div className="pv-summary-item rejected">
            <label>Total Pieces Rejected</label>
            <div className="pv-value">{totalRejected.toLocaleString()}</div>
          </div>
          <div className="pv-summary-item accepted">
            <label>Total Accepted Pieces</label>
            <div className="pv-value highlight">{totalAccepted.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            className="pv-submit-btn"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            style={{ padding: '12px 24px', fontSize: '16px', minWidth: '200px' }}
          >
            {isSubmitting ? 'Processing...' : (declaration.forceEdit ? 'Update Verification' : 'Finalize & Accept')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductionVerificationScreen;
