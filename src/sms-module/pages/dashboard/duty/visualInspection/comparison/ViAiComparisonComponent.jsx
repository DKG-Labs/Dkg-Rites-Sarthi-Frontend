/* eslint-disable */
import React, { useState } from 'react';
import { Card, Input, Button, Alert, Descriptions, Tag, Divider, Typography, Space } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const ViAiComparisonComponent = () => {
    const [railId, setRailId] = useState('');
    const [loading, setLoading] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);
    const [error, setError] = useState(null);

    const handleCompare = async () => {
        if (!railId.trim()) {
            setError('Please enter a Rail ID');
            return;
        }

        setLoading(true);
        setError(null);
        setComparisonData(null);

        try {
            const response = await axios.get(`/vi/compareViWithAiData?railId=${railId}`);
            
            if (response.data && response.data.success) {
                setComparisonData(response.data.data);
            } else {
                setError('Failed to fetch comparison data');
            }
        } catch (err) {
            console.error('Error comparing VI with AI data:', err);
            setError(err.response?.data?.message || 'Error occurred while comparing data');
        } finally {
            setLoading(false);
        }
    };

    const renderComparisonStatus = (matches, title) => {
        return (
            <Tag 
                icon={matches ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                color={matches ? 'success' : 'error'}
            >
                {title}: {matches ? 'Match' : 'Mismatch'}
            </Tag>
        );
    };

    const renderOcrComparison = (ocrComparison) => {
        if (!ocrComparison) return null;

        return (
            <Card title="OCR Comparison (Heat Numbers)" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="Visual Inspection Heat Number">
                        <Text code>{ocrComparison.visualInspectionHeatNumber || 'N/A'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="AI OCR Heat Number">
                        <Text code>{ocrComparison.aiOcrHeatNumber || 'N/A'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {renderComparisonStatus(ocrComparison.matches, 'OCR')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Details">
                        <Text type={ocrComparison.matches ? 'success' : 'danger'}>
                            {ocrComparison.discrepancyDetails}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        );
    };

    const renderSurfaceComparison = (surfaceComparison) => {
        if (!surfaceComparison) return null;

        return (
            <Card title="Surface Defect Detection Comparison" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="Visual Inspection Feedback">
                        <Text>{surfaceComparison.visualInspectionFeedback || 'No feedback'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="AI Surface Detection">
                        <Text>{surfaceComparison.aiSurfaceDetection || 'No detection'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {renderComparisonStatus(surfaceComparison.matches, 'Surface')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Details">
                        <Text type={surfaceComparison.matches ? 'success' : 'danger'}>
                            {surfaceComparison.discrepancyDetails}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        );
    };

    const renderDimensionalComparison = (dimensionalComparison) => {
        if (!dimensionalComparison) return null;

        return (
            <Card title="Dimensional Variation Detection Comparison" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={1} size="small">
                    <Descriptions.Item label="Visual Inspection Dim Feedback">
                        <Text>{dimensionalComparison.visualInspectionDimFeedback || 'No feedback'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="AI Dimensional Detection">
                        <Text>{dimensionalComparison.aiDimensionalDetection || 'No detection'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                        {renderComparisonStatus(dimensionalComparison.matches, 'Dimensional')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Details">
                        <Text type={dimensionalComparison.matches ? 'success' : 'danger'}>
                            {dimensionalComparison.discrepancyDetails}
                        </Text>
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        );
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Visual Inspection vs AI Data Comparison</Title>
            
            <Card style={{ marginBottom: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                        <Text strong>Enter Rail ID to compare Visual Inspection data with AI Dashboard data:</Text>
                    </div>
                    <Space>
                        <Input
                            placeholder="Enter Rail ID (e.g., U191124B001)"
                            value={railId}
                            onChange={(e) => setRailId(e.target.value)}
                            onPressEnter={handleCompare}
                            style={{ width: 300 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<SearchOutlined />}
                            onClick={handleCompare}
                            loading={loading}
                        >
                            Compare Data
                        </Button>
                    </Space>
                </Space>
            </Card>

            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
            )}

            {comparisonData && (
                <div>
                    <Card 
                        title={
                            <Space>
                                <Text strong>Comparison Results for Rail ID: {comparisonData.railId}</Text>
                                {comparisonData.hasDiscrepancies ? (
                                    <Tag color="error">Discrepancies Found</Tag>
                                ) : (
                                    <Tag color="success">All Systems Match</Tag>
                                )}
                            </Space>
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Heat Number">
                                <Text code>{comparisonData.heatNumber || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Summary">
                                <Text type={comparisonData.hasDiscrepancies ? 'danger' : 'success'}>
                                    {comparisonData.comparisonSummary}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Divider>Detailed Comparison</Divider>

                    {renderOcrComparison(comparisonData.ocrComparison)}
                    {renderSurfaceComparison(comparisonData.surfaceDefectComparison)}
                    {renderDimensionalComparison(comparisonData.dimensionalVariationComparison)}
                </div>
            )}
        </div>
    );
};

export default ViAiComparisonComponent;
