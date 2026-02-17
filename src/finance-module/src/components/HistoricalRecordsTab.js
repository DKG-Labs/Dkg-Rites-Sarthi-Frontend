/**
 * Historical Records Tab Component
 * Section 5: Historical Financial Records & Audit Trail
 */

import React from 'react';
import DataTable from '../../../components/DataTable';
import { formatDateTime, formatCurrency, getPaymentStatusBadge, getBillStatusBadge } from '../utils/helpers';
import { exportToCSV } from '../utils/helpers';

const HistoricalRecordsTab = ({ auditTrail = [], kpis = {} }) => {
  // KPI Tiles
  const kpiTiles = [
    {
      label: 'Total Revenue',
      value: formatCurrency(kpis.amount || 0),
      icon: '💰',
      color: '#22c55e'
    },
    {
      label: 'This Month',
      value: formatCurrency(kpis.thisMonth || 0),
      icon: '📅',
      color: '#3b82f6'
    },
    {
      label: 'Growth',
      value: `${kpis.growth || 0}%`,
      icon: '📈',
      color: '#8b5cf6'
    }
  ];

  // Table columns
  const columns = [
    {
      key: 'timestamp',
      label: 'Date/Time',
      sortable: true,
      render: (value) => formatDateTime(value)
    },
    {
      key: 'callNumber',
      label: 'Call Number',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'billNumber',
      label: 'Bill Number',
      sortable: true,
      render: (value) => value || '-'
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value) => <strong>{value}</strong>
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => value ? formatCurrency(value) : '-'
    },
    {
      key: 'previousStatus',
      label: 'Previous Status',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const badge = getPaymentStatusBadge(value) || getBillStatusBadge(value);
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: badge.bgColor,
              color: badge.color,
              border: `1px solid ${badge.borderColor}`,
              fontSize: '11px'
            }}
          >
            {badge.label}
          </span>
        );
      }
    },
    {
      key: 'newStatus',
      label: 'New Status',
      sortable: true,
      render: (value) => {
        if (!value) return '-';
        const badge = getPaymentStatusBadge(value) || getBillStatusBadge(value);
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: badge.bgColor,
              color: badge.color,
              border: `1px solid ${badge.borderColor}`,
              fontSize: '11px'
            }}
          >
            {badge.label}
          </span>
        );
      }
    },
    {
      key: 'performedBy',
      label: 'Performed By',
      sortable: true
    },
    {
      key: 'remarks',
      label: 'Remarks',
      sortable: true,
      render: (value) => value || '-'
    }
  ];

  const handleExport = () => {
    const exportData = auditTrail.map(entry => ({
      'Date/Time': formatDateTime(entry.timestamp),
      'Call Number': entry.callNumber,
      'Bill Number': entry.billNumber || '-',
      'Action': entry.action,
      'Amount': entry.amount ? formatCurrency(entry.amount) : '-',
      'Previous Status': entry.previousStatus || '-',
      'New Status': entry.newStatus || '-',
      'Performed By': entry.performedBy,
      'Remarks': entry.remarks || '-'
    }));
    exportToCSV(exportData, 'finance_audit_trail');
  };

  return (
    <div className="tab-content">
      {/* KPI Tiles */}
      <div className="kpi-grid">
        {kpiTiles.map((kpi, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ color: kpi.color }}>
              {kpi.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{kpi.label}</div>
              <div className="stat-value" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleExport}>
          📥 Export to CSV
        </button>
      </div>

      {/* Info Message */}
      <div className="info-message" style={{ marginBottom: '16px' }}>
        <span className="info-icon">ℹ️</span>
        <span>Complete audit trail of all financial transactions with end-to-end traceability.</span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={auditTrail}
        emptyMessage="No audit records found"
      />
    </div>
  );
};

export default HistoricalRecordsTab;

