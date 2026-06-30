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

const TensileFootTest = () => {
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
        testType: "TENSILE_FOOT",
        tensileFootStatus: "",
        tensileFootYield: "",
        tensileFootUts: "",
        tensileFootEi: ""
    })

    // Effect to pre-fill form data when in edit mode
    useEffect(() => {
        console.log("🔍 TensileFootTest component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Tensile Foot form with completed test data:", completedTestData);
            setFormData(prev => ({
                ...prev,
                tensileFootStatus: completedTestData.tensileFootStatus || "",
                tensileFootYield: completedTestData.tensileFootYield || "",
                tensileFootUts: completedTestData.tensileFootUts || "",
                tensileFootEi: completedTestData.tensileFootEi || ""
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                tensileFootStatus: completedTestData.tensileFootStatus || "",
                tensileFootYield: completedTestData.tensileFootYield || "",
                tensileFootUts: completedTestData.tensileFootUts || "",
                tensileFootEi: completedTestData.tensileFootEi || ""
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

    console.log("FORM: ", formData)

    return (
        <div>
            <SubHeader
                title="Tensile Foot Test"
                link={"/testing/pendingTestSamples"}
            />
            <FormContainer>
                <Form form={form} layout="vertical" className='grid grid-cols-2 gap-x-2' initialValues={formData} onFinish={handleSubmit}>
                    <FormInputItem label="Heat No." name="heatNumber" disabled className='col-span-2' />
                    <FormInputItem label="Strand" name="strandNumber" disabled />
                    <FormInputItem label="SampleLot" name="sampleLot" disabled />
                    <FormInputItem label="Sample Type" name="sampleType" disabled />
                    <FormInputItem label="Sample ID" name="sampleId" disabled />

                    <FormInputItem label="Yield" name="tensileFootYield" onChange={handleChange}/>
                    <FormInputItem label="UTS" name="tensileFootUts" onChange={handleChange}/>
                    <FormInputItem label="Ei" name="tensileFootEi" onChange={handleChange}/>
                    <Form.Item
                        label="Tensile Foot Test Status"
                        name="tensileFootStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("tensileFootStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default TensileFootTest