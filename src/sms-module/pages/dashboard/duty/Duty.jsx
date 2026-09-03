/* eslint-disable */
import {
  LineChartOutlined, EyeOutlined, ExperimentOutlined, ToolOutlined,
  DatabaseOutlined, CompassOutlined, DeploymentUnitOutlined, RadarChartOutlined,
  AuditOutlined, MessageOutlined, PlayCircleOutlined, SyncOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message, Tooltip, Modal, Button } from 'antd';
import { useRef, useState } from 'react';
import Tab from '../../../components/DKG_Tab';
import { filterByPermissions } from '../../../utils/permissions';

const dutyItemTabs = [
  { id: 1, title: 'SMS', icon: <MessageOutlined />, link: '/sms', permission: 'duty-sms', dutyKey: 'smsDuty', blockable: true },
  { id: 2, title: 'Rolling Stage', icon: <AuditOutlined />, link: '/stage', permission: 'duty-rolling', dutyKey: 'rollingDuty', blockable: true },
  { id: 3, title: 'NDT', icon: <RadarChartOutlined />, link: '/ndt', permission: 'duty-ndt', dutyKey: 'ndtDuty', blockable: true },
  { id: 4, title: 'Testing', icon: <ExperimentOutlined />, link: '/testing', permission: 'duty-testing', dutyKey: 'testingDuty', blockable: true },
  { id: 5, title: 'Visual Inspection', icon: <EyeOutlined />, link: '/visual', permission: 'duty-vi', dutyKey: 'viDuty', blockable: true },
  { id: 6, title: 'Welding Inspection', icon: <DeploymentUnitOutlined />, link: '/welding', permission: 'duty-welding', dutyKey: 'weldingDuty', blockable: true },
  { id: 7, title: 'Short Rail Inspection', icon: <CompassOutlined />, link: '/srInspection', permission: 'duty-sr-inspection', dutyKey: 'sriDuty', blockable: true },
  { id: 8, title: 'QCT', icon: <DatabaseOutlined />, link: '/qct', permission: 'duty-qct', dutyKey: 'qctDuty', blockable: false },
  { id: 9, title: 'Calibration', icon: <ToolOutlined />, link: '/calibration', permission: 'duty-calibration', dutyKey: 'calibrationDuty', blockable: false },
  { id: 10, title: 'Info', icon: <LineChartOutlined />, permission: 'admin' },
];

const Duty = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useSelector(state => state.auth);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

  // Store reference to current notification to replace it
  const currentNotification = useRef(null);

  // Get all duty states from Redux
  const dutyStates = useSelector(state => ({
    smsDuty: state.smsDuty,
    rollingDuty: state.rollingDuty,
    ndtDuty: state.ndtDuty,
    testingDuty: state.testingDuty,
    viDuty: state.viDuty,
    weldingDuty: state.weldingDuty,
    sriDuty: state.sriDuty,
    qctDuty: state.qctDuty,
    calibrationDuty: state.calibrationDuty
  }));

  const smsDuty = dutyStates.smsDuty;

  // Filter duty tabs based on user permissions
  const filteredTabs = filterByPermissions(dutyItemTabs, userType);

  // Check if any blockable duty is currently active (excludes QCT and Calibration)
  const getActiveDuty = () => {
    for (const [dutyKey, dutyState] of Object.entries(dutyStates)) {
      if (dutyState?.dutyId) {
        const dutyTab = dutyItemTabs.find(tab => tab.dutyKey === dutyKey);
        // Only consider blockable duties as "active" for blocking purposes
        if (dutyTab?.blockable) {
          return {
            dutyKey,
            dutyTitle: dutyTab?.title || dutyKey,
            dutyId: dutyState.dutyId
          };
        }
      }
    }
    return null;
  };

  const activeDuty = getActiveDuty();

  const handleTabClick = (item) => {
    // If clicking SMS card
    if (item.dutyKey === 'smsDuty') {
      if (activeDuty && activeDuty.dutyKey !== 'smsDuty') {
        if (currentNotification.current) {
          currentNotification.current();
        }
        currentNotification.current = message.warning(
          `Cannot start SMS duty. Please end the current ${activeDuty.dutyTitle} duty first.`,
          5,
          () => { currentNotification.current = null; }
        );
        return;
      }
      setSmsModalVisible(true);
      return;
    }

    if (!item.link) return;

    // QCT and Calibration are always allowed (non-blockable)
    if (!item.blockable) {
      navigate(item.link);
      return;
    }

    // If this is the active blockable duty module, allow navigation
    if (activeDuty && item.dutyKey === activeDuty.dutyKey) {
      navigate(item.link);
      return;
    }

    // If another blockable duty is active, show warning
    if (activeDuty && item.dutyKey !== activeDuty.dutyKey && item.blockable) {
      if (currentNotification.current) {
        currentNotification.current();
      }
      currentNotification.current = message.warning(
        `Cannot start ${item.title} duty. Please end the current ${activeDuty.dutyTitle} duty first.`,
        5,
        () => { currentNotification.current = null; }
      );
      return;
    }

    // No active blockable duty, allow navigation
    navigate(item.link);
  };

  const handleStartDuty = () => {
    setSmsModalVisible(false);
    navigate('/sms/sms/dutyStart');
  };

  const handleResumeDuty = () => {
    if (!smsDuty?.dutyId) {
      message.info("No active SMS duty found to resume. Please click 'Start Duty' to begin a new shift.");
      return;
    }
    setSmsModalVisible(false);
    navigate('/sms/sms/dutyEnd');
  };

  const renderDutyItemTabs = () =>
    filteredTabs.map(item => {
      // Check if this specific duty is active
      const isDutyActive = dutyStates[item.dutyKey]?.dutyId;

      // Check if this duty should be blocked (only blockable duties can be blocked)
      const isBlocked = activeDuty && item.dutyKey !== activeDuty.dutyKey && item.blockable;
      
      const isPathActive = item.link && location.pathname.startsWith(item.link);

      return (
        <div key={item.id}>
          {isBlocked ? (
            <Tooltip title={`Cannot start ${item.title} duty. End current ${activeDuty.dutyTitle} duty first.`}>
              <Tab
                title={item.title}
                icon={item.icon}
                onClick={() => handleTabClick(item)}
                className="opacity-60 cursor-not-allowed bg-gray-100"
              />
            </Tooltip>
          ) : (
            <Tab
              title={item.title}
              icon={item.icon}
              onClick={() => handleTabClick(item)}
              isActive={(isDutyActive && item.blockable) || isPathActive}
            />
          )}
        </div>
      );
    });

  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderDutyItemTabs()}
      </div>

      {filteredTabs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No duty modules available for your role.</p>
        </div>
      )}

      {/* SMS Start/Resume Duty Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#13343b', fontSize: '1.1rem', fontWeight: 600 }}>
            <MessageOutlined style={{ color: '#21808d' }} />
            <span>SMS Inspection Duty</span>
          </div>
        }
        open={smsModalVisible}
        onCancel={() => setSmsModalVisible(false)}
        footer={null}
        centered
        width={480}
      >
        <div style={{ padding: '8px 0' }}>
          {/* Active Duty Status Banner */}
          {smsDuty?.dutyId ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontWeight: 600, color: '#065f46', fontSize: '0.9rem' }}>Active Duty in Progress</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857', display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span><strong>Shift:</strong> {smsDuty.shift || '-'}</span>
                <span><strong>SMS:</strong> {smsDuty.sms || '-'}</span>
                <span><strong>Grade:</strong> {smsDuty.railGrade || '-'}</span>
                {smsDuty.startTime && <span><strong>Start:</strong> {smsDuty.startTime}</span>}
              </div>
            </div>
          ) : (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 16px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#64748b',
              }}
            >
              No active SMS duty is currently in progress.
            </div>
          )}

          {/* Options Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Start Duty Card */}
            <div
              onClick={!smsDuty?.dutyId ? handleStartDuty : undefined}
              style={{
                border: !smsDuty?.dutyId ? '1.5px solid #21808d' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: !smsDuty?.dutyId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                background: !smsDuty?.dutyId ? '#ffffff' : '#f8fafc',
                opacity: !smsDuty?.dutyId ? 1 : 0.65,
                boxShadow: !smsDuty?.dutyId ? '0 2px 4px rgba(33, 128, 141, 0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!smsDuty?.dutyId) {
                  e.currentTarget.style.background = 'rgba(33, 128, 141, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!smsDuty?.dutyId) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: !smsDuty?.dutyId ? 'rgba(33, 128, 141, 0.12)' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: !smsDuty?.dutyId ? '#21808d' : '#94a3b8',
                    fontSize: '20px',
                  }}
                >
                  <PlayCircleOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: !smsDuty?.dutyId ? '#13343b' : '#64748b', fontSize: '0.95rem' }}>Start Duty</div>
                  <div style={{ fontSize: '0.8rem', color: '#626c71' }}>
                    {smsDuty?.dutyId ? 'Duty already in progress. End current duty to start new.' : 'Start a new SMS inspection duty shift'}
                  </div>
                </div>
              </div>
              <Button
                type={!smsDuty?.dutyId ? 'primary' : 'default'}
                disabled={Boolean(smsDuty?.dutyId)}
                style={!smsDuty?.dutyId ? { background: '#21808d', borderColor: '#21808d', fontWeight: 600 } : { fontWeight: 600 }}
              >
                Start
              </Button>
            </div>

            {/* Resume Duty Card */}
            <div
              onClick={smsDuty?.dutyId ? handleResumeDuty : undefined}
              style={{
                border: smsDuty?.dutyId ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 16px',
                cursor: smsDuty?.dutyId ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                background: smsDuty?.dutyId ? '#ffffff' : '#f8fafc',
                opacity: smsDuty?.dutyId ? 1 : 0.65,
                boxShadow: smsDuty?.dutyId ? '0 2px 4px rgba(16, 185, 129, 0.08)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (smsDuty?.dutyId) {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (smsDuty?.dutyId) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: smsDuty?.dutyId ? 'rgba(16, 185, 129, 0.12)' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: smsDuty?.dutyId ? '#10b981' : '#94a3b8',
                    fontSize: '20px',
                  }}
                >
                  <SyncOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: smsDuty?.dutyId ? '#13343b' : '#64748b', fontSize: '0.95rem' }}>
                    Resume Duty
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#626c71' }}>
                    {smsDuty?.dutyId ? `Resume ongoing ${smsDuty.sms || 'SMS'} shift` : 'No active duty to resume'}
                  </div>
                </div>
              </div>
              <Button
                type={smsDuty?.dutyId ? 'primary' : 'default'}
                disabled={!smsDuty?.dutyId}
                style={smsDuty?.dutyId ? { background: '#10b981', borderColor: '#10b981', fontWeight: 600 } : { fontWeight: 600 }}
              >
                Resume
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default Duty;