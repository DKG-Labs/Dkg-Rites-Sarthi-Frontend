/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../../../../utils/CommonFunctions';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import { Form, Select, Checkbox, Button, message } from 'antd';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import Btn from '../../../../../components/DKG_Btn';
import R260And880 from './R260And880';
import HH1080 from './testSampleList/HH1080';

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
    {
      label: "Lot 1",
      value: "Lot 1",
    },
    {
      label: "Lot 2",
      value: "Lot 2",
    },
    {
      label: "NA",
      value: "NA",
    },
  ];

  
  
  const RetestSample = ({railGrade, dutyId, editMode, editData, generalInfo}) => {
    const [strandList, setStrandList] = useState([]);
    const [form] = Form.useForm();
    const [formData, setFormData] = useState(editMode && editData ? {
        testType: editData.dutyId || null, // Backend passes testType in dutyId field
        sampleNo: editData.sampleLot || null,
        heatNo: editData.heatNo || null,
        selectedStrands: editData.strand ? [editData.strand.toString()] : []
    } : null);

    // Initialize form data with edit data when in edit mode
    useEffect(() => {
        if (editMode && editData) {
            setFormData({
                testType: editData.dutyId || null, // Backend passes testType in dutyId field
                sampleNo: editData.sampleLot || null,
                heatNo: editData.heatNo || null,
                selectedStrands: editData.strand ? [editData.strand.toString()] : []
            });
        }
    }, [editMode, editData]);
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const handleChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: value,
        });
    }

    console.log("Fprmdata: ", strandList)

    useEffect(() => {
        const fetchStrandData = async () => {
            if (formData?.heatNo && formData?.sampleNo) {
                try {
                    const response = await apiCall(
                        'GET',
                        `/rolling/getStrandNoList?sampleNo=${formData.sampleNo}&heatNo=${formData.heatNo}`,
                        token
                    );
                    // Handle the response data as needed
                    console.log(response);
                    setStrandList(response?.data?.responseData?.strandNoList || []);
                } catch (error) {
                    console.error('Error fetching strand data:', error);
                }
            }
        };

        fetchStrandData();
    }, [formData?.heatNo, formData?.sampleNo, token]);

    const handleSubmit = async () => {
        const payload = {
            railGrade: railGrade,
            heatNumber: formData?.heatNo,
            strandNumber: formData?.selectedStrands || [],
            sampleLot: formData?.sampleNo,
            testType: formData?.testType,
            dutyId: dutyId
        };

        console.log("Retest Sample Payload:", payload);
        console.log("Rail Grade from props:", railGrade);

        try {
            if (editMode) {
                // For retest samples, we'll use the same endpoint but with update logic
                // Note: You might need to create a separate update endpoint for retest samples
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
                    generalInfo: generalInfo, // Preserve the original general info
                    redirectTo: "/stage/home"
                }
            });
        } catch (error) {
            message.error(editMode ? "Failed to update retest sample." : "Failed to save retest sample.");
        }
    };

    return (
        <>
            {(railGrade === "880" || railGrade === "R260") && (
                <R260And880 railGrade={railGrade} dutyId={dutyId} editMode={editMode} editData={editData} />
                // <Form 
                //     form={form} 
                //     layout='vertical'
                //     onFinish={handleSubmit}
                // >
                //     <Form.Item label='Test Type' name='testType'>
                //         <Select options={testTypeDropdown} onChange={(e) => handleChange('testType', e)} />
                //     </Form.Item>
                //     <Form.Item label='Sample Lot' name='sampleNo'>
                //         <Select options={sampleLotDd} onChange={(e) => handleChange('sampleNo', e)} />
                //     </Form.Item>

                //     <FormInputItem label="Heat No." name="heatNo" onChange={handleChange}/>

                //     {strandList.length > 0 && (
                //         <Form.Item label="Strand List" name="selectedStrands">
                //             <Checkbox.Group
                //                 options={strandList.map(strand => ({
                //                     label: strand,
                //                     value: strand
                //                 }))}
                //                 onChange={(values) => handleChange('selectedStrands', values)}
                //             />
                //         </Form.Item>
                //     )}
                //     <Form.Item className='flex justify-center'>
                //         <Btn type="primary" htmlType="submit">
                //             Submit
                //         </Btn>
                //     </Form.Item>
                // </Form>
            )}

            {
                (railGrade === "1080HH" || railGrade==="R350HT") && (
                  <HH1080 railGrade={railGrade} dutyId={dutyId} editMode={editMode} editData={editData} />
                )
            }
        </>
    )
}

export default RetestSample
