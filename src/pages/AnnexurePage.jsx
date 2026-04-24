import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import InclusionRatingAnnexure from '../components/annexures/InclusionRatingAnnexure';
import ApplicationDeflectionAnnexure from '../components/annexures/ApplicationDeflectionAnnexure';
import { useInspection } from '../context/InspectionContext';
import { captureElementToPdfBlob } from '../utils/annexurePdfUtils';
import { ANNEXURE_LIST } from '../data/annexureList';
import { fetchAnnexureData } from '../data/annexureData';
import { annexureService } from '../services/annexureService';
import AnnexureLoader from '../components/annexures/AnnexureLoader';
import { getAnnexureErrorMessage } from '../utils/annexureErrorHandlers';
import './AnnexurePage.css';

/**
 * Annexure Page - Main page to view all annexures
 * Displays list of available annexures and allows viewing them
 */

// Use the centralized list outside to avoid re-renders
const annexureList = ANNEXURE_LIST.map(a => {
  if (a.id === 'inclusion-rating') return { ...a, component: InclusionRatingAnnexure };
  if (a.id === 'application-deflection') return { ...a, component: ApplicationDeflectionAnnexure };
  return a;
});

const AnnexurePage = ({ onBack }) => {
  const { selectedCall } = useInspection();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type');

  const [selectedAnnexure, setSelectedAnnexure] = useState(null);
  const [annexureData, setAnnexureData] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const annexureRef = useRef(null);
  const lastLoadedType = useRef(null);
  const fetchingRef = useRef(null);

  // Single Source of Truth: URL Logic
  useEffect(() => {
    const syncStateWithUrl = async () => {
      // CASE 1: Back to list
      if (!typeParam) {
        if (selectedAnnexure) {
          setSelectedAnnexure(null);
          lastLoadedType.current = null;
          fetchingRef.current = null;
        }
        return;
      }

      // CASE 2: New Annexure Selection or Page Load
      const currentAnnexureId = selectedAnnexure?.id;
      const isNewType = typeParam && (currentAnnexureId !== typeParam || lastLoadedType.current !== typeParam);
      
      if (isNewType) {
        // PREVENT DOUBLE FETCH (Strict Mode or Rapid Clicks)
        if (fetchingRef.current === typeParam) return;

        const annexure = annexureList.find(a => a.id === typeParam);
        if (!annexure) {
          setSelectedAnnexure(null);
          return;
        }

        setSelectedAnnexure(annexure);
        
        // Check if data already exists to avoid refetching
        if (annexureData[typeParam] && lastLoadedType.current === typeParam) {
           return;
        }

        setLoading(true);
        fetchingRef.current = typeParam;
        lastLoadedType.current = typeParam;
        
        console.log(`[Annexure] Fetching data for ${typeParam} (Call: ${selectedCall?.call_no})`);
        
        try {
          let data;
          if (typeParam === 'chemical-analysis' && selectedCall?.call_no) {
            data = await annexureService.getChemicalAnalysis(selectedCall.call_no);
          } else if (typeParam === 'dimensional-check' && selectedCall?.call_no) {
            data = await annexureService.getDimensionalCheck(selectedCall.call_no);
          } else if (typeParam === 'final-chemical-analysis' && selectedCall?.call_no) {
            const response = await annexureService.getFinalChemicalAnalysis(selectedCall.call_no);
            data = response?.responseData || response || [];
          } else if (typeParam === 'hardness-test' && selectedCall?.call_no) {
            data = await annexureService.getFinalHardnessTest(selectedCall.call_no);
          } else if (typeParam === 'toe-load-test' && selectedCall?.call_no) {
            data = await annexureService.getFinalToeLoadTest(selectedCall.call_no);
          } else if (typeParam === 'weight-test' && selectedCall?.call_no) {
            data = await annexureService.getFinalWeightTest(selectedCall.call_no);
          } else if (typeParam === 'dimension-test' && selectedCall?.call_no) {
            const response = await annexureService.getFinalDimensionalInspection(selectedCall.call_no);
            data = response?.responseData || response || [];
          } else if (typeParam === 'final-inspection' && selectedCall?.call_no) {
             // Annexure-III logic
             data = await annexureService.getDimensionalCheck(selectedCall.call_no); // Fallback for now if same
          } else if (typeParam === 'inclusion-rating' && selectedCall?.call_no) {
            const response = await annexureService.getFinalInclusion(selectedCall.call_no);
            data = response?.responseData || response || [];
          } else if (typeParam === 'application-deflection' && selectedCall?.call_no) {
            const response = await annexureService.getFinalApplicationDeflection(selectedCall.call_no);
            data = response?.responseData || response || [];
          } else if (typeParam === 'process-inspection' && selectedCall?.call_no) {
            const response = await annexureService.getFinalInclusion(selectedCall.call_no);
            data = response?.responseData || response || [];
          } else {
            data = await fetchAnnexureData(typeParam);
          }

          setAnnexureData(prev => ({ ...prev, [typeParam]: data }));
        } catch (error) {
          const friendlyMessage = getAnnexureErrorMessage(error);
          showNotification(friendlyMessage, 'error');
          setAnnexureData(prev => ({ ...prev, [typeParam]: [] }));
        } finally {
          setLoading(false);
          fetchingRef.current = null;
        }
      }
    };

    syncStateWithUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam, selectedCall]); // Only re-run if URL param or call changes

  // Handlers now only update the URL
  const handleSelectAnnexure = (annexure) => {
    setSearchParams({ type: annexure.id });
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleExportPDF = async () => {
    if (!annexureRef.current || !selectedAnnexure) {
      showNotification('Unable to generate PDF. Please try again.', 'error');
      return;
    }

    setPdfGenerating(true);

    try {
      const annexureElement = annexureRef.current;
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `${selectedAnnexure.code}_${selectedCall?.call_no || 'report'}_${dateStr}.pdf`;

      const pdfBlob = await captureElementToPdfBlob(annexureElement, {
        filename,
        orientation: 'landscape'
      });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      showNotification('PDF exported successfully!');
    } catch (error) {
      const friendlyMessage = getAnnexureErrorMessage(error);
      showNotification(friendlyMessage, 'error');
    } finally {
      setPdfGenerating(false);
    }
  };


  // If an annexure is selected, show it
  if (selectedAnnexure) {
    const AnnexureComponent = selectedAnnexure.component;

    if (!AnnexureComponent) {
      return (
        <div className="annexure-page">
          <div className="annexure-header-bar">
            <button className="btn-back" onClick={handleBackToList}>
              ← Back to Annexure List
            </button>
          </div>
          <div className="annexure-not-available">
            <h2>Annexure Not Available</h2>
            <p>This annexure is not yet implemented.</p>
            <button className="btn-primary" onClick={handleBackToList}>
              Back to List
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="annexure-page">
        {notification && (
          <div className={`notification notification--${notification.type}`}>
            {notification.message}
          </div>
        )}

        {pdfGenerating && (
          <AnnexureLoader 
            title="Generating PDF" 
            subtitle="Preparing high-quality certificate export..." 
          />
        )}

        <div className="annexure-view-header no-print">
          <div className="header-section-left">
            <button className="breadcrumb-item" onClick={handleBackToList}>
              <span className="breadcrumb-icon">←</span>
              <span className="breadcrumb-text">Back to Reports</span>
            </button>
          </div>

          <div className="view-title-group">
            <span className="view-badge">{selectedAnnexure.code}</span>
            <h2 className="view-title">{selectedAnnexure.title}</h2>
          </div>

          <div className="header-actions">
            <button className="btn-action-premium" onClick={handleExportPDF} disabled={pdfGenerating}>
              {pdfGenerating ? (
                <span className="loading-dots">Generating...</span>
              ) : (
                <>
                  <span className="action-icon">📄</span> Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        <div className="annexure-content" ref={annexureRef}>
          {loading ? (
            <AnnexureLoader 
              title="Loading Report" 
              subtitle="Fetching secure IC data from Sarthi..." 
              fullScreen={false}
            />
          ) : (
            <AnnexureComponent
              data={annexureData[selectedAnnexure.id] || []}
              selectedCall={selectedCall}
            />
          )}
        </div>
      </div>
    );
  }

  // Filtering Logic based on Call Prefix
  const getFilteredAnnexures = () => {
    if (!selectedCall || !selectedCall.call_no) return annexureList;

    const prefix = selectedCall.call_no.substring(0, 2).toUpperCase();

    if (prefix === 'ER') {
      // ER Prefix (Raw Material): ITP, Annexure-I, Annexure-II
      return annexureList.filter(a =>
        a.id === 'inspection-test-plan' ||
        a.code === 'Annexure-I' ||
        a.code === 'Annexure-II'
      );
    }

    if (prefix === 'EF') {
      // EF Prefix (Final): ITP, III, VI, VII, VIII, IX, X, XI, XV
      const finalCodes = ['Annexure-III', 'Annexure-VI', 'Annexure-VII', 'Annexure-VIII', 'Annexure-IX', 'Annexure-X', 'Annexure-XI', 'Annexure-XV'];
      return annexureList.filter(a =>
        a.id === 'inspection-test-plan' ||
        finalCodes.includes(a.code)
      );
    }

    if (prefix === 'EP') {
      // EP Prefix (Process Inspection): Process Inspection Register (F/ERC-01)
      return annexureList.filter(a => a.id === 'process-inspection');
    }

    // Fallback: show all
    return annexureList;
  };

  const filteredAnnexures = getFilteredAnnexures();

  // Show list of annexures
  return (
    <div className="annexure-page">
      <div className="annexure-page-header">
        <div className="header-top-row">
          <div className="annexure-title-block">
            <h1 className="annexure-page-title">Annexures</h1>
          </div>

          <div className="annexure-nav-breadcrumb no-print">
            <button className="breadcrumb-item" onClick={onBack}>
              <span className="breadcrumb-icon">←</span>
              <span className="breadcrumb-text">Back to IC & Annexures</span>
            </button>
          </div>
        </div>

        {selectedCall && (
          <div className="modern-info-bar">
            <div className="info-card">
              <span className="info-label">VENDER NAME</span>
              <span className="info-value">{selectedCall.vendor_name || 'N/A'}</span>
            </div>
            <div className="info-card">
              <span className="info-label">CALL NO</span>
              <span className="info-value highlight">{selectedCall.call_no}</span>
            </div>
            <div className="info-card">
              <span className="info-label">DATE</span>
              <span className="info-value">15/04/2026</span>
            </div>
            <div className="info-card">
              <span className="info-label">PRODUCT TYPE</span>
              <span className="info-value">{selectedCall.product_type}</span>
            </div>
          </div>
        )}
      </div>

      <div className="annexure-grid">
        {filteredAnnexures.map((annexure) => (
          <div 
            key={annexure.id} 
            className="modern-annexure-card"
            onClick={() => handleSelectAnnexure(annexure)}
          >
            <div className={`icon-circle ${annexure.category}`}>
              {annexure.icon}
            </div>
            <div className="card-content">
              <h3 className="annexure-card-title">{annexure.cardTitle}</h3>
              <p className="annexure-card-code">{annexure.code}</p>
            </div>
            <button className="btn-view-annexure">View Report</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnexurePage;
