/* eslint-disable */
import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import data from "../../../../../utils/frontSharedData/weldingInspection/WeldingInspection.json";
import { Form, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom'
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import Btn from '../../../../../components/DKG_Btn';
import { TLT } from '../../../../../utils/Constants';
import { apiCall } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';

const { brokenOrNotList } = data;

const TLTTestDetails = () => {
  const [form] = Form.useForm();
  const {machineNo, jointNo} = useLocation().state;
  const [formData, setFormData] = useState({
    machineNo, jointNo, testType: TLT, isBroken: '', remark: '', span: '', loadApplied: '', deflection: ''
  });

  const navigate = useNavigate();

  const handleChange = (fieldName, value) => {

    if(fieldName === "isBroken") {
      setFormData((prev) => {
        return {
          ...prev,
          [fieldName]: value,
          isBrokenDesc: value ? "Broken" : "Not Broken"
        };
      });
    }
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const {token} = useSelector(state => state.auth);
  const weldingGeneralInfo = useSelector(state => state.weldingDuty);
  const handleFormSubmit = async () => {
    try{
      await apiCall('POST', '/welding/saveWeldingTlt', token, {...formData, dutyId: weldingGeneralInfo.dutyId});
      message.success("Data saved successfully.");
      navigate('/sms/welding/testSample');
    }catch(err){}
  };

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData])

  return (
    <FormContainer>
      <SubHeader title="Weld Period Testing Details - TLT" link="/welding/testSample" />
      <GeneralInfo data={weldingGeneralInfo} />

      <Form form={form} layout="vertical" initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
          <FormInputItem label='Machine Number' name='machineNo' onChange={handleChange} disabled/>
          <FormInputItem label="Span (m)" name="span" onChange={handleChange}  required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
          <FormInputItem label="Load Applied (T)" name="loadApplied" onChange={handleChange} required />
          <FormInputItem label="Deflection (mm)" name="deflection" onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
          <FormInputItem label="Load at 20mm Deflection (T)" name="loadAt20MmDeflection" onChange={handleChange} required />
          <FormDropdownItem label="Broken or Not" name="isBrokenDesc" formField="isBroken" dropdownArray={brokenOrNotList} visibleField="value" valueField="key" onChange={handleChange} required />
        </div>

        <FormInputItem label='Remarks' name='remark' onChange={handleChange} required/>

        <div className='flex justify-center'>
          <Btn htmlType='submit' className='w-36'>Save</Btn>
        </div>
      </Form>
    </FormContainer>
  )
}

export default TLTTestDetails