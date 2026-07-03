/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom'
import { apiCall } from '../../../../../utils/CommonFunctions';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import FormContainer from '../../../../../components/DKG_FormContainer';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import { Form, message } from 'antd';
import Btn from '../../../../../components/DKG_Btn';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';

const paramDropList = [
  {
    key: "K1c",
    value: "K1c"
  },
  {
    key: "Kq",
    value: "Kq"
  },
  {
    key: "Kq*",
    value: "Kq*"
  },
]

const Fracture = () => {
    const {qctId} = useParams();
    const [form] = Form.useForm()

    const {token} = useSelector(state => state.auth);

    const [formData, setFormData] = useState({
      mill: "",
      railGrade: "",
      railSection: "",
      sampleMonth: "",
      heatNo: "",
      strandNo: "",
      sampleId: "",
      parameter: "",
      value: "",
      id: "",
      remarks: ""
    })

    const populateData = async () => {
        try{
            const {data} = await apiCall("GET", `/qct/getQctDtlByQctId?qctId=${qctId}`, token)
            setFormData({...formData, ...data?.responseData})
        }
        catch(error){

        }
    }

    const handleChange = (fieldName, value) => {
      setFormData(prev => ({...prev, [fieldName]: value}))
    }

    const {dutyId} = useSelector(state => state.qctDuty)
    // Use dummy duty ID if no actual duty is started
    const qctGeneralInfo = {
      date: new Date().toLocaleDateString('en-GB'),
      shift: 'A', // Default shift
      dutyId: dutyId || 'QCT_DUMMY_DUTY_001' // Use dummy duty ID when no actual duty
    };

    const navigate = useNavigate();

    const handleSubmit = async () => {

      const payload = {
        // Use dummy duty ID since QCT works without actual duty
        dutyId: qctGeneralInfo.dutyId || 'QCT_DUMMY_DUTY_001',
        remarks: formData.remarks,
        dtlList: [{
          id: formData.qctId,
          parameter: formData.parameter,
          value: formData.value
          
        }
        ]
      }

      try {
        await apiCall("POST", "/qct/saveFractureToughness", token, payload)
        message.success("Data saved successfully.");
        navigate("/sms/qct/newSampleDeclaration")
      }
      catch(error){}
    }

    useEffect(() => {
        populateData();
    }, [])

    useEffect(() => {
      form.setFieldsValue(formData)
    }, [formData, form])
  return (
    <FormContainer>
       <SubHeader title="Fracture Toughness" link="/qct/newSampleDeclaration" />
       <GeneralInfo data={qctGeneralInfo} />
      <Form form={form} layout="vertical" className="grid grid-cols-2 gap-x-4" onFinish={handleSubmit}>

      <FormInputItem name="mill" label="Mill" disabled />
      <FormInputItem name="railGrade" label="Rail Grade" disabled />
      <FormInputItem name="railSection" label="Rail Section" disabled />
      <FormInputItem name="sampleMonth" label="Sample Month" disabled />
      <FormInputItem name="heatNo" label="Heat Number" disabled />
      <FormInputItem name="strandNo" label="Strand" disabled />
      <FormInputItem name="sampleId" label="Sample ID" disabled />
      <FormDropdownItem name="parameter" formField="parameter" dropdownArray={paramDropList} onChange={handleChange} label="Value Reported as" visibleField='value' valueField="key" />
      <FormInputItem name="value" label="Value of Reported Parameter" onChange={handleChange} />
      <FormInputItem name="remarks" className="col-span-2" label="Remarks" onChange={handleChange} />
      <div className="col-span-2 mx-auto">
        <Btn htmlType="submit" text="Save" />
      </div>
      </Form>
    </FormContainer>
  )
}

export default Fracture
