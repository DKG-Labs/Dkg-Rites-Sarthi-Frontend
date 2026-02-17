/**
 * CM Dashboard Page
 * Controlling Manager Dashboard with tabs for Call Monitoring, Approvals, IE Workload, and Performance
 */

import React, { useState } from 'react';
import useCMData from '../../hooks/cm/useCMData';
import Tabs from '../../components/Tabs';
import CMCallMonitoringTab from './tabs/CMCallMonitoringTab';
import CMApprovalsTab from './tabs/CMApprovalsTab';
import CMIEWorkloadTab from './tabs/CMIEWorkloadTab';
import CMPerformanceTab from './tabs/CMPerformanceTab';
import './CMDashboard.css';

const CMDashboardPage = () => {
  const { loading, error, dashboardKPIs } = useCMData();
  const [activeTab, setActiveTab] = useState('monitoring');

  // Calculate counts for tab descriptions
  const pendingCount = dashboardKPIs.pendingInspections || 0;
  const approvalsCount = dashboardKPIs.pendingApprovals || 0;

  // Define tabs matching IE Landing Page structure
  const tabs = [
    {
      id: 'monitoring',
      label: 'Call Monitoring',
      description: `${pendingCount} pending`
    },
    {
      id: 'approvals',
      label: 'Pending Approvals',
      description: `${approvalsCount} require action`
    },
    {
      id: 'workload',
      label: 'IE Workload',
      description: 'Load balancing'
    },
    {
      id: 'performance',
      label: 'Performance Analytics',
      description: 'KPI overview'
    },
  ];

  if (loading) {
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: 'var(--space-16)'
        }}>
          <div className="spinner"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="breadcrumb-item breadcrumb-active">CM Dashboard</div>
      </div>

      {/* Page Title */}
      <h1 style={{ marginBottom: 'var(--space-24)' }}>Controlling Manager Dashboard</h1>

      {/* Tabs Component */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'monitoring' && (
        <CMCallMonitoringTab dashboardKPIs={dashboardKPIs} />
      )}

      {activeTab === 'approvals' && (
        <CMApprovalsTab />
      )}

      {activeTab === 'workload' && (
        <CMIEWorkloadTab />
      )}

      {activeTab === 'performance' && (
        <CMPerformanceTab dashboardKPIs={dashboardKPIs} />
      )}
    </div>
  );
};

export default CMDashboardPage;

