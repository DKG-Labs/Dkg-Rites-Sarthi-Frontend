/* eslint-disable */
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../store/slice/authSlice';
import { getOngoingSmsDutyDtls } from '../../store/slice/smsDutySlice';
import { getOngoingRollingDutyDtls } from '../../store/slice/rollingDutySlice';
import { getOngoingViDutyDtls } from '../../store/slice/viDutySlice';
import { getOngoingCalibrationDutyDtls } from '../../store/slice/calibrationDutySlice';
import { getOngoingNdtDutyDtls } from '../../store/slice/ndtDutySlice';
import { getOngoingWeldingDutyDtls } from '../../store/slice/weldingDutySlice';
import { getOngoingQctDutyDtls } from '../../store/slice/qctDutySlice';
import { getOngoingSriDutyDtls } from '../../store/slice/sriDutySlice';

import Btn from '../../components/DKG_Btn';
import { ReactComponent as Logo } from '../../assets/images/logo.svg';
import FormBody from '../../components/DKG_FormBody';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Input, Form } from 'antd';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });

  const handleFormValueChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFormSubmit = async (values) => {
    try {
      await dispatch(login(values)).unwrap();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const populateAllOngoingDutyDtls = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(getOngoingSmsDutyDtls()).unwrap(),
        dispatch(getOngoingRollingDutyDtls()).unwrap(),
        dispatch(getOngoingCalibrationDutyDtls()).unwrap(),
        dispatch(getOngoingNdtDutyDtls()).unwrap(),
        dispatch(getOngoingViDutyDtls()).unwrap(),
        dispatch(getOngoingSriDutyDtls()).unwrap(),
      ]);
      navigate("/");
    } catch (error) {}
  }, [dispatch, navigate]);

  useEffect(() => {
    if (token) populateAllOngoingDutyDtls();
  }, [token, populateAllOngoingDutyDtls]);

  return (
    <div className="login-page">
      <header className="login-header">
        <Logo width={120} height={40} />
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2.5rem 2rem',
            width: '100%',
            maxWidth: '420px',
            fontFamily: "var(--font-primary)",
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <Logo width={160} height={60} style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Welcome Back
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Please enter your credentials to login
            </p>
          </div>

          <FormBody onFinish={handleFormSubmit} initialValues={formData} layout="vertical">
            <Form.Item
              label="Employee ID"
              name="userId"
              rules={[{ required: true, message: 'Please input your Employee ID!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--neutral-400)' }} />}
                placeholder="Enter Employee ID"
              />
            </Form.Item>
            
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--neutral-400)' }} />}
                placeholder="Enter Password"
              />
            </Form.Item>

            <Btn htmlType="submit" className="w-full mt-4" style={{ height: '42px', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>
              Log In
            </Btn>
          </FormBody>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--neutral-200)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>
              Account credentials unavailable? Request Admin for your credentials.
            </div>
            <button
              onClick={() => navigate('/change-password')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary-color)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
