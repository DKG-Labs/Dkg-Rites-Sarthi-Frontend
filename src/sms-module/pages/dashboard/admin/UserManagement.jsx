/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Typography, Tag, Switch, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, KeyOutlined, SearchOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { apiCall } from '../../../utils/CommonFunctions';
import DKG_FormInputItem from '../../../components/DKG_FormInputItem';
import DKG_FormDropdownItem from '../../../components/DKG_FormDropdownItem';
import DKG_Btn from '../../../components/DKG_Btn';

const { Title } = Typography;
const { Search } = Input;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterUserType, setFilterUserType] = useState('');

  const { token, userType } = useSelector(state => state.auth);

  const userTypeOptions = [
    { key: 'MAIN_ADMIN', value: 'MAIN_ADMIN' },
    { key: 'LOCAL_ADMIN', value: 'LOCAL_ADMIN' },
    { key: 'MANAGER', value: 'MANAGER' },
    { key: 'INSPECTING_ENGINEER', value: 'INSPECTING_ENGINEER' }
  ];

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiCall('GET', '/admin/users/all', token);
      setUsers(response.data.responseData);
      setFilteredUsers(response.data.responseData);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userType === 'MAIN_ADMIN' || userType === 'LOCAL_ADMIN') {
      fetchUsers();
    }
  }, [userType, token]);

  // Filter users based on search and user type
  useEffect(() => {
    let filtered = users;

    if (searchText) {
      filtered = filtered.filter(user =>
        user.employeeId?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (filterUserType) {
      filtered = filtered.filter(user => user.userType === filterUserType);
    }

    setFilteredUsers(filtered);
  }, [searchText, filterUserType, users]);

  // Check if user has admin permissions
  if (userType !== 'MAIN_ADMIN' && userType !== 'LOCAL_ADMIN') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>Access Denied</Title>
        <p>Only MAIN_ADMIN and LOCAL_ADMIN users can access the User Management section.</p>
      </div>
    );
  }

  // Create user
  const handleCreateUser = async (values) => {
    try {
      await apiCall('POST', '/admin/users/create', token, values);
      message.success('User created successfully');
      setIsCreateModalVisible(false);
      fetchUsers();
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  // Update user
  const handleUpdateUser = async (values) => {
    try {
      await apiCall('PUT', `/admin/users/update/${selectedUser.userId}`, token, values);
      message.success('User updated successfully');
      setIsEditModalVisible(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      message.error('Failed to update user');
    }
  };

  // Update password
  const handleUpdatePassword = async (values) => {
    try {
      await apiCall('PUT', `/admin/users/update-password/${selectedUser.userId}`, token, {
        newPassword: values.newPassword
      });
      message.success('Password updated successfully');
      setIsPasswordModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      message.error('Failed to update password');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await apiCall('DELETE', `/admin/users/${userId}`, token);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
      sorter: (a, b) => a.employeeId.localeCompare(b.employeeId),
    },
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
      sorter: (a, b) => a.lastName.localeCompare(b.lastName),
    },
    {
      title: 'User Type',
      dataIndex: 'userType',
      key: 'userType',
      sorter: (a, b) => a.userType.localeCompare(b.userType),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      sorter: (a, b) => (a.isActive === b.isActive) ? 0 : a.isActive ? -1 : 1,
    },
    {
      title: 'Created Date',
      dataIndex: 'createDate',
      key: 'createDate',
      render: (date) => {
        if (!date) return 'N/A';
        try {
          // Handle array format from backend [year, month, day, hour, minute, second]
          if (Array.isArray(date) && date.length >= 3) {
            const [year, month, day] = date;
            const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS
            return dateObj.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
          // Handle string format
          return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch (error) {
          return 'Invalid Date';
        }
      },
      sorter: (a, b) => new Date(a.createDate) - new Date(b.createDate),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setIsEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            icon={<KeyOutlined />}
            size="small"
            onClick={() => {
              setSelectedUser(record);
              setIsPasswordModalVisible(true);
            }}
          >
            Reset Password
          </Button>
          {/* Only MAIN_ADMIN can delete users */}
          {userType === 'MAIN_ADMIN' && (
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.userId)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>User Management</Title>
        <DKG_Btn
          type="primary"
          icon={<PlusOutlined />}
          text="Add New User"
          onClick={() => setIsCreateModalVisible(true)}
        />
      </div>

      {/* Role-based permissions notification */}
      {userType === 'LOCAL_ADMIN' && (
        <Alert
          message="Local Admin Permissions"
          description="You can view, add, and activate/deactivate users. You cannot delete users or modify user roles."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Search and Filter Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search
          placeholder="Search by Employee ID, First Name, or Last Name"
          allowClear
          style={{ width: 300 }}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Filter by User Type"
          allowClear
          style={{ width: 200 }}
          onChange={setFilterUserType}
        >
          {userTypeOptions.map(option => (
            <Select.Option key={option.key} value={option.value}>
              {option.value}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Users Table */}
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="userId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
        }}
      />

      {/* Create User Modal */}
      <Modal
        title="Create New User"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form onFinish={handleCreateUser} layout="vertical">
          <DKG_FormInputItem
            label="Employee ID"
            name="employeeId"
            placeholder="Enter Employee ID"
            required
          />
          <DKG_FormInputItem
            label="First Name"
            name="firstName"
            placeholder="Enter First Name"
            required
          />
          <DKG_FormInputItem
            label="Last Name"
            name="lastName"
            placeholder="Enter Last Name"
            required
          />
          <DKG_FormDropdownItem
            label="User Type"
            name="userType"
            formField="userType"
            placeholder="Select User Type"
            dropdownArray={userTypeOptions}
            valueField="value"
            visibleField="value"
            onChange={() => {}} // Empty function since Form handles the value
            required
          />
          <DKG_FormInputItem
            label="Password"
            name="password"
            placeholder="Enter Password"
            type="password"
            required
          />
          <Form.Item
            label="Account Status"
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <Space>
              <Button onClick={() => setIsCreateModalVisible(false)}>Cancel</Button>
              <DKG_Btn type="primary" htmlType="submit" text="Create User" />
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedUser(null);
        }}
        footer={null}
        width={600}
      >
        {selectedUser && (
          <Form
            onFinish={handleUpdateUser}
            layout="vertical"
            initialValues={{
              firstName: selectedUser.firstName,
              lastName: selectedUser.lastName,
              userType: selectedUser.userType,
              isActive: selectedUser.isActive !== undefined ? selectedUser.isActive : true,
            }}
          >
            <DKG_FormInputItem
              label="Employee ID"
              value={selectedUser.employeeId}
              disabled
            />
            <DKG_FormInputItem
              label="First Name"
              name="firstName"
              placeholder="Enter First Name"
              required
            />
            <DKG_FormInputItem
              label="Last Name"
              name="lastName"
              placeholder="Enter Last Name"
              required
            />
            <DKG_FormDropdownItem
              label="User Type"
              name="userType"
              formField="userType"
              placeholder="Select User Type"
              dropdownArray={userTypeOptions}
              valueField="value"
              visibleField="value"
              onChange={() => {}} // Empty function since Form handles the value
              required
              disabled={userType === 'LOCAL_ADMIN'} // LOCAL_ADMIN cannot modify user roles
            />
            <Form.Item
              label="Account Status"
              name="isActive"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Item>
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <Space>
                <Button onClick={() => {
                  setIsEditModalVisible(false);
                  setSelectedUser(null);
                }}>Cancel</Button>
                <DKG_Btn type="primary" htmlType="submit" text="Update User" />
              </Space>
            </div>
          </Form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Reset Password"
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          setSelectedUser(null);
        }}
        footer={null}
        width={400}
      >
        {selectedUser && (
          <Form onFinish={handleUpdatePassword} layout="vertical">
            <p>Reset password for: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong></p>
            <DKG_FormInputItem
              label="New Password"
              name="newPassword"
              placeholder="Enter New Password"
              type="password"
              required
            />
            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <Space>
                <Button onClick={() => {
                  setIsPasswordModalVisible(false);
                  setSelectedUser(null);
                }}>Cancel</Button>
                <DKG_Btn type="primary" htmlType="submit" text="Reset Password" />
              </Space>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
