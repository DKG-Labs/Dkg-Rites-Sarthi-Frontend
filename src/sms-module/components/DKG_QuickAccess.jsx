/* eslint-disable */
import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined, IdcardOutlined, FileTextOutlined,
  RobotOutlined, LineChartOutlined, ProfileOutlined, SettingOutlined, PieChartOutlined
} from '@ant-design/icons';
import { hasPermission } from '../utils/permissions';
import MainCard from './DKG_MainCard';

const navigationCards = [
  { id: 1, title: 'Home',          icon: <HomeOutlined />,       description: 'Dashboard Overview',   link: '/', color: '#21808d', permission: 'home' },
  { id: 2, title: 'Duty',          icon: <IdcardOutlined />,     description: 'Manage Duties',         link: '/duty', color: '#3b82f6', hasBackground: true, permission: 'duty' },
  { id: 3, title: 'Records',       icon: <FileTextOutlined />,   description: 'View Records',          link: '/records', color: '#f59e0b', count: 1, permission: 'records' },
  { id: 4, title: 'AI System',     icon: <RobotOutlined />,      description: 'AI Analysis',           link: '/ai-system', color: '#8b5cf6', permission: 'ai-system' },
  { id: 5, title: 'Data Analysis', icon: <LineChartOutlined />,  description: 'Analytics Dashboard',   link: '/data-analysis', color: '#ec4899', count: 0, permission: 'data-analysis' },
  { id: 6, title: 'ISO Reports',   icon: <ProfileOutlined />,    description: 'Generate Reports',      link: '/iso-reports', color: '#14b8a6', count: 4, permission: 'iso-reports' },
  { id: 7, title: 'BSP Dashboard', icon: <PieChartOutlined />,       description: 'BSP Monitoring',        link: '/bsp',         color: '#21808d', permission: 'bsp', hasBackground: true },
  { id: 8, title: 'Admin',         icon: <SettingOutlined />,    description: 'User Management',       link: '/admin',       color: '#ef4444', hasBackground: true, permission: 'admin' },
];

const QuickAccess = () => {
    const { userType } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const location = useLocation();

    const getAccessibleCards = () => {
        if (!userType) return [];
        return navigationCards.filter(card => hasPermission(userType, card.permission));
    };

    const accessibleCards = getAccessibleCards();

    if (accessibleCards.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-primary rounded-full" />
                <span className="text-xs font-bold uppercase tracking-wider text-darkBlue">
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {accessibleCards.map(card => {
                        const getPathSegment = (path) => path.split('/').filter(Boolean)[0];
                        const currentSegment = getPathSegment(location.pathname);
                        const cardSegment = getPathSegment(card.link);
                        
                        const isActive = card.link !== '#' && (
                            (card.link === '/' && location.pathname === '/') ||
                            (cardSegment && currentSegment === cardSegment)
                        );

                        return (
                            <MainCard
                                key={card.id}
                                title={card.title}
                                subtitle={card.description}
                                count={card.count}
                                icon={React.cloneElement(card.icon, { style: { fontSize: '20px', color: card.hasBackground ? '#fff' : card.color } })}
                                isActive={isActive}
                                hasBackground={card.hasBackground}
                                onClick={() => navigate(card.link)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default QuickAccess;
