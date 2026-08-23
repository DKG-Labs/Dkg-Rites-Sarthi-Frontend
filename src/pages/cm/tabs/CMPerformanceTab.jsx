/**
 * CMPerformanceTab Component
 * Performance analytics and KPI overview for CM
 */

import React from 'react';

const CMPerformanceTab = ({ dashboardKPIs }) => {
  const performanceMetrics = [
    {
      label: 'SLA Compliance Rate',
      value: `${dashboardKPIs.slaComplianceRate || 0}%`,
      helper: 'Calls completed within SLA',
      trend: dashboardKPIs.slaComplianceRate >= 90 ? 'positive' : 'negative'
    },
    {
      label: 'Average IC Issuance Time',
      value: `${dashboardKPIs.avgICIssuanceTime || 0} days`,
      helper: 'From inspection to IC',
      trend: dashboardKPIs.avgICIssuanceTime <= 3 ? 'positive' : 'negative'
    },
    {
      label: 'Approval Turnaround Time',
      value: `${dashboardKPIs.avgApprovalTime || 0} hrs`,
      helper: 'Average CM approval time',
      trend: dashboardKPIs.avgApprovalTime <= 24 ? 'positive' : 'negative'
    },
    {
      label: 'IE Utilization Rate',
      value: `${dashboardKPIs.ieUtilizationRate || 0}%`,
      helper: 'Average IE workload',
      trend: dashboardKPIs.ieUtilizationRate >= 70 && dashboardKPIs.ieUtilizationRate <= 90 ? 'positive' : 'neutral'
    },
    {
      label: 'Vendor Rejection Rate',
      value: `${dashboardKPIs.vendorRejectionRate || 0}%`,
      helper: 'Overall rejection percentage',
      trend: dashboardKPIs.vendorRejectionRate <= 10 ? 'positive' : 'negative'
    },
    {
      label: 'Calls Disposed (Month)',
      value: dashboardKPIs.callsDisposedThisMonth || 0,
      helper: 'Completed this month',
      trend: 'neutral'
    },
    {
      label: 'Pending Beyond SLA',
      value: dashboardKPIs.slaBreachedCalls || 0,
      helper: 'Requires immediate action',
      trend: dashboardKPIs.slaBreachedCalls === 0 ? 'positive' : 'negative'
    },
    {
      label: 'Rescheduling Rate',
      value: `${dashboardKPIs.reschedulingRate || 0}%`,
      helper: 'Calls rescheduled vs total',
      trend: dashboardKPIs.reschedulingRate <= 15 ? 'positive' : 'negative'
    },
  ];

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return '#22c55e';
      case 'negative': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div>
      {/* Performance Metrics Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="stat-label">{metric.label}</div>
            <div className="stat-value" style={{ color: getTrendColor(metric.trend) }}>
              {metric.value}
            </div>
            {metric.helper && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {metric.helper}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Product-wise Performance */}
      <div style={{ marginTop: 'var(--space-32)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-16)' }}>
          Product-wise Performance
        </h2>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">ERC - Raw Material</div>
            <div className="stat-value">85%</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Acceptance rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ERC - Process Material</div>
            <div className="stat-value">92%</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Acceptance rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ERC - Final Product</div>
            <div className="stat-value">88%</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Acceptance rate</div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div style={{ marginTop: 'var(--space-32)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-16)' }}>
          Active Alerts
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {dashboardKPIs.slaBreachedCalls > 0 && (
            <div className="alert alert-error"><strong>{dashboardKPIs.slaBreachedCalls}</strong> calls have breached SLA</div>
          )}
          {dashboardKPIs.overloadedIEs > 0 && (
            <div className="alert alert-warning"><strong>{dashboardKPIs.overloadedIEs}</strong> IEs are overloaded</div>
          )}
          {dashboardKPIs.pendingApprovals > 5 && (
            <div className="alert alert-info"><strong>{dashboardKPIs.pendingApprovals}</strong> approvals pending your action</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMPerformanceTab;

