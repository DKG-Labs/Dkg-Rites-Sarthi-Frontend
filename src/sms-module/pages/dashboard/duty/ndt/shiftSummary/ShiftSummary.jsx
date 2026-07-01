/* eslint-disable */
import React, { useState, useEffect } from "react";
import FormContainer from '../../../../../components/DKG_FormContainer'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import SubHeader from '../../../../../components/DKG_SubHeader'
import { message, Form } from "antd";
import { useNavigate } from 'react-router-dom'
import FormInputNumberItem from '../../../../../components/DKG_FormInputNumberItem'
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import { useSelector } from "react-redux";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { apiCall, handleChange } from "../../../../../utils/CommonFunctions";
import TextAreaComponent from '../../../../../components/DKG_TextAreaComponent';

const lengthOfRailList = [
    { key: "26", value: "26" },
    { key: "13", value: "13" },
];

function ShiftSummary() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        rollingTableSpeed: null, totalRailsInspected: null, totalUtMarkedRails: null, 
        totalEctMarkedRails: null, bodyStraightnessResultA: null, bodyStraightnessResultA1: null, 
        bodyStraightnessResultMarked: null, totalProfileMarked: null, railLength: null, 
        totalUtOkRails: null, totalUtSuspectedRails: null, totalUtRejectedRails: null, 
        totalRecycledRails: null, ectSuspectedRails: null, remarks: null
    });

    const { token } = useSelector((state) => state.auth);
    const [form] = Form.useForm();
    const ndtGeneralInfo = useSelector(state => state.ndtDuty);
    const [isEditable, setIsEditable] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});

    // Define integer fields that need validation
    const integerFields = [
        'totalRailsInspected', 'totalUtMarkedRails', 'totalEctMarkedRails',
        'bodyStraightnessResultA', 'bodyStraightnessResultA1', 'bodyStraightnessResultMarked',
        'totalProfileMarked', 'railLength', 'totalUtOkRails', 'totalUtSuspectedRails',
        'totalUtRejectedRails', 'totalRecycledRails', 'ectSuspectedRails'
    ];

    // Define decimal fields that need validation (for speed)
    const decimalFields = ['rollingTableSpeed'];

    // Custom validation function for integer and decimal fields
    const validateNumericField = (fieldName, value) => {
        if (integerFields.includes(fieldName)) {
            if (value !== null && value !== undefined && value !== '') {
                if (!/^\d+$/.test(value.toString())) {
                    const friendlyName = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return `${friendlyName} must be a valid integer (no decimals or text allowed)`;
                }
            }
        } else if (decimalFields.includes(fieldName)) {
            if (value !== null && value !== undefined && value !== '') {
                if (!/^\d+(\.\d+)?$/.test(value.toString())) {
                    const friendlyName = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return `${friendlyName} must be a valid number (no text or units allowed)`;
                }
            }
        }
        return null;
    };

    // Enhanced handleChange with validation
    const handleValidatedChange = (fieldName, value, setFormData) => {
        // Validate the field
        const error = validateNumericField(fieldName, value);

        // Update validation errors
        setValidationErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));

        // Show immediate feedback for invalid input
        if (error) {
            message.error(error);
        }

        // Update form data
        handleChange(fieldName, value, setFormData);
    };

    useEffect(() => {
        const fetchShiftSummary = async () => {
            try {
                const response = await apiCall("GET", `/ndt/getShiftSummary?dutyId=${ndtGeneralInfo.dutyId}`, token); 
                if (response && response.data) {
                    setFormData(response.data.responseData);
                    // setIsEditable(false);
                }
            } catch (error) {
                console.error("Error fetching shift summary:", error);
            }
        };

        if (ndtGeneralInfo.dutyId) {
            fetchShiftSummary();
        }
    }, [ndtGeneralInfo.dutyId, token]);

    useEffect(() => {
        form.setFieldsValue(formData);
    }, [formData, form]);

    const handleFormSubmit = async () => {
        // if (!isEditable) return;

        try {
            // Check for existing validation errors
            const hasErrors = Object.values(validationErrors).some(error => error !== null);
            if (hasErrors) {
                message.error("Please fix all validation errors before submitting");
                return;
            }

            // Validate all numeric fields one more time before submission
            let hasValidationError = false;
            const allNumericFields = [...integerFields, ...decimalFields];
            for (const field of allNumericFields) {
                const value = formData[field];
                const error = validateNumericField(field, value);
                if (error) {
                    message.error(error);
                    hasValidationError = true;
                }
            }

            if (hasValidationError) {
                return;
            }

            await apiCall("POST", "/ndt/saveShiftSummary", token, {
                ...formData,
                dutyId: ndtGeneralInfo.dutyId
            });
            message.success("NDT Shift Summary Data saved successfully.");
            navigate("/sms/ndt/home");
        } catch (error) {
            console.error("Error saving shift summary:", error);
            if (error?.response?.data?.responseStatus?.message) {
                message.error(error.response.data.responseStatus.message);
            } else {
                message.error("Failed to save shift summary. Please check your input values.");
            }
        }
    };

    useEffect(() => {
        form.setFieldsValue(formData);
    }, [formData, form]);

    return (
        <FormContainer>
            <SubHeader title="NDT - Shift Summary" link="/ndt/home"/>
            <GeneralInfo data={ndtGeneralInfo} />

            {
                ((ndtGeneralInfo.mill === 'URM') || (ndtGeneralInfo.mill === 'RSM' && ndtGeneralInfo.ndt === 'LR')) && (
                    <Form
                        form={form}
                        initialValues={formData}
                        onFinish={handleFormSubmit}
                        layout="vertical"
                    >
                        <div className="!bg-offWhite opacity-80 flex flex-col border p-2 border-gray-100 rounded-md mb-4 shadow-[4px_4px_4px_4px_rgba(0,0,0,0.1)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Table Speed during Testing (m/s)' name='rollingTableSpeed' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                                <FormInputItem label='Total Rails Inspected' name='totalRailsInspected' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Total UT Marked Rails' name='totalUtMarkedRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                                <FormInputItem label='Total ECT Marked Rails' name='totalEctMarkedRails' placeholder='0'  onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Body Straightness Results(A)' name='bodyStraightnessResultA' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                                <FormInputItem label='Body Straightness Results(A+0.1)' name='bodyStraightnessResultA1' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Body Straightness Results(Mark)' name='bodyStraightnessResultMarked' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                                <FormInputItem label='Total Profile Marked' name='totalProfileMarked' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} required />
                            </div>
                        </div>

                        <TextAreaComponent label="Remarks" name="remarks" onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} className="col-span-2" required />
                        <div className='flex justify-center mt-8'>
                            <Btn htmlType='submit'>Save</Btn>
                        </div>
                    </Form>
                )
            }

            {
                (ndtGeneralInfo.mill === 'RSM' && ndtGeneralInfo.ndt === 'SR') && (
                    <Form
                        form={form}
                        initialValues={formData}
                        onFinish={handleFormSubmit}
                        layout="vertical"
                    >
                        <div className="!bg-offWhite opacity-80 flex flex-col border p-2 border-gray-100 rounded-md mb-4 shadow-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Table Speed during Testing (m/s)' name='rollingTableSpeed' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                                <FormDropdownItem label="Length Of Rail (m)" name="railLength" placeholder='0' formField="railLength" dropdownArray={lengthOfRailList} visibleField={"value"} valueField={"key"} onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Total Rails Inspected' name='totalRailsInspected' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                                <FormInputItem label='Total UT OK Rails' name='totalUtOkRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Total UT Suspected Rails' name='totalUtSuspectedRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                                <FormInputItem label='Total UT Rejected Rails' name='totalUtRejectedRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Total Recycled Rails' name='totalRecycledRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                                <FormInputItem label='ECT Suspected Rails' name='ectSuspectedRails' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 mt-3">
                                <FormInputItem label='Body Straightness Results(A)' name='bodyStraightnessResultA' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                                <FormInputItem label='Body Straightness Results(A+0.1)' name='bodyStraightnessResultA1' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>

                            <div className="grid grid-cols-1 mt-3">
                                <FormInputItem label='Body Straightness Results(Mark)' name='bodyStraightnessResultMarked' placeholder='0' onChange={(fieldName, value) => handleValidatedChange(fieldName, value, setFormData)} disabled={!isEditable} required />
                            </div>
                        </div>

                        <TextAreaComponent label="Remarks" name="remarks" onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled={!isEditable} className="col-span-2" required />

                        {isEditable && (
                            <div className='flex justify-center mt-8'>
                                <Btn htmlType='submit'>Save</Btn>
                            </div>
                        )}
                    </Form>
                )
            }
        </FormContainer>
    );
}

export default ShiftSummary;