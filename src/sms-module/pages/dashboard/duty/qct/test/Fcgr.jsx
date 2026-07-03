/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { apiCall } from '../../../../../utils/CommonFunctions';
import FormContainer from '../../../../../components/DKG_FormContainer';
import { Form, message } from 'antd';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import Btn from '../../../../../components/DKG_Btn';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import SubHeader from '../../../../../components/DKG_SubHeader';

const stressNatureDropList = [
  {
    key: "Tensile",
    value: "Tensile"
  },
  {
    key: "Compressive",
    value: "Compressive"
  },
  {
    key: "Item 4",
    value: "Item 4"
  },
]

const Fcgr = () => {
    const {qctId} = useParams();
    const {token} = useSelector(state => state.auth);

    const [form] = Form.useForm();

    const [formData, setFormData] = useState({
      mill: "",
      railGrade: "",
      railSection: "",
      sampleMonth: "",
      heatNo: "",
      strandNo: "",
      sampleId: "",
      mpam10: "",
      mpam13: "",
      id: "",
      remarks: ""
    })

    const navigate = useNavigate();

    const populateData = async () => {
        try{
            const {data} = await apiCall("GET", `/qct/getQctDtlByQctId?qctId=${qctId}`, token)
            setFormData({...formData, ...data?.responseData})
            
        }
        catch(error){

        }
    }

    const {dutyId} = useSelector(state => state.qctDuty)
    // Use dummy duty ID if no actual duty is started
    const qctGeneralInfo = {
      date: new Date().toLocaleDateString('en-GB'),
      shift: 'A', // Default shift
      dutyId: dutyId || 'QCT_DUMMY_DUTY_001' // Use dummy duty ID when no actual duty
    };

    const handleSubmit = async () => {

      const payload = {
        // Use dummy duty ID since QCT works without actual duty
        dutyId: qctGeneralInfo.dutyId || 'QCT_DUMMY_DUTY_001',
        remarks: formData.remarks,
        dtlList: [{
          id: formData.qctId,
          mpam10: formData.mpam10,
          mpam13: formData.mpam13
          
        }
        ]
      }

      try {
        await apiCall("POST", "/qct/saveFcgr", token, payload)
        message.success("Data saved successfully.");
        navigate("/sms/qct/newSampleDeclaration")
      }
      catch(error){}
    }

    const handleChange = (fieldName, value) => {
      setFormData(prev => ({...prev, [fieldName]: value}))
    }

    useEffect(() => {
        populateData();
    }, [])

      useEffect(() => {
          form.setFieldsValue(formData)
        }, [formData, form])
  return (
    <>
    <FormContainer>
      <SubHeader title="FCGR" link="/qct/newSampleDeclaration" />
    <GeneralInfo data={qctGeneralInfo} />
      <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4" onFinish={handleSubmit}>

      <FormInputItem name="mill" label="Mill" disabled />
      <FormInputItem name="railGrade" label="Rail Grade" disabled />
      <FormInputItem name="railSection" label="Rail Section" disabled />
      <FormInputItem name="sampleMonth" label="Sample Month" disabled />
      <FormInputItem name="heatNo" label="Heat Number" disabled />
      <FormInputItem name="strandNo" label="Strand" disabled />
      <FormInputItem name="sampleId" label="Sample ID" disabled />
      <FormInputItem name="mpam10" label="10 MPam^1/2" onChange={handleChange} />
      <FormInputItem name="mpam13" label="13.5MPam^1/2" onChange={handleChange} />
      {/* <FormInputItem name="stress" label="Stress" onChange={handleChange}/>
      <FormDropdownItem name="stressNature" formField="stressNature" dropdownArray={stressNatureDropList} onChange={handleChange} label="Nature Of Stress" visibleField='value' valueField="key" /> */}
      {/* <FormInputItem name="value" label="Value of Reported Parameter" onChange={handleChange} /> */}
      <FormInputItem name="remarks" className="col-span-2" label="Remarks" onChange={handleChange} />
      <div className="col-span-2 mx-auto">
      <Btn htmlType="submit" text="Save" />
      </div>
      </Form>
    </FormContainer>
    </>
  )
}

export default Fcgr
