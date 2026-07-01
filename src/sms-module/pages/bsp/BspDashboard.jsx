/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Tag, 
  Row, 
  Col, 
  Space, 
  Spin, 
  message,
  Statistic,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/CommonFunctions';

const { Title, Text } = Typography;

const BspDashboard = () => {
    const {token} = useSelector(state => state.auth)
    const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [jobStatuses, setJobStatuses] = useState({
    fwt: null,
    macro: null,
    chem: null,
    tensile: null
  });

  const testTypes = [
    {
      key: 'fwt',
      name: 'FWT Test',
      icon: <ExperimentOutlined />,
      color: '#1890ff'
    },
    {
      key: 'macro',
      name: 'Macro',
      icon: <ExperimentOutlined />,
      color: '#52c41a'
    },
    {
      key: 'chem',
      name: 'Chemical',
      icon: <ExperimentOutlined />,
      color: '#faad14'
    },
    {
      key: 'tensile',
      name: 'Tensile Test',
      icon: <ExperimentOutlined />,
      color: '#f5222d'
    }
  ];

  const fetchJobStatus = async (jobType) => {
    try {
      const response = await apiCall('GET', `/bsp/${jobType}/status`, token);
      return response.data.responseData;
    } catch (error) {
      console.error(`Error fetching ${jobType} status:`, error);
      return null;
    }
  };

  const triggerJob = async (jobType) => {
    try {
      setLoading(true);
      await apiCall('POST', `/bsp/${jobType}/trigger`, token);
      message.success(`${jobType.toUpperCase()} job triggered successfully!`);
      // Refresh status after triggering
      setTimeout(() => {
        fetchAllStatuses();
      }, 1000);
    } catch (error) {
      console.error(`Error triggering ${jobType} job:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStatuses = async () => {
    setRefreshing(true);
    const promises = testTypes.map(async (test) => {
      const status = await fetchJobStatus(test.key);
      return { [test.key]: status };
    });

    try {
      const results = await Promise.all(promises);
      const newStatuses = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setJobStatuses(newStatuses);
    } catch (error) {
      console.error('Error fetching job statuses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllStatuses();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running':
        return 'processing';
      case 'Idle':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderJobCard = (testType) => {
    const status = jobStatuses[testType.key];
    const isRunning = status?.status === 'Running';

    return (
      <Card
        key={testType.key}
        title={
          <Space>
            {testType.icon}
            <Text strong style={{ color: testType.color }}>
              {testType.name}
            </Text>
          </Space>
        }
        extra={
          <Tag 
            color={getStatusColor(status?.status)} 
            icon={isRunning ? <SyncOutlined spin /> : <CheckCircleOutlined />}
          >
            {status?.status || 'Unknown'}
          </Tag>
        }
        actions={[
          <Button
            key="trigger"
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={loading}
            disabled={isRunning}
            onClick={() => triggerJob(testType.key)}
            style={{ backgroundColor: testType.color, borderColor: testType.color }}
          >
            Trigger Job
          </Button>
        ]}
        hoverable
        className="h-full"
      >
        {status ? (
          <Space direction="vertical" size="small" className="w-full">
            <Row gutter={16}>
              <Col span={24} style={{ marginBottom: '8px' }}>
                <Statistic
                  title="Last Run"
                  value={formatDate(status.lastRun)}
                  valueStyle={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={24}>
                <Statistic
                  title="Next Run"
                  value={formatDate(status.nextRun)}
                  valueStyle={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Statistic
              title="Last Date Synced"
              value={status.lastDateSynced || 'N/A'}
              valueStyle={{ fontSize: '14px' }}
            />
          </Space>
        ) : (
          <div className="text-center py-4">
            <Spin />
            <Text className="block mt-2">Loading status...</Text>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={2} className="mb-2">
              BSP Job Monitoring Dashboard
            </Title>
            <Text type="secondary">
              Monitor and trigger test jobs for FWT, Macro, Chemical, and Tensile tests
            </Text>
          </div>
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => navigate('/sms/bsp/data')}
              type="primary"
              size="large"
            >
              View Test Records
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAllStatuses}
              loading={refreshing}
              size="large"
            >
              Refresh All
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          {testTypes.map((testType) => (
            <Col key={testType.key} xs={24} sm={12} lg={6}>
              {renderJobCard(testType)}
            </Col>
          ))}
        </Row>

        <Card className="mt-6" title="System Information">
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Total Jobs"
                value={testTypes.length}
                prefix={<ExperimentOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Running Jobs"
                value={Object.values(jobStatuses).filter(status => status?.status === 'Running').length}
                prefix={<SyncOutlined spin />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            {/* <Col span={8}>
              <Statistic
                title="Last Updated"
                value={new Date().toLocaleTimeString()}
                prefix={<ClockCircleOutlined />}
              />
            </Col> */}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default BspDashboard;