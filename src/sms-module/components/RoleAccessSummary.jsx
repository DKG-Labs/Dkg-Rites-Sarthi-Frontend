/* eslint-disable */
import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Tag, Typography, Divider } from 'antd';
import { 
  UserOutlined, 
  SafetyCertificateOutlined, 
  SettingOutlined, 
  CrownOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const RoleAccessSummary = () => {
  const { userType, firstName, lastName } = useSelector(state => state.auth);

  if (!userType) return null;

  const getRoleInfo = () => {
    switch (userType) {
      case 'INSPECTING_ENGINEER':
        return {
          title: 'Inspecting Engineer',
          color: 'blue',
          icon: <SafetyCertificateOutlined />,
          description: 'Access to duty modules and ISO reports',
          permissions: [
            'Duty - SMS',
            'Duty - Rolling Stage', 
            'Duty - NDT',
            'Duty - Visual Inspection',
            'Duty - Welding',
            'ISO Reports - Complete',
            'Duty Module Complete Access'
          ]
        };
      case 'MANAGER':
        return {
          title: 'Manager',
          color: 'green',
          icon: <UserOutlined />,
          description: 'Access to duties, records, and data analysis',
          permissions: [
            'All Duty Modules',
            'Records Access',
            'ISO Reports',
            'Data Analysis'
          ]
        };
      case 'LOCAL_ADMIN':
        return {
          title: 'Local Admin',
          color: 'orange',
          icon: <SettingOutlined />,
          description: 'Administrative access with system management',
          permissions: [
            'Duty Management',
            'Records Management',
            'ISO Reports',
            'Admin Functions',
            'Data Analysis',
            'AI System Access'
          ]
        };
      case 'MAIN_ADMIN':
        return {
          title: 'Main Admin',
          color: 'red',
          icon: <CrownOutlined />,
          description: 'Full system access and control',
          permissions: [
            'Full Access to All Modules',
            'Complete System Administration',
            'All User Management',
            'System Configuration'
          ]
        };
      default:
        return {
          title: userType.replace('_', ' '),
          color: 'default',
          icon: <UserOutlined />,
          description: 'Standard user access',
          permissions: []
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <Card 
      className="role-access-summary"
      style={{ maxWidth: 400, margin: '20px auto' }}
    >
      <div className="text-center mb-4">
        <div className="text-2xl mb-2">{roleInfo.icon}</div>
        <Title level={4} className="mb-1">
          {firstName} {lastName}
        </Title>
        <Tag color={roleInfo.color} className="text-sm">
          {roleInfo.title}
        </Tag>
      </div>
      
      <Divider />
      
      <div className="mb-4">
        <Text type="secondary" className="text-sm">
          {roleInfo.description}
        </Text>
      </div>
      
      <div>
        <Title level={5} className="mb-2">Access Permissions:</Title>
        <div className="space-y-1">
          {roleInfo.permissions.map((permission, index) => (
            <div key={index} className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              <Text className="text-sm">{permission}</Text>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default RoleAccessSummary;
