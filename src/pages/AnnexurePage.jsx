import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import ChemicalAnalysisAnnexureAdvanced from '../components/annexures/ChemicalAnalysisAnnexureAdvanced';
import DimensionAnnexure from '../components/annexures/DimensionAnnexure';
import FinalInspectionAnnexure from '../components/annexures/FinalInspectionAnnexure';
import FinalChemicalAnalysisAnnexure from '../components/annexures/FinalChemicalAnalysisAnnexure';
import InclusionRatingAnnexure from '../components/annexures/InclusionRatingAnnexure';
import HardnessTestAnnexure from '../components/annexures/HardnessTestAnnexure';
import DimensionTestAnnexure from '../components/annexures/DimensionTestAnnexure';
import ApplicationDeflectionAnnexure from '../components/annexures/ApplicationDeflectionAnnexure';
import ToeLoadTestAnnexure from '../components/annexures/ToeLoadTestAnnexure';
import WeightTestAnnexure from '../components/annexures/WeightTestAnnexure';
import InspectionTestPlanAnnexure from '../components/annexures/InspectionTestPlanAnnexure';
import { SAMPLE_CHEMICAL_ANALYSIS_DATA, SAMPLE_DIMENSION_DATA, SAMPLE_FINAL_INSPECTION_DATA, SAMPLE_FINAL_CHEMICAL_ANALYSIS_DATA, SAMPLE_INCLUSION_RATING_DATA, fetchAnnexureData } from '../data/annexureData';
import './AnnexurePage.css';

/**
 * Annexure Page - Main page to view all annexures
 * Displays list of available annexures and allows viewing them
 */

const AnnexurePage = ({ onBack }) => {
  const [selectedAnnexure, setSelectedAnnexure] = useState(null);
  const [annexureData, setAnnexureData] = useState({
    'chemical-analysis': SAMPLE_CHEMICAL_ANALYSIS_DATA,
    'dimensional-check': SAMPLE_DIMENSION_DATA,
    'final-inspection': SAMPLE_FINAL_INSPECTION_DATA,
    'final-chemical-analysis': SAMPLE_FINAL_CHEMICAL_ANALYSIS_DATA,
    'inclusion-rating': SAMPLE_INCLUSION_RATING_DATA
  });
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const annexureRef = useRef(null);

  // List of available annexures
  const annexureList = [
    {
      id: 'inspection-test-plan',
      title: 'Inspection & Test Plan',
      subtitle: 'Complete Inspection & Test Plan for Elastic Rail Clip MK-III/MK-V',
      code: 'Pages 1-8 of 18',
      icon: '📑',
      component: InspectionTestPlanAnnexure
    },
    {
      id: 'chemical-analysis',
      title: 'Chemical Analysis',
      subtitle: 'Stage Inspection for Raw material - Test Result: Chemical Analysis',
      code: 'Annexure-I',
      icon: '🧪',
      component: ChemicalAnalysisAnnexureAdvanced
    },
    // Add more annexures here as they are created
    {
      id: 'dimensional-check',
      title: 'Dimensional Check',
      subtitle: 'Stage Inspection for Raw material - Test Result: Dimension',
      code: 'Annexure-II',
      icon: '📏',
      component: DimensionAnnexure
    },
    {
      id: 'final-inspection',
      title: 'Final Inspection Report',
      subtitle: 'Final Inspection Report - Dimensions (in mm)',
      code: 'Annexure-III',
      icon: '📋',
      component: FinalInspectionAnnexure
    },
    {
      id: 'final-chemical-analysis',
      title: 'Final Chemical Analysis',
      subtitle: 'Final Inspection Report - Test Result: Chemical Analysis',
      code: 'Annexure-VI',
      icon: '🧪',
      component: FinalChemicalAnalysisAnnexure
    },
    {
      id: 'inclusion-rating',
      title: 'Inclusion Rating & Depth of Decarb',
      subtitle: 'Final Inspection Report - Test Result: Inclusion Rating, Depth of Decarb',
      code: 'Annexure-VII',
      icon: '🔬',
      component: InclusionRatingAnnexure
    },
    {
      id: 'hardness-test',
      title: 'Hardness Test',
      subtitle: 'Final Inspection Report - Test Result: Hardness Test',
      code: 'Annexure-VIII',
      icon: '💎',
      component: HardnessTestAnnexure
    },
    {
      id: 'dimension-test',
      title: 'Dimension Test',
      subtitle: 'Final Inspection Report - Test Result: Dimension test',
      code: 'Annexure-IX',
      icon: '📐',
      component: DimensionTestAnnexure
    },
    {
      id: 'application-deflection',
      title: 'Application & Deflection Test',
      subtitle: 'Final Inspection Report - Test Result: Application & Deflection test',
      code: 'Annexure-X',
      icon: '⚙️',
      component: ApplicationDeflectionAnnexure
    },
    {
      id: 'toe-load-test',
      title: 'Toe Load Test',
      subtitle: 'Final Inspection Report - Test Result: Toe load test',
      code: 'Annexure-XI',
      icon: '🔩',
      component: ToeLoadTestAnnexure
    },
    {
      id: 'weight-test',
      title: 'Weight Test',
      subtitle: 'Final Inspection Report - Test Result: Weight Test',
      code: 'Annexure-XV',
      icon: '⚖️',
      component: WeightTestAnnexure
    }
  ];

  const handleViewAnnexure = async (annexure) => {
    setSelectedAnnexure(annexure);

    // Load data if not already loaded
    if (!annexureData[annexure.id]) {
      setLoading(true);
      try {
        const data = await fetchAnnexureData(annexure.id);
        setAnnexureData(prev => ({
          ...prev,
          [annexure.id]: data
        }));
      } catch (error) {
        console.error('Error loading annexure data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackToList = () => {
    setSelectedAnnexure(null);
  };

  const handlePrint = () => {
    window.print();
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
      // Get current date for filename
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const filename = `${selectedAnnexure.code}_${dateStr}.pdf`;

      // Find the actual annexure component (not the wrapper)
      // Support both old annexure classes and new annexure-layout class
      const annexureElement = annexureRef.current.querySelector(
        '.chemical-analysis-annexure, .dimension-annexure, .final-inspection-annexure, .final-chemical-analysis-annexure, .inclusion-rating-annexure, .inspection-test-plan-annexure, .annexure-layout'
      );

      if (!annexureElement) {
        showNotification('Unable to find annexure content. Please try again.', 'error');
        setPdfGenerating(false);
        return;
      }

      // A4 landscape dimensions in mm
      const pdfWidth = 297;
      const pdfHeight = 210;
      const margin = 8;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - (margin * 2);

      // Set fixed width and hide scrollbars for consistent rendering
      const originalWidth = annexureElement.style.width;
      const originalOverflow = annexureElement.style.overflow;
      annexureElement.style.width = '1100px';
      annexureElement.style.overflow = 'visible';

      // Hide all scrollbars in the element
      const tableWrappers = annexureElement.querySelectorAll('.annexure-table-wrapper');
      const originalWrapperStyles = [];
      tableWrappers.forEach((wrapper, index) => {
        originalWrapperStyles[index] = {
          overflow: wrapper.style.overflow,
          overflowX: wrapper.style.overflowX,
          overflowY: wrapper.style.overflowY
        };
        wrapper.style.overflow = 'visible';
        wrapper.style.overflowX = 'visible';
        wrapper.style.overflowY = 'visible';
      });

      // Use dom-to-image-more for better CSS transform support
      const dataUrl = await domtoimage.toPng(annexureElement, {
        quality: 1,
        width: 1100,
        height: annexureElement.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '1100px',
          maxWidth: '1100px',
          overflow: 'visible'
        },
        filter: (node) => {
          // Filter out buttons and navigation
          if (node.tagName === 'BUTTON' || node.classList?.contains('annexure-page__back-button')) {
            return false;
          }
          return true;
        }
      });

      // Restore original styles
      annexureElement.style.width = originalWidth;
      annexureElement.style.overflow = originalOverflow;
      tableWrappers.forEach((wrapper, index) => {
        wrapper.style.overflow = originalWrapperStyles[index].overflow;
        wrapper.style.overflowX = originalWrapperStyles[index].overflowX;
        wrapper.style.overflowY = originalWrapperStyles[index].overflowY;
      });

      // Wait for image to load
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions to fit the image into PDF page
          const imgWidth = contentWidth;
          const imgHeight = (img.height * imgWidth) / img.width;

          // Create PDF
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
            compress: true
          });

          // If image height is greater than content height, scale it down
          if (imgHeight > contentHeight) {
            const scaledWidth = (img.width * contentHeight) / img.height;
            const scaledHeight = contentHeight;
            const xOffset = margin + (contentWidth - scaledWidth) / 2;
            pdf.addImage(dataUrl, 'PNG', xOffset, margin, scaledWidth, scaledHeight);
          } else {
            // Center vertically if smaller than page
            const yOffset = margin + (contentHeight - imgHeight) / 2;
            pdf.addImage(dataUrl, 'PNG', margin, yOffset, imgWidth, imgHeight);
          }

          // Save the PDF
          pdf.save(filename);
          resolve();
        };
        img.onerror = reject;
        img.src = dataUrl;
      });

      showNotification('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Failed to generate PDF. Please try again.', 'error');
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
        {/* Notification */}
        {notification && (
          <div className={`notification notification--${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* PDF Generating Overlay */}
        {pdfGenerating && (
          <div className="pdf-generating-overlay">
            <div className="pdf-generating-content">
              <div className="loading-spinner"></div>
              <p>Generating PDF...</p>
            </div>
          </div>
        )}

        <div className="annexure-header-bar no-print">
          <div className="annexure-header-left">
            <button className="btn-back" onClick={handleBackToList}>
              ← Back to Annexure List
            </button>
            <div className="annexure-header-info-bar">
              <span className="annexure-code-badge">{selectedAnnexure.code}</span>
              <span className="annexure-title-bar">{selectedAnnexure.title}</span>
            </div>
          </div>
          <div className="annexure-header-actions">
            <button className="btn-action" onClick={handlePrint} disabled={pdfGenerating}>
              🖨️ Print
            </button>
            <button className="btn-action" onClick={handleExportPDF} disabled={pdfGenerating}>
              📄 Export PDF
            </button>
          </div>
        </div>

        <div className="annexure-content" ref={annexureRef}>
          {loading ? (
            <div className="annexure-loading">
              <div className="loading-spinner"></div>
              <p>Loading annexure data...</p>
            </div>
          ) : (
            <AnnexureComponent data={annexureData[selectedAnnexure.id] || []} />
          )}
        </div>
      </div>
    );
  }

  // Show list of annexures
  return (
    <div className="annexure-page">
      <div className="annexure-page-header">
        <div>
          <h1 className="annexure-page-title">📋 Annexures</h1>
          <p className="annexure-page-subtitle">
            View and manage inspection annexures and test reports
          </p>
        </div>
        <button className="btn-outline" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="annexure-grid">
        {annexureList.map((annexure) => (
          <div
            key={annexure.id}
            className={`annexure-card ${!annexure.component ? 'disabled' : ''}`}
            onClick={() => annexure.component && handleViewAnnexure(annexure)}
          >
            <div className="annexure-card-icon">{annexure.icon}</div>
            <div className="annexure-card-content">
              <div className="annexure-card-header">
                <h3 className="annexure-card-title">{annexure.title}</h3>
                <span className="annexure-card-code">{annexure.code}</span>
              </div>
              <p className="annexure-card-subtitle">{annexure.subtitle}</p>
              {!annexure.component && (
                <span className="annexure-card-badge">Coming Soon</span>
              )}
            </div>
            {annexure.component && (
              <div className="annexure-card-action">
                <span className="annexure-card-arrow">→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="annexure-info-section">
        <h3 className="annexure-info-title">ℹ️ About Annexures</h3>
        <div className="annexure-info-content">
          <p>
            Annexures are standardized inspection and test report templates used for documenting
            various stages of quality control and inspection processes.
          </p>
          <ul>
            <li>Each annexure follows a specific format as per inspection standards</li>
            <li>Data can be populated automatically from API or database</li>
            <li>All headings are in <strong>black</strong>, dynamic data appears in <strong style={{ color: '#dc2626' }}>red</strong></li>
            <li>Layouts are responsive and adapt to data volume</li>
            <li>Print-ready format for official documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnnexurePage;

