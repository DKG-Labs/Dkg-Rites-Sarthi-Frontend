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

const HardnessTest = () => {
    const [form] = Form.useForm();
    const [calculatedValues, setCalculatedValues] = useState({
        hbw1Mean: 0,
        hbw2Mean: 0,
        hbw3: 0,
        hbw3PlusFormula: 0,
        comparisonResult: '',
        maxDifference: 0
    });

    const state = useLocation().state;
    const {heatNo, strand, sampleId, sampleLot, sampleType, isEditMode, completedTestData} = state;

    const [formData, setFormData] = useState({
        heatNumber: heatNo,
        strandNumber: strand,
        sampleId: sampleId,
        sampleLot: sampleLot,
        sampleType: sampleType,
        testType: "HARDNESS",
        hardnessTestStatus: "",
        hardness1a: "",
        hardness1b: "",
        hardness1c: "",
        hardness2a: "",
        hardness2b: "",
        hardness3: "",
        hardness4a: "",
        hardness4b: "",
        hardnessRs: ""
    });

    useEffect(() => {
        calculateValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    // Effect to pre-fill form data when in edit mode
    useEffect(() => {
        console.log("🔍 Hardness Test component mounted with state:", {
            isEditMode,
            completedTestData,
            state
        });

        if (isEditMode && completedTestData) {
            console.log("📝 Pre-filling Hardness form with completed test data:", completedTestData);

            // Convert BigDecimal values to strings for form inputs
            const hardness1aStr = completedTestData.hardness1a ? completedTestData.hardness1a.toString() : "";
            const hardness1bStr = completedTestData.hardness1b ? completedTestData.hardness1b.toString() : "";
            const hardness1cStr = completedTestData.hardness1c ? completedTestData.hardness1c.toString() : "";
            const hardness2aStr = completedTestData.hardness2a ? completedTestData.hardness2a.toString() : "";
            const hardness2bStr = completedTestData.hardness2b ? completedTestData.hardness2b.toString() : "";
            const hardness3Str = completedTestData.hardness3 ? completedTestData.hardness3.toString() : "";
            const hardness4aStr = completedTestData.hardness4a ? completedTestData.hardness4a.toString() : "";
            const hardness4bStr = completedTestData.hardness4b ? completedTestData.hardness4b.toString() : "";
            const hardnessRsStr = completedTestData.hardnessRs ? completedTestData.hardnessRs.toString() : "";

            setFormData(prev => ({
                ...prev,
                hardnessTestStatus: completedTestData.harnessStatus || "",
                hardness1a: hardness1aStr,
                hardness1b: hardness1bStr,
                hardness1c: hardness1cStr,
                hardness2a: hardness2aStr,
                hardness2b: hardness2bStr,
                hardness3: hardness3Str,
                hardness4a: hardness4aStr,
                hardness4b: hardness4bStr,
                hardnessRs: hardnessRsStr
            }));

            // Also set form values for Ant Design form
            form.setFieldsValue({
                hardnessTestStatus: completedTestData.harnessStatus || "",
                hardness1a: hardness1aStr,
                hardness1b: hardness1bStr,
                hardness1c: hardness1cStr,
                hardness2a: hardness2aStr,
                hardness2b: hardness2bStr,
                hardness3: hardness3Str,
                hardness4a: hardness4aStr,
                hardness4b: hardness4bStr,
                hardnessRs: hardnessRsStr
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, completedTestData, form]);

    const calculateValues = () => {
        const values = {
            h1a: parseFloat(formData.hardness1a) || 0,
            h1b: parseFloat(formData.hardness1b) || 0,
            h1c: parseFloat(formData.hardness1c) || 0,
            h2a: parseFloat(formData.hardness2a) || 0,
            h2b: parseFloat(formData.hardness2b) || 0,
            h3: parseFloat(formData.hardness3) || 0
        };

        // Calculate HBW1 (Mean of 1A, 1B, 1C)
        const hbw1Mean = (values.h1a + values.h1b + values.h1c) / 3;

        // Calculate HBW2 (Mean of 2A, 2B)
        const hbw2Mean = (values.h2a + values.h2b) / 2;

        // HBW3 is directly hardness3
        const hbw3 = values.h3;

        // Calculate HBW3 + 0.3(HBW1-HBW3)
        const hbw3PlusFormula = hbw3 + 0.3 * (hbw1Mean - hbw3);

        // Compare HBW2 > HBW3 + 0.3(HBW1-HBW3)
        const comparisonResult = hbw2Mean > hbw3PlusFormula ? 'OK' : 'NOT OK';

        // Calculate Max Difference
        const allValues = [values.h1a, values.h1b, values.h1c, values.h2a, values.h2b, values.h3];
        const validValues = allValues.filter(val => val !== 0);
        const maxDiff = validValues.length ? Math.max(...validValues) - Math.min(...validValues) : 0;

        setCalculatedValues({
            hbw1Mean: hbw1Mean.toFixed(2),
            hbw2Mean: hbw2Mean.toFixed(2),
            hbw3: hbw3.toFixed(2),
            hbw3PlusFormula: hbw3PlusFormula.toFixed(2),
            comparisonResult,
            maxDifference: maxDiff.toFixed(2)
        });
    };

    const handleChange = (fieldName, value) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

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
    return (
        <div>
            <SubHeader
                title="Hardness Test"
                link={"/testing/pendingTestSamples"}
            />
            <FormContainer>
                <Form form={form} layout="vertical" className='grid grid-cols-2 gap-x-2' initialValues={formData} onFinish={handleSubmit}>
                    <FormInputItem label="Heat No." name="heatNumber" disabled className='col-span-2' />
                    <FormInputItem label="Strand" name="strandNumber" disabled />
                    <FormInputItem label="SampleLot" name="sampleLot" disabled />
                    <FormInputItem label="Sample Type" name="sampleType" disabled />
                    <FormInputItem label="Sample ID" name="sampleId" disabled />

                    {/* Input Fields */}
                    <FormInputItem label="Hardness 1A" name="hardness1a" onChange={handleChange}/>
                    <FormInputItem label="Hardness 1B" name="hardness1b" onChange={handleChange}/>
                    <FormInputItem label="Hardness 1C" name="hardness1c" onChange={handleChange}/>
                    <FormInputItem label="Hardness 2A" name="hardness2a" onChange={handleChange}/>
                    <FormInputItem label="Hardness 2B" name="hardness2b" onChange={handleChange}/>
                    <FormInputItem label="Hardness 3" name="hardness3" onChange={handleChange}/>
                    <FormInputItem label="Hardness 4A" name="hardness4a" onChange={handleChange}/>
                    <FormInputItem label="Hardness 4B" name="hardness4b" onChange={handleChange}/>
                    <FormInputItem label="Hardness RS" name="hardnessRs" onChange={handleChange}/>

                    {/* Display Fields */}
                    <FormInputItem label="HBW1 (Mean 1A, 1B, 1C)" value={calculatedValues.hbw1Mean} disabled/>
                    <FormInputItem label="HBW2 (Mean 2A, 2B)" value={calculatedValues.hbw2Mean} disabled/>
                    <FormInputItem label="HBW3" value={calculatedValues.hbw3} disabled/>
                    <FormInputItem label="HBW3 + 0.3(HBW1-HBW3)" value={calculatedValues.hbw3PlusFormula} disabled/>
                    <FormInputItem label="Comparison Result" value={calculatedValues.comparisonResult} disabled/>
                    <FormInputItem label="Max Difference" value={calculatedValues.maxDifference} disabled/>

                    <Form.Item
                        label="Hardness Test Status"
                        name="hardnessTestStatus"
                    >
                        <Select options={testStatusDropdown} onChange={(val) => handleChange("hardnessTestStatus", val)}/>
                    </Form.Item>

                    <Btn htmlType='submit' text="SAVE" />
                </Form>
            </FormContainer>
        </div>
    );
};

export default HardnessTest;