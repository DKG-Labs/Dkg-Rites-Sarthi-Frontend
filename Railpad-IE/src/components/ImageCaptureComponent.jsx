import React, { useState, useEffect } from 'react';
import { getBaseUrl } from '../services/apiConfig';

/**
 * ImageCaptureComponent - Captures and uploads inspection images with GPS geolocation & timestamps.
 * Parity with ERC inspection capture with custom clean styling, 5-column grid, fullscreen preview, and download.
 *
 * @param {Array} images - Current array of captured images [{ base64Data, latitude, longitude, timestamp, preview }]
 * @param {Function} onImagesChange - Callback when images change
 * @param {number} minImages - Minimum images recommended (default 5)
 * @param {number} maxImages - Maximum images allowed (default 10)
 * @param {boolean} required - Whether images are strictly required to proceed
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
          longitude: position.coords.longitude
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
      showNotification('Please allow location access before capturing images.', 'warning');
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
      showNotification(`You can only upload up to ${maxImages} images. Adding only first ${allowedCount} images.`, 'warning');
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
    if (src.startsWith('/api/images/')) {
      return `${getBaseUrl()}${src.substring(4)}`;
    }
    if (src.startsWith('/images/')) {
      return `${getBaseUrl()}${src}`;
    }
    if (src.includes('blob.core.windows.net')) {
      const filename = src.split('/').pop();
      if (filename) return `${getBaseUrl()}/images/${filename}`;
    }
    return src;
  };

  const downloadImage = async (img, index) => {
    const src = img.preview || img.base64Data;
    if (!src) return;
    try {
      let blobUrl;
      let filename = `inspection_photo_${index + 1}.jpg`;
      const token = localStorage.getItem('authToken');

      let fetchUrl = null;
      if (src.startsWith('/api/images/')) {
        fetchUrl = `${getBaseUrl()}${src.substring(4)}`;
        const namePart = src.split('/').pop();
        if (namePart) filename = namePart;
      } else if (src.startsWith('/images/')) {
        fetchUrl = `${getBaseUrl()}${src}`;
        const namePart = src.split('/').pop();
        if (namePart) filename = namePart;
      } else if (src.includes('blob.core.windows.net')) {
        const namePart = src.split('/').pop();
        if (namePart) {
          fetchUrl = `${getBaseUrl()}/images/${namePart}`;
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
      return `${day}-${month}-${year} ${hours}:${mins}`;
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
        text: `0 / ${maxImages} Images Captured (Min ${minImages} required)`
      };
    }
    if (count < minImages) {
      return {
        isValid: false,
        status: 'warning',
        text: `${count} / ${maxImages} Images Captured (${minImages - count} more required)`
      };
    }
    if (count <= maxImages) {
      return {
        isValid: true,
        status: 'success',
        text: `${count} / ${maxImages} Images Captured (Requirement Satisfied)`
      };
    }
    return {
      isValid: false,
      status: 'error',
      text: `${count} / ${maxImages} Exceeds limit`
    };
  };

  const val = getValidation();

  return (
    <div className="inspection-capture-card">
      <style>{`
        .inspection-capture-card {
          margin: 20px 0;
          padding: 20px 24px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.04);
          font-family: inherit;
        }

        .capture-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isExpanded ? '18px' : '0'};
          flex-wrap: wrap;
          gap: 14px;
        }

        .capture-title-group h3 {
          margin: 0;
          font-size: 1.08rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .capture-title-group p {
          margin: 4px 0 0 0;
          font-size: 0.8rem;
          color: #64748b;
        }

        .capture-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.warning {
          background-color: #fff7ed;
          border: 1px solid #fdba74;
          color: #c2410c;
        }

        .status-badge.success {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .status-badge.info {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }

        .gps-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 12px;
          border-radius: 10px;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          font-size: 0.78rem;
        }

        .gps-banner.error {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
        }

        .led-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #16a34a;
          box-shadow: 0 0 8px #16a34a;
          animation: pulseLed 2s infinite;
        }

        @keyframes pulseLed {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }

        .capture-actions-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          align-items: center;
          flex-wrap: wrap;
        }

        .upload-btn-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          background: #0284c7;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          border: none;
          transition: background 0.15s ease;
        }

        .upload-btn-main:hover {
          background: #0369a1;
        }

        .upload-btn-main:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .images-grid-5col {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
        }

        @media (max-width: 1024px) {
          .images-grid-5col { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .images-grid-5col { grid-template-columns: repeat(2, 1fr); }
        }

        .image-card-thumb {
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .image-card-thumb:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.08);
        }

        .image-thumb-wrapper {
          position: relative;
          width: 100%;
          height: 120px;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-thumb-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay-buttons {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .image-card-thumb:hover .image-overlay-buttons {
          opacity: 1;
        }

        .icon-btn-round {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          color: #0f172a;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: transform 0.1s ease;
        }

        .icon-btn-round:hover {
          transform: scale(1.1);
        }

        .icon-btn-round.danger:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .image-meta-info {
          padding: 8px 10px;
          font-size: 0.72rem;
          color: #475569;
          background: #ffffff;
          border-top: 1px solid #f1f5f9;
        }

        .meta-line {
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-capture-placeholder {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px 20px;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #64748b;
        }

        .modal-backdrop-custom {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .modal-content-custom {
          background: #ffffff;
          border-radius: 14px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 30px rgba(0,0,0,0.3);
        }

        .modal-header-custom {
          padding: 12px 18px;
          background: #0f172a;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          font-weight: 600;
        }
      `}</style>

      {/* Header Bar */}
      <div className="capture-header">
        <div className="capture-title-group">
          <h3>
            📸 Visual Inspection Photo Capture
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
              GPS Tagged
            </span>
          </h3>
          <p>Capture or upload physical site photos during inspection ({minImages} to {maxImages} photos)</p>
        </div>

        <div className="capture-header-right">
          <span className={`status-badge ${val.status}`}>
            {val.status === 'success' ? '✓' : '⚠️'} {val.text}
          </span>

          {location ? (
            <div className="gps-banner">
              <span className="led-dot"></span>
              <span>GPS: <strong>{location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E</strong></span>
            </div>
          ) : (
            <div className={`gps-banner ${locationError ? 'error' : ''}`}>
              <span>{isGettingLocation ? '🔄 Fetching GPS...' : (locationError ? '❌ GPS Error' : '📍 Locating...')}</span>
              {locationError && (
                <button 
                  onClick={getLocation} 
                  style={{ marginLeft: '4px', fontSize: '0.72rem', background: 'none', border: 'underline', color: '#dc2626', cursor: 'pointer' }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Action trigger */}
          <div className="capture-actions-bar">
            <label className="upload-btn-main">
              <span>📷 Take Photo / Upload Image</span>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileChange}
                disabled={images.length >= maxImages}
                style={{ display: 'none' }}
              />
            </label>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Supported: JPG, PNG, WEBP (Max 2MB per image)
            </span>
          </div>

          {/* 5-Column Grid */}
          <div className="images-grid-5col">
            {images.length === 0 ? (
              <div className="empty-capture-placeholder">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>No Inspection Photos Captured Yet</div>
                <div style={{ fontSize: '0.8rem' }}>Click "Take Photo / Upload Image" above to add site inspection photos.</div>
              </div>
            ) : (
              images.map((img, idx) => {
                const src = getImageSrc(img);
                return (
                  <div key={idx} className="image-card-thumb">
                    <div className="image-thumb-wrapper">
                      {src ? (
                        <img src={src} alt={`Inspection Photo ${idx + 1}`} loading="lazy" />
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>No Preview</div>
                      )}
                      <div className="image-overlay-buttons">
                        <button 
                          className="icon-btn-round" 
                          title="View Fullscreen" 
                          onClick={() => setActivePreviewImage({ src, idx, meta: img })}
                        >
                          👁️
                        </button>
                        <button 
                          className="icon-btn-round" 
                          title="Download Image" 
                          onClick={() => downloadImage(img, idx)}
                        >
                          ⬇️
                        </button>
                        <button 
                          className="icon-btn-round danger" 
                          title="Delete Image" 
                          onClick={() => removeImage(idx)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="image-meta-info">
                      <div className="meta-line" style={{ fontWeight: 600, color: '#0f172a' }}>
                        Photo #{idx + 1}
                      </div>
                      <div className="meta-line" title={formatTimestamp(img.timestamp)}>
                        🕒 {formatTimestamp(img.timestamp) || 'Recent'}
                      </div>
                      <div className="meta-line" title={`${img.latitude || 'N/A'}, ${img.longitude || 'N/A'}`}>
                        📍 {img.latitude ? `${Number(img.latitude).toFixed(3)}, ${Number(img.longitude).toFixed(3)}` : 'No GPS'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Fullscreen Preview Modal */}
      {activePreviewImage && (
        <div className="modal-backdrop-custom" onClick={() => setActivePreviewImage(null)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
            <div className="modal-header-custom">
              <span>Photo #{activePreviewImage.idx + 1} • {formatTimestamp(activePreviewImage.meta?.timestamp)}</span>
              <button 
                onClick={() => setActivePreviewImage(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '12px', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '75vh' }}>
              <img 
                src={activePreviewImage.src} 
                alt="Fullscreen Inspection" 
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} 
              />
            </div>
            <div style={{ padding: '10px 18px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#475569' }}>
              <span>📍 Coordinates: {activePreviewImage.meta?.latitude || 'N/A'}, {activePreviewImage.meta?.longitude || 'N/A'}</span>
              <button
                onClick={() => downloadImage(activePreviewImage.meta, activePreviewImage.idx)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Download Photo
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
          fontWeight: '600',
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
