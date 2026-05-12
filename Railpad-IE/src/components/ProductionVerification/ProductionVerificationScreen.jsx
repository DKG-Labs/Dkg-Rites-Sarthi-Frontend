import React, { useState, useMemo } from 'react';

const REJECTION_REASONS = [
  'Porosity',
  'Blow holes',
  'Improper dimensions',
  'Foreign particles',
  'Flash defects',
  'Surface cracks',
  'Improper curing',
  'Others'
];

const ProductionVerificationScreen = ({ declaration, onBack, onVerify }) => {
  const [rejections, setRejections] = useState([]);

  // Flatten products and batches for the dropdowns
  const availableBatches = useMemo(() => {
    const map = {};
    declaration.items.forEach(item => {
      map[item.productType] = item.batches.map(b => {
        let label = b.batchNo;
        if (b.compoundA && b.compoundB) {
          label = `Comp A: ${b.compoundA} | Comp B: ${b.compoundB}`;
        }
        return { value: b.batchNo, label: label };
      });
    });
    return map;
  }, [declaration]);

  const productTypes = Object.keys(availableBatches);

  const handleAddRejection = () => {
    setRejections([
      ...rejections,
      { 
        id: Date.now(), 
        productType: productTypes[0], 
        batchNo: availableBatches[productTypes[0]][0]?.value || '', 
        rejectedQty: 0, 
        reason: REJECTION_REASONS[0] 
      }
    ]);
  };

  const handleUpdateRejection = (id, field, value) => {
    setRejections(rejections.map(rej => {
      if (rej.id === id) {
        const updated = { ...rej, [field]: value };
        // If product type changed, reset batch no to the first one available for that type
        if (field === 'productType') {
          updated.batchNo = availableBatches[value][0]?.value || '';
        }
        return updated;
      }
      return rej;
    }));
  };

  const handleRemoveRejection = (id) => {
    setRejections(rejections.filter(rej => rej.id !== id));
  };

  // Summary Calculations
  const totalProduced = useMemo(() => {
    let total = 0;
    declaration.items.forEach(item => {
      item.batches.forEach(b => {
        total += b.qtyProduced;
      });
    });
    return total;
  }, [declaration]);

  const totalRejected = useMemo(() => {
    return rejections.reduce((sum, rej) => sum + (parseInt(rej.rejectedQty) || 0), 0);
  }, [rejections]);

  const totalAccepted = totalProduced - totalRejected;

  const handleFinalSubmit = () => {
    if (totalAccepted < 0) {
      alert('Total accepted pieces cannot be negative. Please check rejections.');
      return;
    }
    
    onVerify({
      rejections: rejections,
      summary: {
        totalProduced,
        totalRejected,
        totalAccepted
      }
    });
  };

  return (
    <div className="pv-screen">
      <div className="pv-screen-header">
        <button className="pv-back-btn" onClick={onBack}>← Back</button>
        <div className="pv-screen-title">
          <h2>Shift Production Verification</h2>
          <span>{declaration.vendorName} | {declaration.date} | Shift {declaration.shift}</span>
        </div>
        <button className="pv-submit-btn" onClick={handleFinalSubmit}>Finalize & Accept</button>
      </div>

      <div className="pv-sections-container">
        {/* Section 1: Vendor Production Information (Read-Only) */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-num">1</span>
            <h3>Vendor Production Information</h3>
            <span className="pv-readonly-badge">Read-Only</span>
          </div>
          
          <div className="pv-vendor-data-grid">
            {declaration.items.map((item, idx) => (
              <div key={idx} className="pv-product-group">
                <div className="pv-product-header">
                  <h4>{item.productType}</h4>
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
                    {item.batches.map((batch, bIdx) => (
                      <tr key={bIdx}>
                        <td>
                          {batch.batchNo}
                          {batch.compoundA && (
                            <div className="pv-compound-info">
                              {batch.compoundA} + {batch.compoundB}
                            </div>
                          )}
                        </td>
                        <td>{batch.initialWeight}</td>
                        <td>{batch.finalWeight}</td>
                        <td>{batch.qtyProduced.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Entry of Rejected Rail Pads */}
        <div className="pv-section">
          <div className="pv-section-header">
            <span className="pv-section-num">2</span>
            <h3>Log Physical Rejections</h3>
            <button className="pv-add-rej-btn" onClick={handleAddRejection}>+ Add Rejection</button>
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
                  <th>Rejected Qty</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rejections.map(rej => (
                  <tr key={rej.id}>
                    <td>
                      <select 
                        value={rej.productType}
                        onChange={(e) => handleUpdateRejection(rej.id, 'productType', e.target.value)}
                      >
                        {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </td>
                    <td>
                      <select 
                        value={rej.batchNo}
                        onChange={(e) => handleUpdateRejection(rej.id, 'batchNo', e.target.value)}
                      >
                        {availableBatches[rej.productType].map(b => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={rej.rejectedQty}
                        onChange={(e) => handleUpdateRejection(rej.id, 'rejectedQty', e.target.value)}
                        min="0"
                      />
                    </td>
                    <td>
                      <select 
                        value={rej.reason}
                        onChange={(e) => handleUpdateRejection(rej.id, 'reason', e.target.value)}
                      >
                        {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="pv-remove-btn" onClick={() => handleRemoveRejection(rej.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 3: Production Summary & Final Acceptance */}
      <div className="pv-summary-footer">
        <div className="pv-summary-grid">
          <div className="pv-summary-item">
            <label>Total Pieces Produced</label>
            <div className="pv-value">{totalProduced.toLocaleString()}</div>
          </div>
          <div className="pv-summary-item rejected">
            <label>Total Pieces Rejected</label>
            <div className="pv-value">-{totalRejected.toLocaleString()}</div>
          </div>
          <div className="pv-summary-item accepted">
            <label>Total Accepted Pieces</label>
            <div className="pv-value highlight">{totalAccepted.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionVerificationScreen;
