/* eslint-disable */
﻿import React, { useState, useEffect } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import FormInputItem from '../../../../../components/DKG_FormInputItem'
import { Select, Form, message } from 'antd';
import { testStatusDropdown } from '../../../../../utils/Constants';
import Btn from '../../../../../components/DKG_Btn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiCall } from '../../../../../utils/CommonFunctions';

const PHTest = () => {
    const [form] = Form.useForm();

    const navigate = useNavigate();
    const {dutyId} = useSelector(state => state.testingDuty)
    const {token} = useSelector(state => state.auth)
    const handleSubmit = async () => {
        try{
            console.log("🚀 Submitting PH test data:", formData);
            console.log("🔑 Duty ID:", dutyId);
            console.log("📦 Complete payload:", {...formData, dutyId});

            const response = await apiCall("POST", "/testing/completeTest", token, {...formData, dutyId});
            console.log("✅ PH test save response:", response);

            message.success("PH Test Saved Successfully")
            navigate("/sms/testing/home")
        }
        catch(error){
            console.error("❌ Error saving PH test:", error);
            console.error("Error details:", error.response?.data || error.message);
            message.error("Failed to save PH test. Please check console for details.");
        }
    }

    const state = useLocation().state;
    const {heatNo, strand, sampleId, sampleLot, sampleType, isEditMode, completedTestData} = state;

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: "PH",
        phStatus: "",
        phValue: ""
    })

    const handleChange = (fieldName, value) => {
      setFormData(prev => {
        return {
         ...prev,
          [fieldName]: value
        }
      })
    }

    // Effect to pre-fill form data when in edit mode
    useEffect(() => {
        console.log("🔍 PH Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling PH form with completed test data:", completedTestData);

            // Convert BigDecimal values to strings for form inputs
            const phValueStr = completedTestData.phValue ? completedTestData.phValue.toString() : "";

            setFormData(prev => ({
                ...prev,
                phStatus: completedTestData.phStatus || "",
                phValue: phValueStr
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                phStatus: completedTestData.phStatus || "",
                phValue: phValueStr
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

    return (
        <div>
            <SubHeader
                title="PH Test"
                link={"/testing/pendingTestSamples"}
            />
            <FormContainer>
                <Form form={form} layout="vertical" className='grid grid-cols-2 gap-x-2' initialValues={formData} onFinish={handleSubmit}>
                    <FormInputItem label="Heat No." name="heatNumber" disabled className='col-span-2' />
                    <FormInputItem label="Strand" name="strandNumber" disabled />
                    <FormInputItem label="SampleLot" name="sampleLot" disabled />
                    <FormInputItem label="Sample Type" name="sampleType" disabled />
                    <FormInputItem label="Sample ID" name="sampleId" disabled />
                    <FormInputItem label="PH Value" name="phValue" onChange={handleChange} />
                    <Form.Item
                        label="PH Test Status"
                        name="phStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("phStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default PHTest
