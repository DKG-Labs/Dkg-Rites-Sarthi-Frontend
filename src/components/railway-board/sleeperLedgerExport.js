import { jsPDF } from 'jspdf';

/**
 * Sleeper Scrap Ledger export for the Railway Board (audit copy), same columns as the IE / vendor export.
 * rows: ledger rows from GET /api/sleeper-scrap/ledger
 */

const COLUMNS = [
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

const escapeHtml = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const download = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const exportRows = (rows) => (rows || []).filter(r => !(r.rowType === 'REJECTION' && !r.rejectedQty));

/** Excel: an HTML table saved as .xls (opens directly in Excel) */
const toExcel = (fileName, title, subtitle, rows) => {
  const head = COLUMNS.map(c => `<th style="background:#0f766e;color:#fff;border:1px solid #ccc">${escapeHtml(c.header)}</th>`).join('');
  const body = rows.map(r => `<tr>${COLUMNS.map(c => `<td style="border:1px solid #ccc">${escapeHtml(c.value(r))}</td>`).join('')}</tr>`).join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8"></head><body>
<h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
  download(new Blob(['﻿', html], { type: 'application/vnd.ms-excel' }), `${fileName}.xls`);
};

/** PDF: landscape A4 table with the header row repeated on every page */
const toPdf = (fileName, title, subtitle, rows) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 30;
  const tableW = pageW - margin * 2;
  const colW = tableW / COLUMNS.length;
  const lineH = 10;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, margin, y + 4);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(subtitle, margin, y);
  doc.setTextColor(0);
  y += 14;

  const drawHeader = () => {
    doc.setFillColor(15, 118, 110);
    doc.rect(margin, y, tableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255);
    COLUMNS.forEach((c, i) => doc.text(doc.splitTextToSize(c.header, colW - 6)[0], margin + i * colW + 3, y + 12));
    doc.setTextColor(0);
    y += 18;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rows.forEach((r, idx) => {
    const cells = COLUMNS.map(c => doc.splitTextToSize(String(c.value(r) ?? ''), colW - 6));
    const rowH = Math.max(...cells.map(l => l.length)) * lineH + 6;
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, tableW, rowH, 'F');
    }
    cells.forEach((lines, i) => doc.text(lines, margin + i * colW + 3, y + 10));
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + rowH, margin + tableW, y + rowH);
    y += rowH;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}  ·  Page ${p} of ${pages}`, margin, pageH - 12);
  }
  doc.save(`${fileName}.pdf`);
};

/** kind: 'pdf' | 'excel'. Returns false when there is nothing to export. */
export const exportSleeperLedger = (kind, plantLabel, plantId, ledger) => {
  const rows = exportRows(ledger?.rows);
  if (!rows.length) return false;
  const stamp = new Date().toISOString().slice(0, 10);
  const title = `Sleeper Rejection & Disposal Ledger - ${plantLabel}`;
  const subtitle = `Total Rejected: ${ledger?.totalRejected ?? 0} | Total Disposed: ${ledger?.totalScrapped ?? 0} | Pending Balance: ${ledger?.pendingBalance ?? 0}`;
  const file = `Sleeper_Disposal_${String(plantId || '').replace(/[^A-Za-z0-9]+/g, '_')}_${stamp}`;
  if (kind === 'pdf') toPdf(file, title, subtitle, rows);
  else toExcel(file, title, subtitle, rows);
  return true;
};
