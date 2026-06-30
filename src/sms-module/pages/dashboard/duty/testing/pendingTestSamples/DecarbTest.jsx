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

const DecarbTest = () => {
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
        return "Decarb Test"; // Default fallback
    };

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: "DECARB",
        decarbStatus: "",
        decarb1: "",
        decarb2: "",
        decarb3: ""
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
        console.log("🔍 Decarb Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Decarb form with completed test data:", completedTestData);

            // Convert BigDecimal values to strings for form inputs
            const decarb1Str = completedTestData.decarb1 ? completedTestData.decarb1.toString() : "";
            const decarb2Str = completedTestData.decarb2 ? completedTestData.decarb2.toString() : "";
            const decarb3Str = completedTestData.decarb3 ? completedTestData.decarb3.toString() : "";

            setFormData(prev => ({
                ...prev,
                decarbStatus: completedTestData.decarbStatus || "",
                decarb1: decarb1Str,
                decarb2: decarb2Str,
                decarb3: decarb3Str
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                decarbStatus: completedTestData.decarbStatus || "",
                decarb1: decarb1Str,
                decarb2: decarb2Str,
                decarb3: decarb3Str
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

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

                    <FormInputItem label="Decarb 1" name="decarb1" onChange={handleChange}/>
                    <FormInputItem label="Decarb 2" name="decarb2" onChange={handleChange}/>
                    <FormInputItem label="Decarb 3" name="decarb3" onChange={handleChange}/>
                    
                    <Form.Item
                        label="Decarb Test Status"
                        name="decarbStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("decarbStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default DecarbTest