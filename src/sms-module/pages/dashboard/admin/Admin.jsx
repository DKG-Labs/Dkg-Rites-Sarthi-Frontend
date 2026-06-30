/* eslint-disable */
import { useState } from 'react'
import { useSelector } from 'react-redux'
import UserManagement from './UserManagement'
import { Typography, Card, Row, Col, Button, Alert } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  SafetyOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const Admin = () => {
  const { userType, firstName } = useSelector(state => state.auth)
  const [activeSection, setActiveSection] = useState('dashboard')

  // Admin sections available for different user types
  const adminSections = [
    {
      id: 'userManagement',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <TeamOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
      bgColor: '#f0f9ff',
      borderColor: '#1890ff',
      permissions: ['MAIN_ADMIN', 'LOCAL_ADMIN'],
      component: <UserManagement />
    }
    // Future admin sections can be added here
  ];

  // Filter sections based on user permissions
  const getAccessibleSections = () => {
    return adminSections.filter(section =>
      section.permissions.includes(userType)
    );
  };

  // Render admin dashboard
  const renderAdminDashboard = () => {
    const accessibleSections = getAccessibleSections();

    return (
      <div className="p-6">
        {/* Welcome Section */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2 text-gray-800">
                <UserOutlined className="mr-3 text-purple-600" />
                Admin Panel
              </Title>
              <Text className="text-gray-600 text-lg">
                Welcome, {firstName}! ({userType?.replace('_', ' ')})
              </Text>
            </div>
          </div>
        </Card>

        {/* Permission Info for LOCAL_ADMIN */}
        {userType === 'LOCAL_ADMIN' && (
          <Alert
            message="Local Admin Permissions"
            description="You have access to user management functions. You can view, add, and activate/deactivate users, but cannot delete users or modify user roles."
            type="info"
            showIcon
            className="mb-6"
          />
        )}

        {/* Admin Sections */}
        <Row gutter={[24, 24]}>
          {accessibleSections.map(section => (
            <Col xs={24} sm={12} md={8} lg={6} key={section.id}>
              <Card
                hoverable
                className="text-center h-full transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: section.bgColor,
                  borderColor: section.borderColor,
                  borderWidth: '2px'
                }}
                bodyStyle={{ padding: '24px 16px' }}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-4">
                    {section.icon}
                  </div>
                  <Title level={4} className="mb-3" style={{ color: section.borderColor }}>
                    {section.title}
                  </Title>
                  <Text className="text-gray-600 text-sm mb-4 text-center">
                    {section.description}
                  </Text>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => setActiveSection(section.id)}
                    style={{ backgroundColor: section.borderColor, borderColor: section.borderColor }}
                  >
                    Access
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Quick Stats or Info */}
        <Card className="mt-6">
          <Title level={4}>Admin Information</Title>
          <Text className="text-gray-600">
            This admin panel provides access to system administration functions based on your role permissions.
            Select a section above to get started.
          </Text>
        </Card>
      </div>
    );
  };

  // Render the appropriate section
  const renderActiveSection = () => {
    if (activeSection === 'dashboard') {
      return renderAdminDashboard();
    }

    const section = adminSections.find(s => s.id === activeSection);
    if (section && section.permissions.includes(userType)) {
      return (
        <div>
          <div className="p-4 bg-gray-50 border-b">
            <Button
              type="link"
              onClick={() => setActiveSection('dashboard')}
              className="p-0 mb-2"
            >
              ← Back to Admin Dashboard
            </Button>
            <Title level={3} className="mb-0">{section.title}</Title>
          </div>
          {section.component}
        </div>
      );
    }

    return renderAdminDashboard();
  };

  // Check if user has admin permissions
  if (userType !== 'MAIN_ADMIN' && userType !== 'LOCAL_ADMIN') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={2}>Access Denied</Title>
        <p>You do not have sufficient permissions to access the admin panel.</p>
      </div>
    );
  }

  return renderActiveSection();
}

export default Admin
