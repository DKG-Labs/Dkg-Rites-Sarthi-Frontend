/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../../../../utils/CommonFunctions';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import { Form, Select, Checkbox, message } from 'antd';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import Btn from '../../../../../components/DKG_Btn';

const testTypeDropdown = [
    { value: 'chemical', label: 'Chemical .(P)' },
    { value: 'o2', label: 'O2' },
    { value: 'n2', label: 'N2' },
    { value: 'fwtSt', label: 'FWT (HS)' },
    { value: 'fwtHs', label: 'FWT (St.)' },
    { value: 'fwtStSr', label: 'FWT (St.) - Sr' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'tensileFoot', label: 'Tensile Foot' },
    { value: 'sp', label: 'SP' },
    { value: 'micro', label: 'Micro' },
    { value: 'ir', label: 'IR' },
    { value: 'decarb', label: 'Decarb' },
    { value: 'rsh', label: 'RSH' },
    { value: 'tensile', label: 'Tensile' },
    { value: 'ph', label: 'PH' }
];

const sampleLotDd = [
    { label: "Lot 1", value: "Lot 1" },
    { label: "Lot 2", value: "Lot 2" },
    { label: "NA", value: "NA" },
];

const R260And880 = ({ railGrade, dutyId, editMode, editData }) => {
    const [form] = Form.useForm();

    // Standard strand options for retest samples (not linked to acceptance)
    const standardStrandOptions = [
        { label: 'I', value: 'I' },
        { label: 'II', value: 'II' },
        { label: 'III', value: 'III' },
        { label: 'IV', value: 'IV' },
        { label: 'V', value: 'V' },
        { label: 'VI', value: 'VI' }
    ];

    const [formData, setFormData] = useState(() => {
        // Default structure
        const defaultFormData = {
            testType: null,
            sampleNo: null,
            heatNo: null,
            retestSamples: [
                { retestNumber: 'Retest 1', selectedStrand: null },
                { retestNumber: 'Retest 2', selectedStrand: null },
                { retestNumber: 'Retest 3', selectedStrand: null }
            ]
        };

        // If in edit mode and editData exists, populate with edit data
        if (editMode && editData) {
            return {
                testType: editData.dutyId || null, // Backend passes testType in dutyId field
                sampleNo: editData.sampleLot || null,
                heatNo: editData.heatNo || null,
                // Support multiple retest samples with individual strand selections
                retestSamples: [
                    {
                        retestNumber: 'Retest 1',
                        selectedStrand: editData.strand || null
                    },
                    {
                        retestNumber: 'Retest 2',
                        selectedStrand: null
                    },
                    {
                        retestNumber: 'Retest 3',
                        selectedStrand: null
                    }
                ]
            };
        }

        return defaultFormData;
    });

    // Initialize form data with edit data when in edit mode
    useEffect(() => {
        if (editMode && editData) {
            // Parse multiple strand information from sampleId field
            let allStrands = [];
            let actualSampleId = editData.sampleId;

            if (editData.sampleId && editData.sampleId.includes('|STRANDS:')) {
                const parts = editData.sampleId.split('|STRANDS:');
                actualSampleId = parts[0];
                const strandsString = parts[1];
                allStrands = strandsString.split(',');
            } else if (editData.strand) {
                // Single strand - convert integer back to Roman numeral
                const strandMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
                allStrands = [strandMap[editData.strand] || editData.strand.toString()];
            }

            // Create retest samples array with proper strand assignments
            const retestSamples = [
                {
                    retestNumber: 'Retest 1',
                    selectedStrand: allStrands[0] || null
                },
                {
                    retestNumber: 'Retest 2',
                    selectedStrand: allStrands[1] || null
                },
                {
                    retestNumber: 'Retest 3',
                    selectedStrand: allStrands[2] || null
                }
            ];

            const newFormData = {
                testType: editData.dutyId || null, // Backend passes testType in dutyId field
                sampleNo: editData.sampleLot || null,
                heatNo: editData.heatNo || null,
                sampleId: actualSampleId,
                retestSamples: retestSamples
            };
            setFormData(newFormData);

            // Set form field values
            const formValues = {
                testType: newFormData.testType,
                sampleNo: newFormData.sampleNo,
                heatNo: newFormData.heatNo,
                sampleId: actualSampleId
            };

            // Set individual retest strand values
            retestSamples.forEach((retest, index) => {
                if (retest.selectedStrand) {
                    formValues[`retestStrand_${index}`] = retest.selectedStrand;
                }
            });

            form.setFieldsValue(formValues);
        }
    }, [editMode, editData, form]);
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value,
        });
    }

    const handleRetestStrandChange = (retestIndex, strandValue) => {
        if (!formData?.retestSamples) return;

        const updatedRetestSamples = [...formData.retestSamples];
        updatedRetestSamples[retestIndex].selectedStrand = strandValue;
        setFormData({
            ...formData,
            retestSamples: updatedRetestSamples
        });
    }

    // Remove the useEffect that fetches strand data from acceptance tests
    // Retest samples now use standard strand options (I, II, III, IV, V, VI)

    const handleSubmit = async () => {
        // Collect all selected strands from retest samples
        const selectedStrands = (formData?.retestSamples || [])
            .filter(retest => retest.selectedStrand)
            .map(retest => retest.selectedStrand);

        const payload = {
            railGrade: railGrade,
            heatNumber: formData?.heatNo,
            strandNumber: selectedStrands,
            sampleLot: formData?.sampleNo,
            testType: formData?.testType,
            dutyId: dutyId,
            retestSamples: formData.retestSamples // Include individual retest sample data
        };

        try {
            if (editMode) {
                // Update existing retest sample
                await apiCall(
                    'POST',
                    '/rolling/updateRetestSample',
                    token,
                    payload
                );
                message.success("Retest sample updated successfully.");
            } else {
                // Create new retest sample
                await apiCall(
                    'POST',
                    '/rolling/saveRetestSample',
                    token,
                    payload
                );
                message.success("Sample retest successful.");
            }

            // Navigate to Test Sample - Declaration page after successful save
            navigate("/stage/testSampleMarkingList", {
                state: {
                    module: "stage",
                    dutyId: dutyId,
                    generalInfo: null, // You may need to pass actual general info if available
                    redirectTo: "/stage/home"
                }
            });
        } catch (error) {
            message.error(editMode ? "Failed to update retest sample." : "Failed to save retest sample.");
        }
    };

    return (
        <Form 
            form={form} 
            layout='vertical'
            onFinish={handleSubmit}
        >
            <Form.Item label='Test Type' name='testType'>
                <Select
                    options={testTypeDropdown}
                    value={formData?.testType}
                    onChange={(e) => handleChange('testType', e)}
                />
            </Form.Item>
            <Form.Item label='Sample Lot' name='sampleNo'>
                <Select
                    options={sampleLotDd}
                    value={formData?.sampleNo}
                    onChange={(e) => handleChange('sampleNo', e)}
                />
            </Form.Item>

            <FormInputItem
                label="Heat No."
                name="heatNo"
                value={formData?.heatNo}
                onChange={handleChange}
            />

            {/* Retest Samples with Individual Strand Selection */}
            <div className="mb-6">
                {/* Header Section */}
                <div style={{
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1890ff'
                    }}>
                        🧪 Retest Samples
                    </span>
                    <span style={{
                        fontSize: '12px',
                        color: '#666',
                        fontStyle: 'italic'
                    }}>
                        Select strand numbers for retest samples
                    </span>
                </div>

                {/* Compact Grid Layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px',
                    border: '1px solid #e8e8e8'
                }}>
                    {formData?.retestSamples?.map((retest, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #d9d9d9',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#595959',
                                minWidth: '60px',
                                whiteSpace: 'nowrap'
                            }}>
                                {retest.retestNumber}:
                            </span>
                            <Form.Item
                                name={`retestStrand_${index}`}
                                className="mb-0"
                                initialValue={retest.selectedStrand}
                                style={{ flex: 1 }}
                            >
                                <Select
                                    placeholder="Strand"
                                    options={standardStrandOptions}
                                    value={retest.selectedStrand}
                                    onChange={(value) => handleRetestStrandChange(index, value)}
                                    allowClear
                                    size="small"
                                    style={{ width: '100%', minWidth: '80px' }}
                                />
                            </Form.Item>
                        </div>
                    ))}
                </div>
            </div>
            <Form.Item className='flex justify-center'>
                <Btn type="primary" htmlType="submit">
                    Submit
                </Btn>
            </Form.Item>
        </Form>
    )
}

export default R260And880
