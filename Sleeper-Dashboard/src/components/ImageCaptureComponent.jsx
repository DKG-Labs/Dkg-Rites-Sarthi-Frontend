import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

/**
 * ImageCaptureComponent - Ultra-Modern Visual Photo Inspection Component
 * Features:
 * - Live GPS Geolocation tagging with animated radar LED indicator
 * - 5-column responsive grid with frosted-glass hover overlays
 * - Modern typography, curated gradients, and micro-interactions
 * - Fullscreen high-resolution preview with metadata details & direct download
 * - 2MB size limit & 5–10 photo requirement validation
 */
const ImageCaptureComponent = ({ 
  images = [], 
  onImagesChange, 
  minImages = 5, 
  maxImages = 10,
  required = true 
}) => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const showNotification = (message, severity = 'warning') => {
    setNotification({ open: true, message, severity });
    setTimeout(() => {
      setNotification({ open: false, message: '', severity: 'info' });
    }, 4000);
  };

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'GPS Error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'User denied GPS access. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'GPS request timed out.';
            break;
          default:
            errorMessage += 'Unknown GPS error.';
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileChange = (e) => {
    if (!location) {
      showNotification('Please allow GPS location access before capturing images.', 'warning');
      getLocation();
      return;
    }

    let files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length >= maxImages) {
      showNotification(`Maximum limit of ${maxImages} images reached.`, 'warning');
      e.target.value = null;
      return;
    }

    // 2MB size limit per image
    const maxSize = 2 * 1024 * 1024;
    const largeFiles = files.filter(f => f.size > maxSize);
    if (largeFiles.length > 0) {
      showNotification(`Uploaded image exceeded 2MB limit: ${largeFiles.map(f => f.name).join(', ')}`, 'error');
      files = files.filter(f => f.size <= maxSize);
    }

    if (files.length === 0) {
      e.target.value = null;
      return;
    }

    if (images.length + files.length > maxImages) {
      const allowedCount = maxImages - images.length;
      showNotification(`You can only upload up to ${maxImages} images. Adding first ${allowedCount} images.`, 'warning');
      files = files.slice(0, allowedCount);
    }

    const newImages = [...images];
    let loadedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          base64Data: reader.result,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          preview: reader.result
        };
        newImages.push(newImage);
        loadedCount++;
        if (loadedCount === files.length) {
          onImagesChange(newImages);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = null;
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const getImageSrc = (img) => {
    const src = img.preview || img.base64Data;
    if (!src) return null;
    const backendRoot = (API_BASE_URL || '').replace(/\/api\/?$/, '');
    if (src.startsWith('/api/images/')) {
      return `${backendRoot}${src}`;
    }
    if (src.startsWith('/images/')) {
      return `${backendRoot}/api${src}`;
    }
    if (src.includes('blob.core.windows.net')) {
      const filename = src.split('/').pop();
      if (filename) return `${backendRoot}/api/images/${filename}`;
    }
    return src;
  };

  const downloadImage = async (img, index) => {
    const src = img.preview || img.base64Data;
    if (!src) return;
    try {
      let blobUrl;
      let filename = `sleeper_inspection_photo_${index + 1}.jpg`;
      const token = localStorage.getItem('authToken');
      const backendRoot = (API_BASE_URL || '').replace(/\/api\/?$/, '');

      let fetchUrl = null;
      if (src.startsWith('/api/images/')) {
        fetchUrl = `${backendRoot}${src}`;
        const namePart = src.split('/').pop();
        if (namePart) filename = namePart;
      } else if (src.startsWith('/images/')) {
        fetchUrl = `${backendRoot}/api${src}`;
        const namePart = src.split('/').pop();
        if (namePart) filename = namePart;
      } else if (src.includes('blob.core.windows.net')) {
        const namePart = src.split('/').pop();
        if (namePart) {
          fetchUrl = `${backendRoot}/api/images/${namePart}`;
          filename = namePart;
        }
      }

      if (fetchUrl) {
        const response = await fetch(fetchUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      } else {
        const response = await fetch(src);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error('Download error:', err);
      showNotification('Failed to download image', 'error');
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    } catch (e) {
      return ts;
    }
  };

  const getValidation = () => {
    const count = images.length;
    if (count === 0) {
      return {
        isValid: false,
        status: required ? 'warning' : 'info',
        text: `MINIMUM ${minImages} IMAGES REQUIRED`,
        subtext: `0 of ${maxImages} captured`
      };
    }
    if (count < minImages) {
      return {
        isValid: false,
        status: 'warning',
        text: `ADD ${minImages - count} MORE PHOTO${minImages - count > 1 ? 'S' : ''}`,
        subtext: `${count}/${maxImages} captured`
      };
    }
    if (count <= maxImages) {
      return {
        isValid: true,
        status: 'success',
        text: `✓ REQUIREMENT SATISFIED (${count}/${maxImages})`,
        subtext: `Ready for submission`
      };
    }
    return {
      isValid: false,
      status: 'error',
      text: `EXCEEDS LIMIT (${count}/${maxImages})`,
      subtext: `Maximum 10 allowed`
    };
  };

  const val = getValidation();

  return (
    <div className="modern-inspection-capture-card">
      <style>{`
        .modern-inspection-capture-card {
          margin: 22px 0;
          padding: 20px 24px;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .modern-inspection-capture-card:hover {
          box-shadow: 0 8px 26px -4px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03);
          border-color: #cbd5e1;
        }

        /* HEADER */
        .mic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isExpanded ? '18px' : '0'};
          flex-wrap: wrap;
          gap: 16px;
        }

        .mic-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mic-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
          flex-shrink: 0;
        }

        .mic-heading-wrap h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.015em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mic-subtext-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 3px;
          font-size: 0.8rem;
          color: #64748b;
          flex-wrap: wrap;
        }

        .mic-badge-mini {
          font-size: 0.72rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }

        .mic-badge-mini strong {
          color: #0284c7;
        }

        /* RIGHT ACTIONS / STATUS */
        .mic-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .mic-gps-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 0.78rem;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.08);
          letter-spacing: 0.01em;
        }

        .mic-gps-pill.error {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #b91c1c;
        }

        .mic-led {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #22c55e;
          box-shadow: 0 0 10px #22c55e;
          animation: micPulse 1.8s infinite;
        }

        @keyframes micPulse {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .mic-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: all 0.2s ease;
        }

        .mic-status-pill.warning {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #c2410c;
        }

        .mic-status-pill.success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .mic-status-pill.info {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }

        .mic-toggle-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mic-toggle-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        /* EMPTY STATE / DROPZONE */
        .mic-dropzone-modern {
          border: 2px dashed #cbd5e1;
          border-radius: 14px;
          padding: 36px 20px;
          text-align: center;
          background: radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          position: relative;
        }

        .mic-dropzone-modern:hover {
          border-color: #38bdf8;
          background: #f0f9ff;
        }

        .mic-dropzone-icon-circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          font-size: 26px;
          color: #0284c7;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.15);
        }

        .mic-dropzone-title {
          font-weight: 800;
          font-size: 1.05rem;
          color: #0f172a;
          margin-bottom: 6px;
        }

        .mic-dropzone-subtitle {
          font-size: 0.825rem;
          color: #64748b;
          max-width: 480px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .btn-upload-gradient {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 24px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
          transition: all 0.2s ease;
        }

        .btn-upload-gradient:hover {
          background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
        }

        /* 5-COLUMN GALLERY GRID */
        .mic-gallery-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-top: 4px;
        }

        @media (max-width: 1200px) {
          .mic-gallery-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 992px) {
          .mic-gallery-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .mic-gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .mic-photo-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .mic-photo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -4px rgba(15, 23, 42, 0.12);
          border-color: #38bdf8;
        }

        .mic-thumb-container {
          position: relative;
          width: 100%;
          height: 130px;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .mic-thumb-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .mic-photo-card:hover .mic-thumb-container img {
          transform: scale(1.05);
        }

        .mic-photo-card-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          z-index: 2;
        }

        .mic-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 3;
        }

        .mic-photo-card:hover .mic-hover-overlay {
          opacity: 1;
        }

        .mic-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          color: #0f172a;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.15s ease;
        }

        .mic-action-btn:hover {
          transform: scale(1.15);
          background: #f8fafc;
        }

        .mic-action-btn.delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .mic-photo-meta {
          padding: 10px 12px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px solid #f1f5f9;
        }

        .mic-meta-row {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.725rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mic-meta-row strong {
          color: #0f172a;
        }

        .mic-gps-tag {
          color: #0284c7;
          font-family: monospace;
          font-weight: 600;
        }

        /* ADD MORE SLOT */
        .mic-add-card {
          border: 2px dashed #38bdf8;
          border-radius: 12px;
          min-height: 185px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          color: #0284c7;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 8px;
          padding: 16px;
          text-align: center;
        }

        .mic-add-card:hover {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border-color: #0284c7;
          transform: translateY(-3px);
          box-shadow: 0 8px 18px rgba(2, 132, 199, 0.15);
        }

        .mic-plus-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          color: #0284c7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.2);
        }

        /* FULLSCREEN MODAL */
        .mic-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 24px;
        }

        .mic-modal-dialog {
          background: #ffffff;
          border-radius: 18px;
          max-width: 92vw;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          animation: micModalFade 0.2s ease-out;
        }

        @keyframes micModalFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .mic-modal-header {
          padding: 14px 22px;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mic-modal-title {
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mic-modal-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mic-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .mic-modal-img-area {
          background: #020617;
          display: flex;
          justify-content: center;
          align-items: center;
          max-height: 72vh;
          padding: 16px;
        }

        .mic-modal-img-area img {
          max-width: 100%;
          max-height: 68vh;
          object-fit: contain;
          border-radius: 8px;
        }

        .mic-modal-footer {
          padding: 14px 22px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

      {/* Modern Header */}
      <div className="mic-header">
        <div className="mic-title-group">
          <div className="mic-icon-box">
            📷
          </div>
          <div className="mic-heading-wrap">
            <h3>
              Photo Inspection Records
              <span className="mic-badge-mini">
                <strong>{images.length}</strong> / {maxImages} Photos
              </span>
            </h3>
            <div className="mic-subtext-row">
              <span>Enforce location verification and physical photo evidence logs</span>
              <span>•</span>
              <span>Max <strong>{maxImages} images</strong> (2 MB/image)</span>
            </div>
          </div>
        </div>

        <div className="mic-header-right">
          {location ? (
            <div className="mic-gps-pill">
              <span className="mic-led"></span>
              <span>
                <strong>GPS SECURED</strong> | Lat: {location.latitude.toFixed(6)} | Long: {location.longitude.toFixed(6)}
              </span>
            </div>
          ) : (
            <div className={`mic-gps-pill ${locationError ? 'error' : ''}`}>
              <span>{isGettingLocation ? '🔄 FETCHING GPS COORDINATES...' : (locationError ? '❌ GPS ERROR' : '📍 LOCATING...')}</span>
              {locationError && (
                <button 
                  onClick={getLocation} 
                  style={{ marginLeft: '6px', fontSize: '0.72rem', background: 'none', border: 'underline', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <div className={`mic-status-pill ${val.status}`}>
            {val.text}
          </div>

          <button
            type="button"
            className="mic-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {images.length === 0 ? (
            <div className="mic-dropzone-modern">
              <div className="mic-dropzone-icon-circle">
                📸
              </div>
              <div className="mic-dropzone-title">No Photos Uploaded Yet</div>
              <div className="mic-dropzone-subtitle">
                Please capture or upload {minImages} to {maxImages} physical inspection photos. Location metadata & timestamps will be automatically tagged.
              </div>
              <label className="btn-upload-gradient">
                <span>📷 Take / Upload Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          ) : (
            <div className="mic-gallery-grid">
              {images.map((img, idx) => {
                const src = getImageSrc(img);
                return (
                  <div key={idx} className="mic-photo-card">
                    <div className="mic-thumb-container">
                      <span className="mic-photo-card-tag">#{idx + 1}</span>
                      {src ? (
                        <img src={src} alt={`Inspection Photo ${idx + 1}`} loading="lazy" />
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>Loading...</div>
                      )}
                      <div className="mic-hover-overlay">
                        <button 
                          type="button"
                          className="mic-action-btn" 
                          title="View Fullscreen" 
                          onClick={() => setActivePreviewImage({ src, idx, meta: img })}
                        >
                          👁️
                        </button>
                        <button 
                          type="button"
                          className="mic-action-btn" 
                          title="Download Image" 
                          onClick={() => downloadImage(img, idx)}
                        >
                          ⬇️
                        </button>
                        <button 
                          type="button"
                          className="mic-action-btn delete-btn" 
                          title="Delete Image" 
                          onClick={() => removeImage(idx)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mic-photo-meta">
                      <div className="mic-meta-row">
                        <span>🕒</span>
                        <span>{formatTimestamp(img.timestamp) || 'Captured'}</span>
                      </div>
                      <div className="mic-meta-row" title={`${img.latitude || 'N/A'}, ${img.longitude || 'N/A'}`}>
                        <span>📍</span>
                        <span className="mic-gps-tag">
                          {img.latitude ? `${Number(img.latitude).toFixed(4)}, ${Number(img.longitude).toFixed(4)}` : 'No GPS'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {images.length < maxImages && (
                <label className="mic-add-card">
                  <div className="mic-plus-icon-box">➕</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Add More Photos</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>({images.length} / {maxImages} captured)</div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          )}
        </>
      )}

      {/* Fullscreen Preview Modal */}
      {activePreviewImage && (
        <div className="mic-modal-overlay" onClick={() => setActivePreviewImage(null)}>
          <div className="mic-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="mic-modal-header">
              <div className="mic-modal-title">
                <span>📸 Photo #{activePreviewImage.idx + 1}</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>
                  • {formatTimestamp(activePreviewImage.meta?.timestamp)}
                </span>
              </div>
              <button 
                type="button"
                className="mic-modal-close-btn"
                onClick={() => setActivePreviewImage(null)}
              >
                ✕
              </button>
            </div>
            <div className="mic-modal-img-area">
              <img 
                src={activePreviewImage.src} 
                alt="Fullscreen Inspection" 
              />
            </div>
            <div className="mic-modal-footer">
              <div style={{ fontSize: '0.825rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍 <strong>GPS Coordinates:</strong></span>
                <span style={{ fontFamily: 'monospace', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                  Lat: {activePreviewImage.meta?.latitude || 'N/A'}, Long: {activePreviewImage.meta?.longitude || 'N/A'}
                </span>
              </div>
              <button
                type="button"
                className="btn-upload-gradient"
                style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                onClick={() => downloadImage(activePreviewImage.meta, activePreviewImage.idx)}
              >
                ⬇️ Download Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.open && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '10px',
          background: notification.severity === 'error' ? '#ef4444' : (notification.severity === 'success' ? '#10b981' : '#f59e0b'),
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '0.85rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 999999
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ImageCaptureComponent;
