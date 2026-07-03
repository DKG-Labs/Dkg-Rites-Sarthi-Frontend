/* eslint-disable */
﻿import React, { useState, useEffect } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import FormInputItem from '../../../../../components/DKG_FormInputItem'
import { Select, Form, Checkbox, message } from 'antd';
import { testStatusDropdown } from '../../../../../utils/Constants';
import Btn from '../../../../../components/DKG_Btn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { apiCall } from '../../../../../utils/CommonFunctions';

const MicroTest = () => {
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
    const {heatNo, strand, sampleId, sampleLot, sampleType, isEditMode, completedTestData} = state;

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: "MICRO",
        microStatus: "",
        microStructurePearlitic: false
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
        console.log("🔍 Micro Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Micro form with completed test data:", completedTestData);

            setFormData(prev => ({
                ...prev,
                microStatus: completedTestData.microStatus || "",
                microStructurePearlitic: completedTestData.microStructurePearlitic || false
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                microStatus: completedTestData.microStatus || "",
                microStructurePearlitic: completedTestData.microStructurePearlitic || false
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

    return (
        <div>
            <SubHeader
                title="Micro Test"
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
                        label="Micro Structure Pearlitic"
                        name="microStructurePearlitic"
                        valuePropName="checked"
                    >
                        <Checkbox onChange={(e) => handleChange("microStructurePearlitic", e.target.checked)} />
                    </Form.Item>
                    
                    <Form.Item
                        label="Micro Test Status"
                        name="microStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("microStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default MicroTest