import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PdfPagesViewer.css';

// Bundled worker (no CDN): pdf.js v5 ships the worker as .mjs
const WORKER_URL = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.15;
const MAX_PAGE_WIDTH = 1100;

/** One page: rendered to a canvas only when it scrolls near the viewport. */
function PdfPage({ pdf, pageNumber, width, onVisible }) {
  const holderRef = useRef(null);
  const canvasRef = useRef(null);
  const [aspect, setAspect] = useState(1.414); // A4 until the real size is known
  const [near, setNear] = useState(pageNumber <= 2);
  const [rendered, setRendered] = useState(false);

  // Lazy rendering + current-page tracking
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return undefined;
    const lazy = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); }, { rootMargin: '800px 0px' });
    const current = new IntersectionObserver(([e]) => { if (e.isIntersecting) onVisible(pageNumber); }, { threshold: 0.5 });
    lazy.observe(el);
    current.observe(el);
    return () => { lazy.disconnect(); current.disconnect(); };
  }, [pageNumber, onVisible]);

  useEffect(() => {
    if (!near || !width) return undefined;
    let task = null;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setAspect(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await task.promise;
      if (!cancelled) setRendered(true);
    })().catch(() => { /* cancelled or failed page: keep the placeholder */ });
    return () => { cancelled = true; if (task) task.cancel(); };
  }, [pdf, pageNumber, width, near]);

  return (
    <div ref={holderRef} className="ppv-page" style={{ width, height: width * aspect }}>
      {!rendered && <div className="ppv-page-skeleton" />}
      <canvas ref={canvasRef} className="ppv-canvas" style={{ width, height: width * aspect, opacity: rendered ? 1 : 0 }} />
      <span className="ppv-page-no">{pageNumber}</span>
    </div>
  );
}

/**
 * Modern in-app PDF viewer (pdf.js). Light toolbar with page counter, zoom, fit width, download and open,
 * pages shown as cards. Works the same on desktop and phones.
 */
export default function PdfPagesViewer({ url, fileName = 'document.pdf', title }) {
  const scrollRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [areaWidth, setAreaWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;
    setPdf(null);
    setError('');
    setCurrentPage(1);
    const task = pdfjsLib.getDocument({ url });
    task.promise.then(setPdf).catch(e => setError(e?.message || 'Could not open the document.'));
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => { task.destroy(); };
  }, [url]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setAreaWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onVisible = useCallback((n) => setCurrentPage(n), []);
  const fitWidth = Math.max(240, Math.min(areaWidth - 32, MAX_PAGE_WIDTH));
  const pageWidth = Math.round(fitWidth * zoom);
  const numPages = pdf?.numPages || 0;

  const goTo = (n) => {
    const target = scrollRef.current?.querySelectorAll('.ppv-page')[n - 1];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ppv">
      <div className="ppv-toolbar">
        <div className="ppv-doc">
          <span className="ppv-doc-icon">PDF</span>
          <span className="ppv-doc-name" title={title || fileName}>{title || fileName}</span>
        </div>

        <div className="ppv-controls">
          <div className="ppv-group">
            <button type="button" className="ppv-icon-btn" onClick={() => goTo(Math.max(1, currentPage - 1))} disabled={!numPages || currentPage <= 1} aria-label="Previous page">‹</button>
            <span className="ppv-pages">{numPages ? `${currentPage} / ${numPages}` : '– / –'}</span>
            <button type="button" className="ppv-icon-btn" onClick={() => goTo(Math.min(numPages, currentPage + 1))} disabled={!numPages || currentPage >= numPages} aria-label="Next page">›</button>
          </div>
          <div className="ppv-group">
            <button type="button" className="ppv-icon-btn" onClick={() => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
            <span className="ppv-zoom">{Math.round(zoom * 100)}%</span>
            <button type="button" className="ppv-icon-btn" onClick={() => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
            <button type="button" className="ppv-text-btn" onClick={() => setZoom(1)} disabled={zoom === 1}>Fit width</button>
          </div>
        </div>

        <div className="ppv-actions">
          <a className="ppv-btn" href={url} target="_blank" rel="noopener noreferrer">Open</a>
          <a className="ppv-btn ppv-btn--primary" href={url} download={fileName}>Download</a>
        </div>
      </div>

      <div ref={scrollRef} className="ppv-scroll">
        {error && (
          <div className="ppv-message">
            <div className="ppv-message-icon">📄</div>
            <p>Could not display the document here.</p>
            <a className="ppv-btn ppv-btn--primary" href={url} target="_blank" rel="noopener noreferrer">Open PDF</a>
          </div>
        )}
        {!error && !pdf && (
          <div className="ppv-loading">
            {[0, 1].map(i => <div key={i} className="ppv-page ppv-page--loading" style={{ width: fitWidth, height: fitWidth * 1.414 }}><div className="ppv-page-skeleton" /></div>)}
          </div>
        )}
        {pdf && areaWidth > 0 && Array.from({ length: numPages }, (_, i) => (
          <PdfPage key={`${url}-${i + 1}`} pdf={pdf} pageNumber={i + 1} width={pageWidth} onVisible={onVisible} />
        ))}
      </div>
    </div>
  );
}
