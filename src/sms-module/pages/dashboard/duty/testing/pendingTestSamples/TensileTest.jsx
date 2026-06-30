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

const TensileTest = () => {
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
        testType: "TENSILE",
        tensileTestStatus: "",
        tensileYield: "",
        tensileUts: "",
        tensileEi: ""
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
        console.log("🔍 Tensile Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Tensile form with completed test data:", completedTestData);

            // Convert BigDecimal values to strings for form inputs
            const tensileYieldStr = completedTestData.tensileYield ? completedTestData.tensileYield.toString() : "";
            const tensileUtsStr = completedTestData.tensileUts ? completedTestData.tensileUts.toString() : "";
            const tensileEiStr = completedTestData.tensileEi ? completedTestData.tensileEi.toString() : "";

            setFormData(prev => ({
                ...prev,
                tensileTestStatus: completedTestData.tensileStatus || "",
                tensileYield: tensileYieldStr,
                tensileUts: tensileUtsStr,
                tensileEi: tensileEiStr
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                tensileTestStatus: completedTestData.tensileStatus || "",
                tensileYield: tensileYieldStr,
                tensileUts: tensileUtsStr,
                tensileEi: tensileEiStr
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

    return (
        <div>
            <SubHeader
                title="Tensile Test"
                link={"/testing/pendingTestSamples"}
            />
            <FormContainer>
                <Form form={form} layout="vertical" className='grid grid-cols-2 gap-x-2' initialValues={formData} onFinish={handleSubmit}>
                    <FormInputItem label="Heat No." name="heatNumber" disabled className='col-span-2' />
                    <FormInputItem label="Strand" name="strandNumber" disabled />
                    <FormInputItem label="SampleLot" name="sampleLot" disabled />
                    <FormInputItem label="Sample Type" name="sampleType" disabled />
                    <FormInputItem label="Sample ID" name="sampleId" disabled />
                    

                    <FormInputItem label="Yield" name="tensileYield" onChange={handleChange}/>
                    <FormInputItem label="UTS" name="tensileUts" onChange={handleChange}/>
                    <FormInputItem label="Ei" name="tensileEi" onChange={handleChange}/>
                    <Form.Item
                        label="Tensile Test Status"
                        name="tensileTestStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("tensileTestStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    )
}

export default TensileTest