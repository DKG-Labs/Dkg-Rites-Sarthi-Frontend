/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Form, Select, message } from 'antd';
import { apiCall } from '../utils/CommonFunctions';
import { useSelector } from 'react-redux';

const { Option } = Select;

const DKG_UserDropdownItem = ({
  label,
  name,
  formField,
  onChange,
  required,
  className,
  disabled,
  placeholder = "Select a user...",
  value, // Add value prop for pre-populated data
  excludeUserIds = [] // Array of user IDs to exclude from dropdown
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useSelector(state => state.auth);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiCall("GET", "/admin/users/dropdown", token);
      if (data?.responseData) {
        // Filter only active users
        const activeUsers = data.responseData.filter(user => user.isActive);
        setUsers(activeUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  // Format user display text: "Employee ID - First Name Last Name (Role)"
  const formatUserDisplay = (user) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const userType = user.userType ? user.userType.replace(/_/g, ' ') : '';
    return `${user.employeeId} - ${fullName} (${userType})`;
  };

  // Extract user ID from formatted value (e.g., "10618 - John Doe" -> find user with employeeId "10618")
  const extractUserIdFromFormattedValue = (formattedValue) => {
    if (!formattedValue) return null;

    // If value is in format "employeeId - name", extract employee ID
    const employeeIdMatch = formattedValue.match(/^(\d+)\s*-/);
    if (employeeIdMatch) {
      const employeeId = employeeIdMatch[1];
      const user = users.find(u => u.employeeId === employeeId);
      return user?.userId;
    }

    // Fallback: try to find by exact employee ID match
    const user = users.find(u => u.employeeId === formattedValue);
    return user?.userId;
  };

  // Get filtered users (exclude already selected users)
  const getFilteredUsers = () => {
    // Convert excludeUserIds from formatted values to actual user IDs
    const excludeIds = excludeUserIds
      .map(extractUserIdFromFormattedValue)
      .filter(Boolean); // Remove null values

    return users.filter(user => !excludeIds.includes(user.userId));
  };

  // Filter function for search
  const filterOption = (input, option) => {
    const filteredUsers = getFilteredUsers();
    const user = filteredUsers.find(u => u.userId === option.value);
    if (!user) return false;

    const searchText = input.toLowerCase();
    const employeeId = user.employeeId?.toLowerCase() || '';
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const userType = user.userType?.toLowerCase().replace(/_/g, ' ') || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return (
      employeeId.includes(searchText) ||
      firstName.includes(searchText) ||
      lastName.includes(searchText) ||
      fullName.includes(searchText) ||
      userType.includes(searchText)
    );
  };

  // Parse existing value to find matching user
  const getSelectedUserId = () => {
    if (!value || !users.length) return undefined;

    // If value is in format "employeeId - name", extract employee ID
    const employeeIdMatch = value.match(/^(\d+)\s*-/);
    if (employeeIdMatch) {
      const employeeId = employeeIdMatch[1];
      const user = users.find(u => u.employeeId === employeeId);
      return user?.userId;
    }

    // Fallback: try to find by exact employee ID match
    const user = users.find(u => u.employeeId === value);
    return user?.userId;
  };

  // Handle selection - store both employee ID and name
  const handleUserSelection = (userId) => {
    if (!userId) {
      // User cleared the selection
      onChange && onChange(formField, '');
      return;
    }

    const selectedUser = users.find(u => u.userId === userId);
    if (selectedUser && onChange) {
      // Create a formatted string with employee ID and name for storage
      const fullName = `${selectedUser.firstName} ${selectedUser.lastName}`.trim();
      const formattedValue = `${selectedUser.employeeId} - ${fullName}`;
      onChange(formField, formattedValue);
    }
  };

  return (
    <Form.Item
      label={label}
      name={name}
      rules={[{ required: required ? true : false, message: 'Please select a user!' }]}
      className={className}
    >
      <Select
        placeholder={placeholder}
        value={getSelectedUserId()}
        onChange={handleUserSelection}
        disabled={disabled}
        loading={loading}
        showSearch
        allowClear
        filterOption={filterOption}
        optionFilterProp="children"
        style={{ width: '100%' }}
        notFoundContent={loading ? 'Loading...' : 'No users found'}
      >
        {getFilteredUsers().map((user) => (
          <Option key={user.userId} value={user.userId}>
            {formatUserDisplay(user)}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default DKG_UserDropdownItem;
