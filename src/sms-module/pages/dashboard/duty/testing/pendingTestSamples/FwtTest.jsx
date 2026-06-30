/* eslint-disable */
import React, { useState, useEffect } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import FormInputItem from '../../../../../components/DKG_FormInputItem'
import { Select, Form, message } from 'antd';
import { testStatusDropdown } from '../../../../../utils/Constants';
import Btn from '../../../../../components/DKG_Btn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiCall } from '../../../../../utils/CommonFunctions';

const FWTTest = () => {
    const [form] = Form.useForm();

    const navigate = useNavigate();
    const {dutyId} = useSelector(state => state.testingDuty)
    const {token} = useSelector(state => state.auth)
    const handleSubmit = async () => {
        try{
            await apiCall("POST", "/testing/completeTest", token, {...formData, dutyId})
            message.success("Test Saved Successfully")
            navigate("/sms/testing/home")
        }
        catch(error){}
    }
    const state = useLocation().state;
    const {heatNo, strand, sampleId, sampleLot, sampleType, testName, isEditMode, completedTestData} = state;

    // Determine the display title based on the test name passed from navigation
    const getTestTitle = () => {
        if (testName) {
            return `${testName} Test`;
        }
        return "FWT Test"; // Default fallback
    };

    // Determine the correct test type based on the test name
    const getTestType = () => {
        if (!testName) return "FWT"; // Default fallback

        const upperTestName = testName.toUpperCase();

        // Map specific FWT variants to their database test types
        if (upperTestName.includes('FWT (ST) - SR') || upperTestName.includes('FWT(ST)-SR')) {
            return "FWT_ST_SR";
        } else if (upperTestName.includes('FWT (HS)') || upperTestName.includes('FWT(HS)')) {
            return "FWT_HS";
        } else if (upperTestName.includes('FWT (ST)') || upperTestName.includes('FWT(ST)')) {
            return "FWT_ST";
        }

        // Default to FWT for any other FWT variant
        return "FWT";
    };

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: getTestType(),
        fwtTestStatus: ""
    })

    // Effect to pre-fill form data when in edit mode
    useEffect(() => {
        console.log("🔍 FWT Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling FWT form with completed test data:", completedTestData);
            setFormData(prev => ({
                ...prev,
                fwtTestStatus: completedTestData.fwtStatus || ""
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                fwtTestStatus: completedTestData.fwtStatus || ""
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

    const handleChange = (fieldName, value) => {
      setFormData(prev => {
        return {
         ...prev,
          [fieldName]: value
        }
      })
    }

    return (
        <div>
            <SubHeader
                title={getTestTitle()}
                link={"/testing/pendingTestSamples"}
            />
            <FormContainer>
                <Form form={form} layout="vertical" className='grid grid-cols-2 gap-x-2' initialValues={formData} onFinish={handleSubmit}>
                    <FormInputItem label="Heat No." name="heatNumber" disabled className='col-span-2' />
                    <FormInputItem label="Strand" name="strandNumber" disabled />
                    <FormInputItem label="SampleLot" name="sampleLot" disabled />
                    <FormInputItem label="Sample Type" name="sampleType" disabled />
                    <FormInputItem label="Sample ID" name="sampleId" disabled />
                    <Form.Item
                        label="FWT Test Status"
                        name="fwtTestStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("fwtTestStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default FWTTest
