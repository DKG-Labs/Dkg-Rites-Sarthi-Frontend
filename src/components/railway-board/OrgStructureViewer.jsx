import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
import ercPdf from './org-structure/erc.pdf';
import sleeperPdf from './org-structure/sleeper.pdf';
import railpadPdf from './org-structure/railpad.pdf';
import './OrgStructureViewer.css';

// Supply worker handler directly in-bundle on the main thread (zero network worker URL requests)
if (typeof window !== 'undefined') {
  window.pdfjsWorker = pdfjsWorker;
}

export const ORG_DOCS = {
  'ERC': { url: ercPdf, title: 'ERC' },
  'Sleeper': { url: sleeperPdf, title: 'PSC Sleeper' },
  'Rail Pad': { url: railpadPdf, title: 'Rail Pad' },
};

export function getOrgStructurePdf(product = 'ERC') {
  return ORG_DOCS[product] || ORG_DOCS.ERC;
}

function PageCard({ pdf, pageNumber, containerWidth }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const vp = page.getViewport({ scale: 1 });
        const targetWidth = Math.min(Math.max(300, (containerWidth || 1000) - 48), 1150);
        const scale = targetWidth / vp.width;
        const targetHeight = Math.round(vp.height * scale);
        setHeight(targetHeight);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderViewport = page.getViewport({ scale: scale * dpr });

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(targetWidth)}px`;
        canvas.style.height = `${targetHeight}px`;

        const ctx = canvas.getContext('2d');
        renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
        await renderTask.promise;
        if (!cancelled) setRendered(true);
      } catch (err) {
        if (!cancelled) console.error(`Error rendering page ${pageNumber}:`, err);
      }
    })();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdf, pageNumber, containerWidth]);

  return (
    <div className="osv-page-card" style={{ minHeight: height }}>
      {!rendered && <div className="osv-page-skeleton" style={{ height }} />}
      <canvas ref={canvasRef} className="osv-page-canvas" style={{ opacity: rendered ? 1 : 0 }} />
      {pdf.numPages > 1 && <span className="osv-page-num">{pageNumber} / {pdf.numPages}</span>}
    </div>
  );
}

/** Railway Board: RITES official contact details / inspection directory for the selected product. */
export default function OrgStructureViewer({ selectedProduct = 'ERC' }) {
  const doc = getOrgStructurePdf(selectedProduct);
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPdf(null);

    const task = pdfjsLib.getDocument({ url: doc.url });
    task.promise
      .then(loadedPdf => {
        if (!cancelled) {
          setPdf(loadedPdf);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to load Contact Details PDF document:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [doc.url]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect && entry.contentRect.width) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 1000);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="osv-wrap">
      <div className="osv-head">
        <div>
          <h2 className="osv-title">RITES Contact Details</h2>
          <p className="osv-sub">Inspection directory and official contact details for <strong>{doc.title}</strong></p>
        </div>
      </div>

      <div ref={containerRef} className="osv-pages-scroll">
        {loading && (
          <div className="osv-loading-state">
            <div className="osv-spinner" />
            <p>Loading contact details...</p>
          </div>
        )}
        {pdf && containerWidth > 0 && Array.from({ length: pdf.numPages }, (_, i) => (
          <PageCard
            key={`${doc.url}-${i + 1}`}
            pdf={pdf}
            pageNumber={i + 1}
            containerWidth={containerWidth}
          />
        ))}
      </div>
    </div>
  );
}
