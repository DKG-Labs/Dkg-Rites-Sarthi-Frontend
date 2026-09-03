/* eslint-disable */
import React, { useContext, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined, CalendarOutlined, HomeOutlined, IdcardOutlined,
  FileTextOutlined, RobotOutlined, LineChartOutlined, ProfileOutlined, SettingOutlined,
  MessageOutlined, AuditOutlined, RadarChartOutlined, ExperimentOutlined, EyeOutlined,
  DeploymentUnitOutlined, CompassOutlined, DatabaseOutlined, ToolOutlined, PlayCircleOutlined,
  SyncOutlined, CheckCircleOutlined, SendOutlined
} from '@ant-design/icons';
import { message, Tooltip, Modal, Button } from 'antd';
import Tab from '../../../components/DKG_Tab';
import { ActiveTabContext } from '../../../context/dashboardActiveTabContext';
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

const Home = () => {
  const { firstName, lastName, userType } = useSelector(state => state.auth);
  const { setActiveTab } = useContext(ActiveTabContext);
  const navigate = useNavigate();
  const location = useLocation();
  const currentNotification = useRef(null);
  const [smsModalVisible, setSmsModalVisible] = useState(false);

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : 'User';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

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
    // SMS card click handler -> opens Start/Resume modal
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
      const isDutyActive = dutyStates[item.dutyKey]?.dutyId;
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

  const s = {
    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  };

  return (
    <div style={{ ...s }}>
      {/* Welcome Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(33,128,141,0.08) 0%, rgba(33,128,141,0.02) 100%)',
          border: '1px solid rgba(33,128,141,0.2)',
          borderLeft: '4px solid #21808d',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(33,128,141,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <UserOutlined style={{ color: '#21808d', fontSize: '18px' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#13343b' }}>
                Welcome, {fullName}!
              </div>
              {userType && (
                <div style={{ fontSize: '0.8rem', color: '#626c71', fontWeight: 500 }}>
                  {userType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#626c71', marginBottom: '0.25rem', justifyContent: 'flex-end' }}>
            <CalendarOutlined style={{ fontSize: '13px' }} />
            <span style={{ fontSize: '0.8rem' }}>{currentDate}</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#21808d' }}>{currentTime}</div>
        </div>
      </div>

      {/* Duty Modules Cards Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '3px', height: '18px', background: '#21808d', borderRadius: '2px' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#13343b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Duty Modules
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderDutyItemTabs()}
        </div>

        {filteredTabs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No duty modules available for your role.</p>
          </div>
        )}
      </div>

      {/* Dashboard Overview Section */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '3px', height: '18px', background: '#21808d', borderRadius: '2px' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#13343b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dashboard Overview
        </span>
      </div>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(94, 82, 64, 0.15)',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: '#626c71', margin: 0, lineHeight: 1.7 }}>
          Welcome to the <strong style={{ color: '#13343b' }}>RITES Quality Assurance System</strong>.
          {(userType === 'LOCAL_ADMIN' || userType === 'MAIN_ADMIN')
            ? ' Use the quick access cards above or the navigation menu to access different modules based on your role permissions.'
            : ' Use the duty cards above or the navigation menu to access different modules based on your role permissions.'
          }
        </p>
      </div>

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
    </div>
  );
};

export default Home;
