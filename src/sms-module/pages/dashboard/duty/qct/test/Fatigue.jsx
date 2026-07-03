/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { apiCall } from '../../../../../utils/CommonFunctions';
import { Form, message } from 'antd';
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import Btn from '../../../../../components/DKG_Btn';

const brokenDropList = [
  {
    key: true,
    value: "Broken"
  },
  {
    key: false,
    value: "Not Broken"
  },
]

const Fatigue = () => {
  const {qctId} = useParams();
  const {token} = useSelector(state => state.auth);

  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    mill: "",
    railGrade: "",
    railSection: "",
    sampleMonth: "",
    strain: "",
    frequency: "",
    stress: "",
    cyclesEndured: "",
    heatNo: "",
    strandNo: "",
    sampleId: "",
    isBroken: "",
    isBrokenDesc: "",
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
      strain: formData.strain,
      frequency: formData.frequency,
      stress: formData.stress,
      cyclesEndured: formData.cyclesEndured,
      dtlList: [{
        id: formData.qctId,
        isBroken: formData.isBroken

      }
      ]
    }

    try {
      await apiCall("POST", "/qct/saveFatigue", token, payload)
      message.success("Data saved successfully.");
      navigate("/sms/qct/newSampleDeclaration")
    }
    catch(error){}
  }

  const handleChange = (fieldName, value) => {
    if(fieldName === "isBroken"){
      setFormData(prev => {
        return {
          ...prev,
          isBroken: value,
          isBrokenDesc: value ? "Broken" : "Not Broken"
        }
      })
    }

    setFormData(prev => ({...prev, [fieldName]: value}))
  }

  useEffect(() => {
      populateData();
  }, [])

    useEffect(() => {
        form.setFieldsValue(formData)
      }, [formData, form])
  return (
    <FormContainer>
      <SubHeader title="Fatigue" link="/qct/newSampleDeclaration" />
    <GeneralInfo data={qctGeneralInfo} />
      <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4" onFinish={handleSubmit}>

      <FormInputItem name="mill" label="Mill" disabled />
      <FormInputItem name="railGrade" label="Rail Grade" disabled />
      <FormInputItem name="railSection" label="Rail Section" disabled />
      <FormInputItem name="sampleMonth" label="Sample Month" disabled />
      <FormInputItem name="strain" label="Strain" onChange={handleChange} />
      <FormInputItem name="frequency" label="Frequency" onChange={handleChange} />
      <FormInputItem name="stress" label="Stress" onChange={handleChange}/>
      <FormInputItem name="cyclesEndured" label="Cycles Endured" onChange={handleChange}/>
      <FormInputItem name="heatNo" label="Heat Number" disabled />
      <FormInputItem name="strandNo" label="Strand" disabled />
      <FormInputItem name="sampleId" label="Sample ID" disabled />
      <FormDropdownItem name="isBrokenDesc" formField="isBroken" dropdownArray={brokenDropList} onChange={handleChange} label="Result" visibleField='value' valueField="key" />
      {/* <FormInputItem name="value" label="Value of Reported Parameter" onChange={handleChange} /> */}
      <FormInputItem name="remarks" className="col-span-2" label="Remarks" onChange={handleChange} />
      <div className="col-span-2 mx-auto">
      <Btn htmlType="submit" text="Save" />
      </div>
      </Form>
    </FormContainer>
  )
}

export default Fatigue
