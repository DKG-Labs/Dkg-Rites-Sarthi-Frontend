import React from 'react';

const PeriodicTestingTab = ({ periodicData, setPeriodicData, activeRailpadType, getSectionStatus, markDirty }) => {
  const tgaStatus = getSectionStatus('tga');
  const durabilityStatus = getSectionStatus('durability');
  const abrasionStatus = getSectionStatus('abrasion');

  // Helpers to handle input changes
  const handleTgaChange = (idx, field, val) => {
    setPeriodicData(prev => {
      const newSamples = [...prev.tga.samples];
      newSamples[idx] = { ...newSamples[idx], [field]: val };
      return { ...prev, tga: { ...prev.tga, samples: newSamples } };
    });
    markDirty();
  };

  const handleAddTgaRow = () => {
    setPeriodicData(prev => ({
      ...prev,
      tga: {
        ...prev.tga,
        samples: [
          ...prev.tga.samples,
          { lotNo: '', sampleNo: '', weight: '', tempRange: '', polymer: '' }
        ]
      }
    }));
    markDirty();
  };

  const handleDeleteTgaRow = (idx) => {
    setPeriodicData(prev => {
      if (prev.tga.samples.length <= 1) return prev;
      const newSamples = prev.tga.samples.filter((_, i) => i !== idx);
      return { ...prev, tga: { ...prev.tga, samples: newSamples } };
    });
    markDirty();
  };

  const handleDurabilityChange = (idx, field, val) => {
    setPeriodicData(prev => {
      const newSamples = [...prev.durability.samples];
      newSamples[idx] = { ...newSamples[idx], [field]: val };
      return { ...prev, durability: { ...prev.durability, samples: newSamples } };
    });
    markDirty();
  };

  const handleAddDurabilityRow = () => {
    setPeriodicData(prev => ({
      ...prev,
      durability: {
        ...prev.durability,
        samples: [
          ...prev.durability.samples,
          { lotNo: '', initialThick: '', finalThick: '', initialLoad: '', finalLoad: '' }
        ]
      }
    }));
    markDirty();
  };

  const handleDeleteDurabilityRow = (idx) => {
    setPeriodicData(prev => {
      if (prev.durability.samples.length <= 1) return prev;
      const newSamples = prev.durability.samples.filter((_, i) => i !== idx);
      return { ...prev, durability: { ...prev.durability, samples: newSamples } };
    });
    markDirty();
  };

  const handleAbrasionChange = (idx, field, val) => {
    setPeriodicData(prev => {
      const newSamples = [...prev.abrasion.samples];
      newSamples[idx] = { ...newSamples[idx], [field]: val };
      return { ...prev, abrasion: { ...prev.abrasion, samples: newSamples } };
    });
    markDirty();
  };

  const handleAddAbrasionRow = () => {
    setPeriodicData(prev => ({
      ...prev,
      abrasion: {
        ...prev.abrasion,
        samples: [
          ...prev.abrasion.samples,
          { lotNo: '', sampleNo: '', initialMass: '', finalMass: '', relativeLoss: '' }
        ]
      }
    }));
    markDirty();
  };

  const handleDeleteAbrasionRow = (idx) => {
    setPeriodicData(prev => {
      if (prev.abrasion.samples.length <= 1) return prev;
      const newSamples = prev.abrasion.samples.filter((_, i) => i !== idx);
      return { ...prev, abrasion: { ...prev.abrasion, samples: newSamples } };
    });
    markDirty();
  };

  // Threshold logic
  const TGA_THRESHOLD = 30000;
  const DURABILITY_THRESHOLD = 100000;
  const ABRASION_THRESHOLD = 100000;

  const hasTgaQty = periodicData.tga.qtyProduced !== '' && periodicData.tga.qtyProduced !== null && periodicData.tga.qtyProduced !== undefined;
  const hasDurabilityQty = periodicData.durability.qtyProduced !== '' && periodicData.durability.qtyProduced !== null && periodicData.durability.qtyProduced !== undefined;
  const hasAbrasionQty = periodicData.abrasion.qtyProduced !== '' && periodicData.abrasion.qtyProduced !== null && periodicData.abrasion.qtyProduced !== undefined;

  const isTgaMandatory = hasTgaQty && parseInt(periodicData.tga.qtyProduced || 0, 10) >= TGA_THRESHOLD;
  const isDurabilityMandatory = hasDurabilityQty && parseInt(periodicData.durability.qtyProduced || 0, 10) >= DURABILITY_THRESHOLD;
  const isAbrasionMandatory = hasAbrasionQty && parseInt(periodicData.abrasion.qtyProduced || 0, 10) >= ABRASION_THRESHOLD;

  const maxThicknessReduction = (activeRailpadType || '').toLowerCase().includes('10mm') ? 1.0 : 0.6;

  const renderSectionHeader = (title, data, setData, threshold, hasQty, isMandatory, status) => (
    <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
          {!hasQty ? (
            <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: '700', marginTop: '2px', display: 'block' }}>
              ⚠️ Please enter "Qty Produced Since Last Test" first to unlock sample data entry.
            </span>
          ) : !isMandatory ? (
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px', display: 'block' }}>
              Qty ({data.qtyProduced}) is below threshold ({threshold}) — Testing is optional. Engineer can enter sample data or skip.
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: '700', marginTop: '2px', display: 'block' }}>
              Qty ({data.qtyProduced}) exceeds threshold ({threshold}) — Testing is mandatory.
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '700', 
            padding: '4px 10px',
            borderRadius: '6px',
            background: !hasQty ? '#f1f5f9' : isMandatory ? '#fee2e2' : '#f0fdf4',
            color: !hasQty ? '#64748b' : isMandatory ? '#ef4444' : '#16a34a',
            border: !hasQty ? '1px solid #cbd5e1' : isMandatory ? '1px solid #fca5a5' : '1px solid #bbf7d0'
          }}>
            {!hasQty ? 'ENTER QTY PRODUCED' : isMandatory ? 'MANDATORY' : 'OPTIONAL (BYPASS ALLOWED)'}
          </span>
          {status && status !== 'PENDING' && (
             <span style={{ 
               padding: '4px 12px', 
               borderRadius: '6px', 
               fontSize: '11px', 
               fontWeight: '800', 
               background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : status === 'BYPASSED' ? '#e2e8f0' : '#fff7ed', 
               color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : status === 'BYPASSED' ? '#475569' : '#c2410c' 
             }}>
               {status}
             </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Date of Last Test</label>
          <input type="date" value={data.dateOfLastTest || ''} onChange={(e) => {
            setData(prev => ({ ...prev, dateOfLastTest: e.target.value }));
            markDirty();
          }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Qty Produced Since Last Test <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input 
            type="number" 
            placeholder="Enter quantity"
            value={data.qtyProduced || ''} 
            onChange={(e) => {
              setData(prev => ({ ...prev, qtyProduced: e.target.value }));
              markDirty();
            }} 
            style={{ 
              padding: '8px', 
              borderRadius: '6px', 
              border: !hasQty ? '2px solid #f43f5e' : '1px solid #cbd5e1', 
              fontSize: '13px', 
              width: '180px',
              background: !hasQty ? '#fff1f2' : 'white'
            }} 
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Testing Threshold</label>
          <input type="text" value={threshold} readOnly style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f1f5f9', color: '#64748b', fontWeight: '700', width: '120px' }} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' }}>
      {/* TGA Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '20px' }}>
          {renderSectionHeader('Thermogravimetric Analysis (TGA)', periodicData.tga, (val) => setPeriodicData(prev => ({ ...prev, tga: typeof val === 'function' ? val(prev.tga) : val })), TGA_THRESHOLD, hasTgaQty, isTgaMandatory, tgaStatus)}
          
          <div style={{ 
            width: '100%', 
            overflowX: 'auto',
            opacity: hasTgaQty ? 1 : 0.45,
            pointerEvents: hasTgaQty ? 'auto' : 'none',
            filter: hasTgaQty ? 'none' : 'grayscale(100%)',
            transition: 'all 0.2s ease'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Lot No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample Wt (mg)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Temp Range</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>% Polymer Content (&gt; 50.0%)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(periodicData.tga?.samples || []).map((sample, idx) => {
                  const polymerVal = parseFloat(sample?.polymer);
                  const isPolymerOut = !isNaN(polymerVal) && sample?.polymer !== '' && polymerVal <= 50.0;
                  return (
                    <tr key={idx}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasTgaQty} type="text" value={sample?.lotNo || ''} onChange={(e) => handleTgaChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasTgaQty} type="text" value={sample?.sampleNo || ''} onChange={(e) => handleTgaChange(idx, 'sampleNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasTgaQty} type="number" value={sample?.weight || ''} onChange={(e) => handleTgaChange(idx, 'weight', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasTgaQty} type="text" value={sample?.tempRange || ''} onChange={(e) => handleTgaChange(idx, 'tempRange', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        <input 
                          disabled={!hasTgaQty} 
                          type="number" 
                          value={sample?.polymer || ''} 
                          onChange={(e) => handleTgaChange(idx, 'polymer', e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: '8px', 
                            border: 'none', 
                            textAlign: 'center', 
                            fontWeight: '800', 
                            fontSize: '13px',
                            color: isPolymerOut ? '#ef4444' : '#21808d'
                          }} 
                        />
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {periodicData.tga.samples.length > 1 && (
                          <button
                            type="button"
                            disabled={!hasTgaQty}
                            onClick={() => handleDeleteTgaRow(idx)}
                            title="Delete Row"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              padding: '2px 6px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add Row Button */}
            <div style={{ marginTop: '12px', padding: '4px 0' }}>
              <button
                type="button"
                disabled={!hasTgaQty}
                onClick={handleAddTgaRow}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: hasTgaQty ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Durability Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '20px' }}>
          {renderSectionHeader('Inclined Repeated Load Test', periodicData.durability, (val) => setPeriodicData(prev => ({ ...prev, durability: typeof val === 'function' ? val(prev.durability) : val })), DURABILITY_THRESHOLD, hasDurabilityQty, isDurabilityMandatory, durabilityStatus)}
          
          <div style={{ 
            width: '100%', 
            overflowX: 'auto',
            opacity: hasDurabilityQty ? 1 : 0.45,
            pointerEvents: hasDurabilityQty ? 'auto' : 'none',
            filter: hasDurabilityQty ? 'none' : 'grayscale(100%)',
            transition: 'all 0.2s ease'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Lot No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Thickness (mm)<br/>Initial</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Thickness (mm)<br/>After</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Reduction in<br/>Thickness (mm)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Load Comp.<br/>Before</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Load Comp.<br/>After</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Change in<br/>LD%</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(periodicData.durability?.samples || []).map((sample, idx) => {
                  const initialThick = parseFloat(sample?.initialThick) || 0;
                  const finalThick = parseFloat(sample?.finalThick) || 0;
                  const thickReduction = (initialThick > 0 && finalThick > 0) ? (initialThick - finalThick).toFixed(2) : '-';
                  const isReductionOut = thickReduction !== '-' && parseFloat(thickReduction) > maxThicknessReduction;
                  
                  const initialLoad = parseFloat(sample?.initialLoad) || 0;
                  const finalLoad = parseFloat(sample?.finalLoad) || 0;
                  const changeLd = (initialLoad > 0 && finalLoad > 0) ? (((finalLoad - initialLoad) / initialLoad) * 100).toFixed(2) : '-';
                  const isChangeLdOut = changeLd !== '-' && Math.abs(parseFloat(changeLd)) > 10;

                  return (
                    <tr key={idx}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasDurabilityQty} type="text" value={sample?.lotNo || ''} onChange={(e) => handleDurabilityChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasDurabilityQty} type="number" value={sample?.initialThick || ''} onChange={(e) => handleDurabilityChange(idx, 'initialThick', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasDurabilityQty} type="number" value={sample?.finalThick || ''} onChange={(e) => handleDurabilityChange(idx, 'finalThick', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: isReductionOut ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{thickReduction}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasDurabilityQty} type="number" value={sample?.initialLoad || ''} onChange={(e) => handleDurabilityChange(idx, 'initialLoad', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasDurabilityQty} type="number" value={sample?.finalLoad || ''} onChange={(e) => handleDurabilityChange(idx, 'finalLoad', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: isChangeLdOut ? '#ef4444' : '#21808d', background: '#f8fafc' }}>{changeLd}{changeLd !== '-' && '%'}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {periodicData.durability.samples.length > 1 && (
                          <button
                            type="button"
                            disabled={!hasDurabilityQty}
                            onClick={() => handleDeleteDurabilityRow(idx)}
                            title="Delete Row"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              padding: '2px 6px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add Row Button */}
            <div style={{ marginTop: '12px', padding: '4px 0' }}>
              <button
                type="button"
                disabled={!hasDurabilityQty}
                onClick={handleAddDurabilityRow}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: hasDurabilityQty ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Abrasion Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '20px' }}>
          {renderSectionHeader('Abrasion Test', periodicData.abrasion, (val) => setPeriodicData(prev => ({ ...prev, abrasion: typeof val === 'function' ? val(prev.abrasion) : val })), ABRASION_THRESHOLD, hasAbrasionQty, isAbrasionMandatory, abrasionStatus)}
          
          <div style={{ 
            width: '100%', 
            overflowX: 'auto',
            opacity: hasAbrasionQty ? 1 : 0.45,
            pointerEvents: hasAbrasionQty ? 'auto' : 'none',
            filter: hasAbrasionQty ? 'none' : 'grayscale(100%)',
            transition: 'all 0.2s ease'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Lot No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Initial Mass (g)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Final Mass (g)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Loss of Mass</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Relative loss of<br/>volume/Mass</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b', width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(periodicData.abrasion?.samples || []).map((sample, idx) => {
                  const initial = parseFloat(sample?.initialMass) || 0;
                  const final = parseFloat(sample?.finalMass) || 0;
                  const lossOfMass = (initial > 0 && final > 0) ? (initial - final).toFixed(4) : '-';
                  const rlVal = parseFloat(sample?.relativeLoss);
                  const isRlOut = !isNaN(rlVal) && sample?.relativeLoss !== '' && (rlVal < 180 || rlVal > 220);

                  return (
                    <tr key={idx}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasAbrasionQty} type="text" value={sample?.lotNo || ''} onChange={(e) => handleAbrasionChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasAbrasionQty} type="text" value={sample?.sampleNo || ''} onChange={(e) => handleAbrasionChange(idx, 'sampleNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasAbrasionQty} type="number" value={sample?.initialMass || ''} onChange={(e) => handleAbrasionChange(idx, 'initialMass', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input disabled={!hasAbrasionQty} type="number" value={sample?.finalMass || ''} onChange={(e) => handleAbrasionChange(idx, 'finalMass', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{lossOfMass}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        <input 
                          disabled={!hasAbrasionQty} 
                          type="number" 
                          value={sample?.relativeLoss || ''} 
                          onChange={(e) => handleAbrasionChange(idx, 'relativeLoss', e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: '8px', 
                            border: 'none', 
                            textAlign: 'center', 
                            fontSize: '13px',
                            fontWeight: '800',
                            color: isRlOut ? '#ef4444' : '#21808d'
                          }} 
                        />
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {periodicData.abrasion.samples.length > 1 && (
                          <button
                            type="button"
                            disabled={!hasAbrasionQty}
                            onClick={() => handleDeleteAbrasionRow(idx)}
                            title="Delete Row"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              padding: '2px 6px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Add Row Button */}
            <div style={{ marginTop: '12px', padding: '4px 0' }}>
              <button
                type="button"
                disabled={!hasAbrasionQty}
                onClick={handleAddAbrasionRow}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: hasAbrasionQty ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                + Add Row
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodicTestingTab;
