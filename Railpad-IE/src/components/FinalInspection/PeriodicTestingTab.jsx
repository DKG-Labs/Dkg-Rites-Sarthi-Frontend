import React from 'react';

const PeriodicTestingTab = ({ periodicData, setPeriodicData, activeRailpadType, getSectionStatus, markDirty }) => {
  const tgaStatus = getSectionStatus('tga');
  const durabilityStatus = getSectionStatus('durability');
  const abrasionStatus = getSectionStatus('abrasion');

  // Helper to handle input changes
  const handleTgaChange = (idx, field, val) => {
    setPeriodicData(prev => {
      const newSamples = [...prev.tga.samples];
      newSamples[idx] = { ...newSamples[idx], [field]: val };
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

  const handleAbrasionChange = (idx, field, val) => {
    setPeriodicData(prev => {
      const newSamples = [...prev.abrasion.samples];
      newSamples[idx] = { ...newSamples[idx], [field]: val };
      return { ...prev, abrasion: { ...prev.abrasion, samples: newSamples } };
    });
    markDirty();
  };

  // Threshold logic
  const TGA_THRESHOLD = 30000;
  const DURABILITY_THRESHOLD = 100000;
  const ABRASION_THRESHOLD = 100000;

  const isTgaMandatory = parseInt(periodicData.tga.qtyProduced || 0, 10) >= TGA_THRESHOLD;
  const isDurabilityMandatory = parseInt(periodicData.durability.qtyProduced || 0, 10) >= DURABILITY_THRESHOLD;
  const isAbrasionMandatory = parseInt(periodicData.abrasion.qtyProduced || 0, 10) >= ABRASION_THRESHOLD;

  const renderSectionHeader = (title, data, setData, threshold, isMandatory, status) => (
    <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: isMandatory ? '#ef4444' : '#64748b' }}>
            {isMandatory ? 'MANDATORY' : 'OPTIONAL (BYPASS ALLOWED)'}
          </span>
          {status !== 'PENDING' && (
             <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: status === 'PASS' ? '#dcfce7' : status === 'FAIL' ? '#fee2e2' : '#fff7ed', color: status === 'PASS' ? '#166534' : status === 'FAIL' ? '#991b1b' : '#c2410c' }}>
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
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Qty Produced Since Last Test</label>
          <input type="number" value={data.qtyProduced || ''} onChange={(e) => {
            setData(prev => ({ ...prev, qtyProduced: e.target.value }));
            markDirty();
          }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '150px' }} />
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
          {renderSectionHeader('Thermogravimetric Analysis (TGA)', periodicData.tga, (val) => setPeriodicData(prev => ({ ...prev, tga: typeof val === 'function' ? val(prev.tga) : val })), TGA_THRESHOLD, isTgaMandatory, tgaStatus)}
          
          <div style={{ opacity: (!isTgaMandatory && !periodicData.tga.samples.some(s => s.weight)) ? 0.6 : 1, pointerEvents: (!isTgaMandatory && !periodicData.tga.samples.some(s => s.weight)) ? 'none' : 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Lot No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample No</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Sample Wt (mg)</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>Temp Range</th>
                  <th style={{ padding: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>% Polymer Content</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(idx => (
                  <tr key={idx}>
                    <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.tga.samples[idx]?.lotNo || ''} onChange={(e) => handleTgaChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.tga.samples[idx]?.sampleNo || ''} onChange={(e) => handleTgaChange(idx, 'sampleNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.tga.samples[idx]?.weight || ''} onChange={(e) => handleTgaChange(idx, 'weight', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.tga.samples[idx]?.tempRange || ''} onChange={(e) => handleTgaChange(idx, 'tempRange', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                    <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.tga.samples[idx]?.polymer || ''} onChange={(e) => handleTgaChange(idx, 'polymer', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontWeight: '800', fontSize: '13px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Durability Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '20px' }}>
          {renderSectionHeader('Inclined Repeated Load Test', periodicData.durability, (val) => setPeriodicData(prev => ({ ...prev, durability: typeof val === 'function' ? val(prev.durability) : val })), DURABILITY_THRESHOLD, isDurabilityMandatory, durabilityStatus)}
          
          <div style={{ opacity: (!isDurabilityMandatory && !periodicData.durability.samples.some(s => s.initialThick)) ? 0.6 : 1, pointerEvents: (!isDurabilityMandatory && !periodicData.durability.samples.some(s => s.initialThick)) ? 'none' : 'auto' }}>
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
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(idx => {
                  const initialThick = parseFloat(periodicData.durability.samples[idx]?.initialThick) || 0;
                  const finalThick = parseFloat(periodicData.durability.samples[idx]?.finalThick) || 0;
                  const thickReduction = (initialThick > 0 && finalThick > 0) ? (initialThick - finalThick).toFixed(2) : '-';
                  
                  const initialLoad = parseFloat(periodicData.durability.samples[idx]?.initialLoad) || 0;
                  const finalLoad = parseFloat(periodicData.durability.samples[idx]?.finalLoad) || 0;
                  const changeLd = (initialLoad > 0 && finalLoad > 0) ? (((finalLoad - initialLoad) / initialLoad) * 100).toFixed(2) : '-';

                  return (
                    <tr key={idx}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.durability.samples[idx]?.lotNo || ''} onChange={(e) => handleDurabilityChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.durability.samples[idx]?.initialThick || ''} onChange={(e) => handleDurabilityChange(idx, 'initialThick', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.durability.samples[idx]?.finalThick || ''} onChange={(e) => handleDurabilityChange(idx, 'finalThick', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{thickReduction}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.durability.samples[idx]?.initialLoad || ''} onChange={(e) => handleDurabilityChange(idx, 'initialLoad', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.durability.samples[idx]?.finalLoad || ''} onChange={(e) => handleDurabilityChange(idx, 'finalLoad', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{changeLd}{changeLd !== '-' && '%'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Abrasion Section */}
      <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ padding: '20px' }}>
          {renderSectionHeader('Abrasion Test', periodicData.abrasion, (val) => setPeriodicData(prev => ({ ...prev, abrasion: typeof val === 'function' ? val(prev.abrasion) : val })), ABRASION_THRESHOLD, isAbrasionMandatory, abrasionStatus)}
          
          <div style={{ opacity: (!isAbrasionMandatory && !periodicData.abrasion.samples.some(s => s.initialMass)) ? 0.6 : 1, pointerEvents: (!isAbrasionMandatory && !periodicData.abrasion.samples.some(s => s.initialMass)) ? 'none' : 'auto' }}>
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
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map(idx => {
                  const initial = parseFloat(periodicData.abrasion.samples[idx]?.initialMass) || 0;
                  const final = parseFloat(periodicData.abrasion.samples[idx]?.finalMass) || 0;
                  const lossOfMass = (initial > 0 && final > 0) ? (initial - final).toFixed(4) : '-';

                  return (
                    <tr key={idx}>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>S{idx + 1}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.abrasion.samples[idx]?.lotNo || ''} onChange={(e) => handleAbrasionChange(idx, 'lotNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="text" value={periodicData.abrasion.samples[idx]?.sampleNo || ''} onChange={(e) => handleAbrasionChange(idx, 'sampleNo', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.abrasion.samples[idx]?.initialMass || ''} onChange={(e) => handleAbrasionChange(idx, 'initialMass', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.abrasion.samples[idx]?.finalMass || ''} onChange={(e) => handleAbrasionChange(idx, 'finalMass', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                      <td style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '900', color: '#21808d', background: '#f8fafc' }}>{lossOfMass}</td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}><input type="number" value={periodicData.abrasion.samples[idx]?.relativeLoss || ''} onChange={(e) => handleAbrasionChange(idx, 'relativeLoss', e.target.value)} style={{ width: '100%', padding: '8px', border: 'none', textAlign: 'center', fontSize: '13px' }} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodicTestingTab;
