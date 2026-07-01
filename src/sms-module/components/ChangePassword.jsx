/* eslint-disable */
import React, { useState } from 'react';
import { message, Modal } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/CommonFunctions';
import Btn from './DKG_Btn';
import { ReactComponent as Logo } from '../assets/images/logo.svg';
import FormBody from './DKG_FormBody';
import FormInputItem from './DKG_FormInputItem';
import FormContainer from './DKG_FormContainer';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleFormValueChange = (fieldName, value) => {
    setFormData(prev => {
      return {
        ...prev,
        [fieldName]: value
      }
    });
  };

  const handleFormSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      message.error('New password and confirm password do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      message.error('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting password change for employee:', formData.employeeId);

      const response = await apiCall(
        'POST',
        '/change-password',
        null, // No token needed as it's a public endpoint
        {
          employeeId: formData.employeeId,
          currentPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }
      );

      console.log('Password change response:', response);

      if (response?.data?.responseStatus?.statusCode === 1) {
        // Show success modal with alert notification
        Modal.success({
          title: 'Password Changed Successfully!',
          content: (
            <div className="text-center py-4">
              <CheckCircleOutlined className="text-green-500 text-4xl mb-3" />
              <p className="text-lg font-medium mb-2">Your password has been updated successfully.</p>
              <p className="text-gray-600">You will be redirected to the login page.</p>
            </div>
          ),
          okText: 'Go to Login',
          centered: true,
          onOk: () => {
            navigate('/login');
          },
          onCancel: () => {
            navigate('/login');
          }
        });
      } else {
        message.error(response?.data?.responseStatus?.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);

      // Show user-friendly error message
      if (error?.response?.data?.responseStatus?.message) {
        message.error(error.response.data.responseStatus.message);
      } else if (error?.message) {
        message.error(error.message);
      } else {
        message.error('An error occurred while changing password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className='bg-darkBlue text-offWhite p-4 fixed top-0 w-full z-30'>
        <h1>Change Password</h1>
      </header>
      <FormContainer className='mt-20 main-content border-none !shadow-none'>
        <main className='w-full max-w-md mx-auto p-6 flex flex-col h-fit justify-center items-center gap-6 bg-white relative z-20 rounded-md'>
          <Logo width={150} height={100} />
          <FormBody onFinish={handleFormSubmit} initialValues={formData}>
            <FormInputItem
              label="Employee ID"
              placeholder="123456"
              name='employeeId'
              onChange={handleFormValueChange}
              required
            />
            <FormInputItem
              label="Current Password"
              placeholder="*****"
              name='oldPassword'
              onChange={handleFormValueChange}
              required
              type="password"
            />
            <FormInputItem
              label="New Password"
              placeholder="*****"
              name='newPassword'
              onChange={handleFormValueChange}
              required
              type="password"
            />
            <FormInputItem
              label="Confirm New Password"
              placeholder="*****"
              name='confirmPassword'
              onChange={handleFormValueChange}
              required
              type="password"
            />
            <Btn htmlType="submit" text="Change Password" loading={loading} />
          </FormBody>

          <div className='text-center'>
            <button
              onClick={() => navigate('/login')}
              className='text-blue-600 hover:text-blue-800 underline text-sm font-medium'
            >
              Back to Login
            </button>
          </div>
        </main>
      </FormContainer>
    </>
  );
};

export default ChangePassword;
