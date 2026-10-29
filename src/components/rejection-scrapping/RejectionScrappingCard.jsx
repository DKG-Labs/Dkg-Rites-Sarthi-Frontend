import { useState, useEffect, useCallback } from 'react';
import { getMappedPlants, getLedger } from '../../services/scrapEntryService';
import ScrapLedgerTable from './ScrapLedgerTable';
import AddScrapEntryModal from './AddScrapEntryModal';
import './RejectionScrapping.css';

export default function RejectionScrappingCard({ ieUserId, ieType }) {
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!ieUserId) return;
    setPlantsLoading(true);
    getMappedPlants(ieUserId, ieType)
      .then(data => {
        setPlants(data);
        // Auto-select only when exactly 1 plant (no choice needed)
        if (data.length === 1) setSelectedPlant(data[0].poiCode);
      })
      .catch(() => setPlants([]))
      .finally(() => setPlantsLoading(false));
  }, [ieUserId, ieType]);

  const loadLedger = useCallback((plant) => {
    if (!plant) return;
    setLedgerLoading(true);
    getLedger(plant, null)
      .then(setLedger)
      .catch(() => setLedger(null))
      .finally(() => setLedgerLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPlant) loadLedger(selectedPlant);
    else setLedger(null);
  }, [selectedPlant, loadLedger]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleAddSuccess = (result) => {
    setShowAddModal(false);
    showToast(`Entry submitted — SV ID: ${result.scrapVerificationId}`);
    loadLedger(selectedPlant);
  };

  const ieLabel = ieType === 'PROCESS_IE' ? 'Process IE' : 'Main IE';

  return (
    <div className="rs-wrapper">

      {/* Top bar */}
      <div className="rs-topbar">
        <div className="rs-title-block">
          <h2 className="rs-title">
            <span className="rs-title-icon">🗑️</span>
            Rejection &amp; Scrapping
          </h2>
          <p className="rs-subtitle">{ieLabel} — Track and record the scrapping of rejected pieces</p>
        </div>
        {selectedPlant && (
          <button className="rs-add-btn" onClick={() => setShowAddModal(true)}>
            + Add Scrapping Entry
          </button>
        )}
      </div>

      {/* Controls panel */}
      <div className="rs-controls-panel">
        <div className="rs-controls">
          <div className="rs-plant-block">
            <span className="rs-label">Plant / POI</span>
            {plantsLoading ? (
              <div className="rs-skeleton-select" />
            ) : plants.length === 0 ? (
              <div className="rs-no-plants">⚠️ No mapped plants found for this IE</div>
            ) : plants.length === 1 ? (
              <div className="rs-plant-chip">
                <span className="rs-plant-chip-name">
                  {plants[0].companyName || plants[0].poiCode}
                  {plants[0].unitName ? ` — ${plants[0].unitName}` : ''}
                </span>
                <span className="rs-plant-chip-code">{plants[0].poiCode}</span>
              </div>
            ) : (
              <select
                className="rs-select"
                value={selectedPlant}
                onChange={e => setSelectedPlant(e.target.value)}
              >
                <option value="">— Select Plant —</option>
                {plants.map(p => {
                  const label = p.companyName
                    ? `${p.companyName}${p.unitName ? ` — ${p.unitName}` : ''} (${p.poiCode})`
                    : p.poiCode;
                  return <option key={p.poiCode} value={p.poiCode}>{label}</option>;
                })}
              </select>
            )}
          </div>

          {ledger && (
            <div className="rs-kpi-row">
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Rejected</div>
                <div className={`rs-kpi-value ${ledger.totalRejected > 0 ? 'red' : 'green'}`}>
                  {ledger.totalRejected ?? 0}
                </div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Scrapped</div>
                <div className="rs-kpi-value green">{ledger.totalScrapped ?? 0}</div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Pending Balance</div>
                <div className={`rs-kpi-value ${ledger.pendingBalance > 0 ? 'orange' : 'green'}`}>
                  {ledger.pendingBalance ?? 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger card */}
      <div className="rs-card">
        {!selectedPlant ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">🏭</span>
            <span className="rs-prompt-text">Select a plant above to view the rejection &amp; scrapping ledger</span>
          </div>
        ) : (
          <ScrapLedgerTable
            rows={ledger?.rows}
            loading={ledgerLoading}
            ieUserId={ieUserId}
            onRefresh={() => loadLedger(selectedPlant)}
          />
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddScrapEntryModal
          poiCode={selectedPlant}
          ieUserId={ieUserId}
          ieType={ieType}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`rs-toast ${toast.type}`}>
          <span className="rs-toast-icon">{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.msg}</span>
          <button className="rs-toast-close" onClick={() => setToast(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
