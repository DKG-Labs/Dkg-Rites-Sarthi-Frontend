/* eslint-disable */
import React, { useState, useEffect } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import FormInputItem from '../../../../../components/DKG_FormInputItem'
import { Select, Form, message } from 'antd';
import { testStatusDropdown } from '../../../../../utils/Constants';
import { apiCall, handleChange } from '../../../../../utils/CommonFunctions';
import Btn from '../../../../../components/DKG_Btn';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ChemicalTest = () => {
    const [form] = Form.useForm();

    const navigate = useNavigate();
    const {dutyId} = useSelector(state => state.testingDuty)
    const {token} = useSelector(state => state.auth)
    const handleSubmit = async () => {
        try{
            // Use the same endpoint for both create and update - backend handles the logic
            await apiCall("POST", "/testing/completeTest", token, {...formData, dutyId})
            if (isEditMode) {
                message.success("Test Updated Successfully")
            } else {
                message.success("Test Saved Successfully")
            }
            navigate("/sms/testing/home")
        }
        catch(error){
            message.error(isEditMode ? "Error updating test" : "Error saving test")
            console.error("Error:", error)
        }
    }

    const state = useLocation().state;
    const {heatNo, strand, sampleId, sampleLot, sampleType, testName, isEditMode, completedTestData} = state;

    console.log("ChemicalTest component loaded with state:", state);
    console.log("isEditMode:", isEditMode);
    console.log("completedTestData:", completedTestData);

    // Determine the display title based on the test name passed from navigation
    const getTestTitle = () => {
        const baseTitle = testName ? `${testName} Test` : "Chemical Test";
        return isEditMode ? `Edit ${baseTitle}` : baseTitle;
    };

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: "CHEMICAL",
        chemicalLadleStatus: "",
        chemicalProductStatus: ""
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
        console.log("🔍 Chemical Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Chemical form with completed test data:", completedTestData);

            setFormData(prev => ({
                ...prev,
                chemicalLadleStatus: completedTestData.chemicalLadleStatus || "",
                chemicalProductStatus: completedTestData.chemicalProductStatus || ""
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                chemicalLadleStatus: completedTestData.chemicalLadleStatus || "",
                chemicalProductStatus: completedTestData.chemicalProductStatus || ""
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
        <Form.Item
          label="Chemical Ladle Status"
          name="chemicalLadleStatus"
          >
        <Select options={testStatusDropdown} onChange={(val) => handleChange("chemicalLadleStatus", val)}/>
        </Form.Item>
        <Form.Item
          label="Chemical Product Status"
          name="chemicalProductStatus"
          >
        <Select options={testStatusDropdown} onChange={(val) => handleChange("chemicalProductStatus", val)}/>
        </Form.Item>

        <Btn htmlType='submit' text="SAVE" />
            </Form>
      </FormContainer>
    </div>
  )
}

export default ChemicalTest
