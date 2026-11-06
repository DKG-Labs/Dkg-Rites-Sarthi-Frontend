import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getSleeperBasket,
  getSleeperLedger,
  getSleeperScrapVerification,
} from '../../services/sleeperScrapService';
import SleeperScrapLedgerTable from './SleeperScrapLedgerTable';
import SleeperScrapEntryModal from './SleeperScrapEntryModal';
import { exportExcel, exportPdf } from './basketExport';
import './RejectionScrapping.css';

const normPlant = (v) => String(v || '').trim().replace(/^:+/, '');

/**
 * Rejection & Disposal for Concrete Sleepers (Process IE and Main IE).
 * Same layout and notifications as the ERC Rejection & Disposal card; disposal is recorded per sleeper.
 */
export default function SleeperRejectionDisposal() {
  const roleName = localStorage.getItem('roleName') || '';
  const ieLabel = /process/i.test(roleName) ? 'Process IE' : 'Main IE';

  const [plants, setPlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    setPlantsLoading(true);
    setPlantsError('');
    getSleeperBasket()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPlants(list);
        const duty = normPlant(localStorage.getItem('dutyUnit'));
        if (duty && list.some(p => p.plantId === duty)) setSelectedPlant(duty);
        else if (list.length === 1) setSelectedPlant(list[0].plantId); // no choice needed
      })
      .catch(e => {
        // A failed load is not "no plants": say so instead of showing an empty state
        setPlants([]);
        setPlantsError(e.message || 'Could not load plants');
        showToast(`Could not load plants — ${e.message || 'please try again'}`, 'error');
      })
      .finally(() => setPlantsLoading(false));
  }, [showToast]);

  // The ledger response also carries the pending sleepers, so one request loads the whole screen
  const loadPlantData = useCallback((plant) => {
    if (!plant) return;
    setLedgerLoading(true);
    setLedgerError('');
    getSleeperLedger(plant)
      .then(setLedger)
      .catch(e => {
        setLedger(null);
        setLedgerError(e.message || 'Could not load the ledger');
        showToast(e.message || 'Could not load the ledger', 'error');
      })
      .finally(() => setLedgerLoading(false));
  }, [showToast]);

  useEffect(() => {
    if (selectedPlant) loadPlantData(selectedPlant);
    else { setLedger(null); setLedgerError(''); }
  }, [selectedPlant, loadPlantData]);

  const pending = ledger?.pendingSleepers || null;
  const unidentified = ledger?.unidentifiedDefects || 0;

  const plantObj = useMemo(() => plants.find(p => p.plantId === selectedPlant), [plants, selectedPlant]);
  const plantLabel = plantObj
    ? `${plantObj.manufacturer || plantObj.plantId}${plantObj.placeOfInspection ? ` — ${plantObj.placeOfInspection}` : ''}`
    : selectedPlant;
  const canScrap = Boolean(ledger?.canScrap ?? plantObj?.canScrap);

  const handleAddSuccess = (result) => {
    setShowAddModal(false);
    showToast(`Entry submitted — SV ID: ${result?.verificationNo || 'Recorded'} (${result?.qtyScrapped ?? ''} sleepers)`);
    loadPlantData(selectedPlant);
  };

  const handleEditClick = async (row) => {
    try {
      setEditEntry(await getSleeperScrapVerification(row.verificationId));
    } catch (e) {
      showToast(e.message || 'Could not load entry details', 'error');
    }
  };

  const handleEditSuccess = (result) => {
    setEditEntry(null);
    showToast(`Disposal entry ${result?.verificationNo || ''} updated successfully.`);
    loadPlantData(selectedPlant);
  };

  const handleExport = (kind) => {
    const rows = (ledger?.rows || []).filter(r => !(r.rowType === 'REJECTION' && !r.rejectedQty));
    if (!rows.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const title = `Sleeper Rejection & Disposal Ledger - ${plantLabel}`;
    const subtitle = `Total Rejected: ${ledger?.totalRejected ?? 0} | Total Disposed: ${ledger?.totalScrapped ?? 0} | Pending Balance: ${ledger?.pendingBalance ?? 0}`;
    const cols = [
      { header: 'Date', value: r => r.entryDate || '-' },
      { header: 'Transaction', value: r => r.transactionType || (r.rowType === 'REJECTION' ? 'Rejection' : 'Scrap Verification') },
      { header: 'Batch & Ref.', value: r => [r.batchNo && `Batch ${r.batchNo}`, r.rowType === 'SCRAP' ? r.scrapVerificationId : null].filter(Boolean).join(' / ') || '-' },
      { header: 'Sleeper IDs Involved', value: r => (r.sleeperIds || []).join(', ') || '-' },
      { header: 'Rejected (+)', value: r => (r.rowType === 'REJECTION' ? r.rejectedQty : '-') },
      { header: 'Scrapped (-)', value: r => (r.rowType === 'SCRAP' ? r.scrappedQty : '-') },
      { header: 'Running Pending Balance', value: r => r.pendingBalance ?? '-' },
      { header: 'Shift', value: r => r.shift || '-' },
      { header: 'Engineer', value: r => r.ieName || '-' },
    ];
    const file = `Sleeper_Disposal_${selectedPlant.replace(/[^A-Za-z0-9]+/g, '_')}_${stamp}`;
    if (kind === 'pdf') exportPdf(file, title, subtitle, cols, rows);
    else exportExcel(file, title, cols, rows);
  };

  const goHome = () => window.dispatchEvent(new CustomEvent('navigate', { detail: { target: 'Main Dashboard' } }));

  return (
    <div className="rs-wrapper">

      {/* Top bar */}
      <div className="rs-topbar">
        <div className="rs-title-block">
          <h2 className="rs-title">
            <button type="button" className="rs-back-btn" onClick={goHome} title="Back to Dashboard">←</button>
            <span className="rs-title-icon">🗑️</span>
            Rejection &amp; Disposal
          </h2>
          <p className="rs-subtitle rs-subtitle-back">{ieLabel} — Track and record the disposal of rejected sleepers</p>
        </div>
        <div className="rs-top-actions">
          {ledger && (ledger.rows || []).length > 0 && (
            <>
              <button type="button" className="rs-export-btn" onClick={() => handleExport('excel')} title="Export ledger to Excel">📊 Excel</button>
              <button type="button" className="rs-export-btn" onClick={() => handleExport('pdf')} title="Export ledger to PDF">📄 PDF</button>
            </>
          )}
          {selectedPlant && canScrap && (
            <button className="rs-add-btn" onClick={() => setShowAddModal(true)} disabled={ledgerLoading || !pending || pending.length === 0}
              title={(pending || []).length === 0 ? 'No sleepers pending for scrapping' : 'Initiate scrap verification'}>
              + Add Disposal Entry
            </button>
          )}
        </div>
      </div>

      {/* Controls panel */}
      <div className="rs-controls-panel">
        <div className="rs-controls">
          <div className="rs-plant-block">
            <span className="rs-label">Plant / POI</span>
            {plantsLoading ? (
              <div className="rs-skeleton-select" />
            ) : plantsError ? (
              <div className="rs-no-plants">⚠️ Unable to load plants — {plantsError}</div>
            ) : plants.length === 0 ? (
              <div className="rs-no-plants">⚠️ No mapped plants found for this IE</div>
            ) : plants.length === 1 ? (
              <div className="rs-plant-chip">
                <span className="rs-plant-chip-name">
                  {plants[0].manufacturer || plants[0].plantId}
                  {plants[0].placeOfInspection ? ` — ${plants[0].placeOfInspection}` : ''}
                </span>
                <span className="rs-plant-chip-code">{plants[0].plantId}</span>
              </div>
            ) : (
              <select className="rs-select" value={selectedPlant} onChange={e => setSelectedPlant(e.target.value)}>
                <option value="">— Select Plant —</option>
                {plants.map(p => {
                  const label = p.manufacturer
                    ? `${p.manufacturer}${p.placeOfInspection ? ` — ${p.placeOfInspection}` : ''} (${p.plantId})`
                    : p.plantId;
                  return <option key={p.plantId} value={p.plantId}>{label}</option>;
                })}
              </select>
            )}
          </div>

          {ledger && (
            <div className="rs-kpi-row">
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Rejected</div>
                <div className={`rs-kpi-value ${ledger.totalRejected > 0 ? 'red' : 'green'}`}>{ledger.totalRejected ?? 0}</div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Total Disposed</div>
                <div className="rs-kpi-value green">{ledger.totalScrapped ?? 0}</div>
              </div>
              <div className="rs-kpi">
                <div className="rs-kpi-label">Pending Balance</div>
                <div className={`rs-kpi-value ${ledger.pendingBalance > 0 ? 'orange' : 'green'}`}>{ledger.pendingBalance ?? 0}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {unidentified > 0 && (
        <div className="rs-warn-box">
          <span>⚠️</span>
          <span>
            {unidentified} demoulding defect record{unidentified === 1 ? '' : 's'} for this plant
            {unidentified === 1 ? ' has' : ' have'} no bench number, so the sleeper ID cannot be identified and
            {unidentified === 1 ? ' it is' : ' they are'} not in the basket. Please correct the demoulding inspection entry.
          </span>
        </div>
      )}

      {/* Ledger card */}
      <div className="rs-card">
        {!selectedPlant ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">🏭</span>
            <span className="rs-prompt-text">Select a plant above to view the rejection &amp; disposal ledger</span>
          </div>
        ) : ledgerError && !ledgerLoading ? (
          <div className="rs-prompt">
            <span className="rs-prompt-icon">⚠️</span>
            <span className="rs-prompt-text">Unable to load the ledger — {ledgerError}</span>
            <button type="button" className="rs-btn rs-btn-ghost rs-btn-xs" onClick={() => loadPlantData(selectedPlant)}>Retry</button>
          </div>
        ) : (
          <SleeperScrapLedgerTable
            rows={ledger?.rows}
            loading={ledgerLoading}
            readOnly={!canScrap}
            onRefresh={() => loadPlantData(selectedPlant)}
            onEdit={handleEditClick}
            onToast={showToast}
            pendingSleepers={pending}
            pendingLoading={ledgerLoading}
          />
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <SleeperScrapEntryModal
          mode="add"
          plantId={selectedPlant}
          plantLabel={plantLabel}
          pendingSleepers={pending}
          defaultShift={localStorage.getItem('selectedShift') || ''}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit modal */}
      {editEntry && (
        <SleeperScrapEntryModal
          mode="edit"
          plantId={selectedPlant}
          plantLabel={plantLabel}
          pendingSleepers={pending}
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSuccess={handleEditSuccess}
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
