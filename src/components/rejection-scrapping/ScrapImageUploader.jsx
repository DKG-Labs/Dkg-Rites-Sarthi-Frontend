import { useRef } from 'react';
import './RejectionScrapping.css';

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 3;
const COMPRESS_QUALITY = 0.85;
const MAX_DIMENSION = 2400;

const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const base64Data = canvas.toDataURL('image/jpeg', COMPRESS_QUALITY);
        const baseName = file.name.replace(/\.[^.]+$/, '');
        resolve({ fileName: `${baseName}.jpg`, base64Data });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function ScrapImageUploader({ images, onAdd, onRemove, disabled }) {
  const inputRef = useRef();
  const count = images ? images.length : 0;
  const atMax = count >= MAX_IMAGES;
  const isDisabled = disabled || atMax;

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    const remaining = MAX_IMAGES - count;
    if (remaining <= 0) return;
    const oversized = arr.filter(f => f.size > MAX_SIZE_BYTES);
    if (oversized.length) {
      alert(`${oversized.length} file(s) exceed the 2 MB limit and were skipped.`);
    }
    const valid = arr.filter(f => f.size <= MAX_SIZE_BYTES).slice(0, remaining);
    for (const f of valid) {
      onAdd(await compressImage(f));
    }
  };

  return (
    <div>
      {isDisabled ? (
        <div className="rs-upload-max-banner">
          <span className="rs-upload-max-icon">✓</span>
          <div>
            <div className="rs-upload-max-title">3 photos added</div>
            <div className="rs-upload-max-sub">Remove a photo below to replace it</div>
          </div>
        </div>
      ) : (
        <div
          className="rs-upload-zone"
          onClick={() => inputRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <div className="rs-upload-zone-icon">📷</div>
          <div className="rs-upload-zone-text">Click or drag photos here</div>
          <div className="rs-upload-zone-hint">
            Min 1 · Max 3 photos · Max 2 MB each · Compressed to ~1.4 MB for quality display ({count}/{MAX_IMAGES})
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      )}

      {images && images.length > 0 && (
        <div className="rs-thumbs">
          {images.map((img, idx) => (
            <div key={idx} className="rs-thumb">
              <img src={img.base64Data || img.url} alt={img.fileName} />
              {!disabled && (
                <button type="button" className="rs-thumb-remove" onClick={() => onRemove(idx)}>✕</button>
              )}
              <div className="rs-thumb-label">{img.fileName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
