/* eslint-disable */
import {LineChartOutlined, EyeOutlined, ExperimentOutlined, ToolOutlined, DatabaseOutlined, CompassOutlined, DeploymentUnitOutlined, RadarChartOutlined, AuditOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { message, Tooltip } from 'antd';
import { useRef } from 'react';
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
]

const Duty = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useSelector(state => state.auth);

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
      // Close existing notification if any
      if (currentNotification.current) {
        currentNotification.current();
      }

      // Show new notification and store its destroy function
      currentNotification.current = message.warning(
        `Cannot start ${item.title} duty. Please end the current ${activeDuty.dutyTitle} duty first.`,
        5,
        () => {
          // Clear reference when notification disappears
          currentNotification.current = null;
        }
      );
      return;
    }

    // No active blockable duty, allow navigation
    navigate(item.link);
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


    </section>
  )
}

export default Duty