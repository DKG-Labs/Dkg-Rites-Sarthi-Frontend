/* eslint-disable */
import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined, IdcardOutlined, FileTextOutlined,
  RobotOutlined, LineChartOutlined, ProfileOutlined, SettingOutlined, PieChartOutlined
} from '@ant-design/icons';
import Home from './home/Home';
import Duty from './duty/Duty';
import Records from './records/Records';
import AiSystem from './aiSystem/AiSystem';
import DataAnalysis from './dataAnalysis/DataAnalysis';
import IsoReports from './isoReports/IsoReports';
import Admin from './admin/Admin';
import { ActiveTabContext } from '../../context/dashboardActiveTabContext';
import { hasPermission } from '../../utils/permissions';
import MainCard from '../../components/DKG_MainCard';



const navigationCards = [
  { id: 1, title: 'Home',          icon: <HomeOutlined />,       description: 'Dashboard Overview',   tabId: 1, color: '#21808d' },
  { id: 2, title: 'Duty',          icon: <IdcardOutlined />,     description: 'Manage Duties',         tabId: 2, color: '#3b82f6', hasBackground: true },
  { id: 3, title: 'Records',       icon: <FileTextOutlined />,   description: 'View Records',          tabId: 3, color: '#f59e0b', count: 1 },
  { id: 4, title: 'AI System',     icon: <RobotOutlined />,      description: 'AI Analysis',           tabId: 4, color: '#8b5cf6' },
  { id: 5, title: 'Data Analysis', icon: <LineChartOutlined />,  description: 'Analytics Dashboard',   tabId: 5, color: '#ec4899', count: 0 },
  { id: 6, title: 'ISO Reports',   icon: <ProfileOutlined />,    description: 'Generate Reports',      tabId: 6, color: '#14b8a6', count: 4 },
  { id: 7, title: 'BSP Dashboard', icon: <PieChartOutlined />,       description: 'BSP Monitoring',        tabId: 8, color: '#21808d', link: '/bsp', hasBackground: true },
  { id: 8, title: 'Admin',         icon: <SettingOutlined />,    description: 'User Management',       tabId: 7, color: '#ef4444', hasBackground: true },
];

const Dashboard = () => {
  const { activeTab, setActiveTab } = useContext(ActiveTabContext);
  const { userType } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const location = useLocation();


  const getAccessibleCards = () => {
    if (!userType) return [];
    const cardPermissions = { 1:'home', 2:'duty', 3:'records', 4:'ai-system', 5:'data-analysis', 6:'iso-reports', 7:'bsp', 8:'admin' };
    return navigationCards.filter(card => hasPermission(userType, cardPermissions[card.id]));
  };

  const handleCardClick = (tabId) => setActiveTab(tabId);


  const renderTab = () => {
    switch (activeTab) {
      case 1: return <Home />;
      case 2: return <Duty />;
      case 3: return <Records />;
      case 4: return <AiSystem />;
      case 5: return <DataAnalysis />;
      case 6: return <IsoReports />;
      case 7: return <Admin />;
      default: return <Home />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        background: '#f8fafc',
        padding: '1.5rem',
        width: '100%',
        minHeight: '100%',
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Quick Access Cards (admin/main admin) */}
      {(userType === 'LOCAL_ADMIN' || userType === 'MAIN_ADMIN') && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '3px', height: '18px', background: '#21808d', borderRadius: '2px' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#13343b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Access
            </span>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '10px',
              }}
            >
              {getAccessibleCards().map(card => {
                const isActive = card.link 
                  ? location.pathname === card.link 
                  : activeTab === card.tabId;
                return (
                  <MainCard
                    key={card.id}
                    title={card.title}
                    subtitle={card.description}
                    count={card.count}
                    icon={React.cloneElement(card.icon, { style: { fontSize: '20px', color: card.hasBackground ? '#fff' : card.color } })}
                    isActive={isActive}
                    hasBackground={card.hasBackground}
                    onClick={() => {
                        if (card.link) {
                            navigate(card.link);
                        } else {
                            handleCardClick(card.tabId);
                        }
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {renderTab()}
      </div>
    </div>
  );
};

export default Dashboard;