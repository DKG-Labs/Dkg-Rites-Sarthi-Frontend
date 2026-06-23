import React, { useState, useEffect } from 'react';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * Component for capturing images and geofencing data
 * Enforces a minimum of 5 images and maximum of 10 images with dynamic validation feedback.
 * Renders exactly 5 columns per row on desktop using a custom CSS Grid.
 * @param {Array} images - Current array of captured images
 * @param {Function} onImagesChange - Callback when images change
 */
const ImageCaptureComponent = ({ images = [], onImagesChange }) => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activePreviewImage, setActivePreviewImage] = useState(null);

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
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "User denied GPS access. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Request timed out.";
            break;
          default:
            errorMessage += "Unknown GPS error.";
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
      alert("Please allow location access before capturing images.");
      getLocation();
      return;
    }

    let files = Array.from(e.target.files);
    
    if (images.length >= 10) {
      alert("Maximum limit of 10 images reached.");
      e.target.value = null;
      return;
    }

    // 10MB size validation
    const maxSize = 10 * 1024 * 1024;
    const largeFiles = files.filter(f => f.size > maxSize);
    if (largeFiles.length > 0) {
      alert(`Some files exceed the 10MB limit and were skipped:\n${largeFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`).join('\n')}`);
      files = files.filter(f => f.size <= maxSize);
    }

    if (files.length === 0) {
      e.target.value = null;
      return;
    }

    if (images.length + files.length > 10) {
      const allowedCount = 10 - images.length;
      alert(`You can only upload up to 10 images. Adding only the first ${allowedCount} selected images.`);
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

  const getValidation = () => {
    if (images.length === 0) {
      return { text: 'Minimum 5 images required', type: 'warning' };
    }
    if (images.length < 5) {
      return { text: `Add ${5 - images.length} more (Min 5 required)`, type: 'warning' };
    }
    if (images.length >= 5 && images.length < 10) {
      return { text: `✓ Ready (${images.length}/10 captured)`, type: 'success' };
    }
    return { text: '✓ Maximum Limit Reached (10/10)', type: 'info' };
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

  const val = getValidation();

  return (
    <div className="inspection-capture-card">
      {/* Dynamic Style Injection for layout guarantees */}
      <style>{`
        .inspection-capture-card {
          margin: 24px 0;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .capture-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .capture-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .capture-title-group h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .capture-title-group p {
          margin: 4px 0 0 0;
          font-size: 0.825rem;
          color: #64748b;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.825rem;
          font-weight: 600;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
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
          gap: 12px;
          padding: 8px 14px;
          border-radius: 12px;
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .gps-banner.error {
          background-color: #fef2f2;
          border: 1px solid #fca5a5;
        }

        .gps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .led-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
        }

        .led-dot.pulsing {
          animation: ledPulse 1.8s infinite ease-in-out;
        }

        .led-dot.error {
          background-color: #ef4444;
        }

        @keyframes ledPulse {
          0% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        .gps-info-text {
          flex-grow: 1;
        }

        .gps-info-text .label {
          display: block;
          font-weight: 700;
          font-size: 0.85rem;
          color: #14532d;
        }

        .gps-info-text.error .label {
          color: #991b1b;
        }

        .gps-info-text .coordinates {
          display: block;
          font-family: monospace;
          font-size: 0.8rem;
          color: #166534;
          margin-top: 2px;
          letter-spacing: 0.03em;
        }

        .gps-info-text.error .coordinates {
          color: #7f1d1d;
          font-family: inherit;
        }

        .gps-retry-btn {
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background-color: #d97706;
          color: white;
          transition: background 0.2s;
        }

        .gps-retry-btn:hover {
          background-color: #b45309;
        }

        .gps-retry-btn.error {
          background-color: #dc2626;
        }

        .gps-retry-btn.error:hover {
          background-color: #b91c1c;
        }

        /* Upload Trigger Button */
        .upload-trigger-area {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .btn-capture {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.925rem;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(2, 132, 199, 0.15);
          transition: all 0.2s ease-in-out;
        }

        .btn-capture:hover:not(.disabled):not(:disabled) {
          background-color: #0369a1;
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(2, 132, 199, 0.25);
        }

        .btn-capture:disabled,
        .btn-capture.disabled {
          background-color: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Image grid with EXACTLY 5 columns on desktop */
        .image-capture-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr) !important;
          gap: 16px;
          margin-top: 16px;
        }

        @media (max-width: 1200px) {
          .image-capture-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        @media (max-width: 900px) {
          .image-capture-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 600px) {
          .image-capture-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 400px) {
          .image-capture-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Photo card style */
        .photo-card {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background-color: #0f172a;
        }

        .photo-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }

        .photo-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.5s ease;
        }

        .photo-card:hover img {
          transform: scale(1.04);
        }

        .photo-index-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.675rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 2;
        }

        .photo-delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.95);
          color: #ef4444;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          z-index: 2;
        }

        .photo-delete-btn:hover {
          background-color: #ef4444;
          color: #ffffff;
          transform: scale(1.15);
        }

        .photo-watermark-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.85) 30%, rgba(15, 23, 42, 0.98) 100%);
          color: #ffffff;
          padding: 10px;
          font-size: 0.7rem;
          z-index: 1;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(1px);
        }

        .photo-watermark-overlay .geotag-line {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-size: 0.625rem;
          margin-bottom: 2px;
        }

        .photo-watermark-overlay .coords-line {
          font-family: monospace;
          color: #f1f5f9;
          letter-spacing: 0.01em;
        }

        .photo-watermark-overlay .time-line {
          color: #94a3b8;
          font-size: 0.625rem;
          margin-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 4px;
        }

        .photo-view-btn {
          position: absolute;
          top: 8px;
          right: 40px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.95);
          color: #0284c7;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          z-index: 2;
        }

        .photo-view-btn:hover {
          background-color: #0284c7;
          color: #ffffff;
          transform: scale(1.15);
        }

        /* Lightbox modal styles */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.25s ease-out;
          padding: 24px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .lightbox-content-wrapper {
          position: relative;
          max-width: 85%;
          max-height: 90%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .lightbox-image-container {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .lightbox-image-container img {
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
          display: block;
        }

        .lightbox-close-btn {
          position: absolute;
          top: -45px;
          right: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.25);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.25s ease;
        }

        .lightbox-close-btn:hover {
          background-color: #ef4444;
          border-color: #ef4444;
          transform: rotate(90deg);
        }

        .lightbox-hud-details {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px 20px;
          width: 100%;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .lightbox-hud-details .location-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #38bdf8;
          font-weight: 700;
          font-family: monospace;
          font-size: 0.85rem;
        }

        .lightbox-hud-details .date-info {
          color: #94a3b8;
          font-size: 0.8rem;
        }

        /* Empty State styles */
        .empty-state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          background-color: #f8fafc;
          text-align: center;
          transition: all 0.3s ease;
          margin-top: 8px;
        }

        .empty-state-container:hover {
          border-color: #94a3b8;
          background-color: #f1f5f9;
        }

        .empty-state-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          transition: all 0.3s ease;
        }

        .empty-state-container:hover .empty-state-icon {
          transform: scale(1.05);
          background-color: #cbd5e1;
        }

        .empty-state-container h4 {
          margin: 0 0 8px 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #334155;
        }

        .empty-state-container p {
          margin: 0 0 20px 0;
          font-size: 0.825rem;
          color: #64748b;
          max-width: 420px;
          line-height: 1.5;
        }

        /* Add More Grid Card styles */
        .photo-card.add-more-card {
          background-color: #f8fafc;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .photo-card.add-more-card:hover {
          border-color: #0284c7;
          background-color: #eff6ff;
          transform: translateY(-5px) scale(1.02);
        }

        .add-more-label {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .add-more-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 12px;
          gap: 6px;
        }

        .add-more-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .photo-card.add-more-card:hover .add-more-icon-circle {
          background-color: #0284c7;
        }

        .photo-card.add-more-card:hover .add-more-icon-circle svg {
          color: #ffffff !important;
        }

        .add-more-text {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0284c7;
        }

        .add-more-subtext {
          font-size: 0.725rem;
          color: #64748b;
          font-weight: 500;
        }

        .add-more-label.disabled {
          cursor: not-allowed !important;
        }

        .add-more-label.disabled .add-more-icon-circle {
          background-color: #e2e8f0;
        }

        .add-more-label.disabled .add-more-icon-circle svg {
          color: #94a3b8 !important;
        }

        .add-more-label.disabled .add-more-text {
          color: #94a3b8;
        }
      `}</style>

      {/* Header section */}
      <div className="capture-header">
        <div className="capture-title-group">
          <h3>📸 Photo Inspection Records</h3>
          <p>Enforce location verification and photo evidence logs</p>
        </div>
        
        <div className="capture-header-right">
          {/* GPS locking banner */}
          {location ? (
            <div className="gps-banner">
              <div className="gps-indicator">
                <div className="led-dot pulsing"></div>
              </div>
              <div className="gps-info-text">
                <span className="label">GPS COORDINATES SECURED</span>
                <span className="coordinates">
                  Lat: {location.latitude.toFixed(6)} | Long: {location.longitude.toFixed(6)}
                </span>
              </div>
            </div>
          ) : (
            <div className="gps-banner error">
              <div className="gps-indicator">
                <div className="led-dot error"></div>
              </div>
              <div className="gps-info-text error">
                <span className="label">GPS COORDINATES REQUIRED</span>
                <span className="coordinates">
                  {locationError || "Waiting for location services. Please check your browser location access."}
                </span>
              </div>
              <button 
                className={`gps-retry-btn ${locationError ? 'error' : ''}`}
                onClick={getLocation} 
                disabled={isGettingLocation}
              >
                {isGettingLocation ? 'Locating...' : 'Retry GPS'}
              </button>
            </div>
          )}

          <div className={`status-badge ${val.type}`}>
            {val.text}
          </div>
        </div>
      </div>

      {/* Empty State or Image Grid */}
      {images.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <CameraAltIcon sx={{ fontSize: '2rem', color: '#94a3b8' }} />
          </div>
          <h4>No Photos Uploaded Yet</h4>
          <p>Please upload or capture 5 to 10 inspection photos. Location metadata will be automatically tagged.</p>
          
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="empty-capture-button-file"
            multiple
            type="file"
            capture="environment"
            onChange={handleFileChange}
          />
          <label 
            htmlFor="empty-capture-button-file"
            className={`btn-capture ${!location ? 'disabled' : ''}`}
            onClick={(e) => {
              if (!location) {
                e.preventDefault();
                alert("Please lock GPS location before capturing images.");
                getLocation();
              }
            }}
          >
            <CameraAltIcon sx={{ fontSize: '1.2rem' }} />
            Take / Upload Photos
          </label>
        </div>
      ) : (
        <div className="image-capture-grid">
          {images.map((img, index) => (
            <div className="photo-card" key={index}>
              {/* Photo Index */}
              <div className="photo-index-tag">#{index + 1}</div>
              
              {/* View Button */}
              <button 
                type="button" 
                className="photo-view-btn" 
                onClick={() => setActivePreviewImage(img)}
                title="View full image"
              >
                <VisibilityIcon sx={{ fontSize: '1rem' }} />
              </button>

              {/* Delete Button */}
              <button 
                type="button" 
                className="photo-delete-btn" 
                onClick={() => removeImage(index)}
                title="Remove photo"
              >
                <DeleteIcon sx={{ fontSize: '1rem' }} />
              </button>

              {/* Photo image */}
              <img src={img.preview || img.base64Data} alt={`Capture ${index + 1}`} />

              {/* HUD / Watermark Overlay */}
              <div className="photo-watermark-overlay">
                <div className="geotag-line">
                  <LocationOnIcon sx={{ fontSize: '0.8rem', color: '#38bdf8' }} />
                  GEOTAG SECURED
                </div>
                <div className="coords-line">
                  {img.latitude?.toFixed(6)}, {img.longitude?.toFixed(6)}
                </div>
                {(img.timestamp || img.createdAt || img.dateOfInspection) && (
                  <div className="time-line">
                    {formatTimestamp(img.timestamp || img.createdAt || img.dateOfInspection)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add more button as grid card if limit not reached */}
          {images.length < 10 && (
            <div className="photo-card add-more-card">
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="grid-capture-button-file"
                multiple
                type="file"
                capture="environment"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="grid-capture-button-file" 
                className={`add-more-label ${!location ? 'disabled' : ''}`}
                onClick={(e) => {
                  if (!location) {
                    e.preventDefault();
                    alert("Please lock GPS location before capturing images.");
                    getLocation();
                  }
                }}
              >
                <div className="add-more-content">
                  <div className="add-more-icon-circle">
                    <CameraAltIcon sx={{ fontSize: '1.4rem', color: '#0284c7' }} />
                  </div>
                  <span className="add-more-text">Add More Photos</span>
                  <span className="add-more-subtext">({images.length}/10 uploaded)</span>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePreviewImage && (
        <div className="lightbox-overlay" onClick={() => setActivePreviewImage(null)}>
          <div className="lightbox-content-wrapper" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              className="lightbox-close-btn" 
              onClick={() => setActivePreviewImage(null)}
              title="Close viewer"
            >
              ×
            </button>

            {/* Image Container */}
            <div className="lightbox-image-container">
              <img 
                src={activePreviewImage.preview || activePreviewImage.base64Data} 
                alt="Full preview" 
              />
            </div>

            {/* HUD / Location Details */}
            <div className="lightbox-hud-details">
              <div className="location-info">
                <LocationOnIcon sx={{ fontSize: '1.1rem', color: '#38bdf8' }} />
                LAT: {activePreviewImage.latitude?.toFixed(6)} | LONG: {activePreviewImage.longitude?.toFixed(6)}
              </div>
              {(activePreviewImage.timestamp || activePreviewImage.createdAt || activePreviewImage.dateOfInspection) && (
                <div className="date-info">
                  📅 {formatTimestamp(activePreviewImage.timestamp || activePreviewImage.createdAt || activePreviewImage.dateOfInspection)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureComponent;
