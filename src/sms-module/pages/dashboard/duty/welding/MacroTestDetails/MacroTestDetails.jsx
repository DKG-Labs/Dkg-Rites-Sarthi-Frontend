/* eslint-disable */
import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import { Divider, Form, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom'
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import Btn from '../../../../../components/DKG_Btn';
import { MACRO } from '../../../../../utils/Constants';
import { useSelector } from 'react-redux';
import { apiCall } from '../../../../../utils/CommonFunctions';

const MacroTestDetails = () => {
  const [form] = Form.useForm();
  const { machineNo, jointNo } = useLocation().state;
  const {token} = useSelector(state => state.auth);
  const weldingGeneralInfo = useSelector(state => state.weldingDuty); 
  const [formData, setFormData] = useState({
    machineNo, jointNo, testType: MACRO, remarks: null,
    headL: null,
    webL: null,
    footL: null,
    headR: null,
    webR: null,
    footR: null,
  });
  const navigate = useNavigate();

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const handleFormSubmit = async () => {
    try{
      await apiCall('POST', '/welding/saveMacro', token, {...formData, dutyId: weldingGeneralInfo.dutyId});
      message.success("Data saved successfully.");
      navigate('/sms/welding/testSample');
    }catch(err){}
  };

console.log("Form Data: ", formData);

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData])

  return (
    <FormContainer>
      <SubHeader title="Weld Period Testing Details - Macro" link="/welding/testSample" />
      <GeneralInfo data={weldingGeneralInfo} />

      <Form form={form} initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-1 gap-x-2">
          <FormInputItem label='Machine Number' name='machineNo' onChange={handleChange} disabled/>
        </div>

        {/* <DKG_InteractionTableSec /> */}

        <div className="border grid grid-cols-4 divide-x divide-y divide-gray-300">
          <h3 className="font-semibold p-2 text-center"> </h3>
          <h3 className="font-semibold p-2 text-center">Head</h3>
          <h3 className="font-semibold p-2 text-center">Web</h3>
          <h3 className="font-semibold p-2 text-center">Foot</h3>

          <h3 className="font-semibold p-2 text-center">HAZ Extent (mm)</h3>
          <FormInputItem className="no-border" name='hazHead'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='hazWeb'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='hazFoot'  onChange={handleChange} required/>

          <h3 className="font-semibold p-2 text-center">Foot (L)</h3>
          <FormInputItem className="no-border" name='headL'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='webL'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='footL'  onChange={handleChange} required/>

          <h3 className="font-semibold p-2 text-center">Foot (R)</h3>
          <FormInputItem className="no-border" name='headR'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='webR'  onChange={handleChange} required/>
          <FormInputItem className="no-border" name='footR'  onChange={handleChange} required/>

        </div>

        <Divider />

        <FormInputItem label='Remarks' name='remarks' onChange={handleChange} required/>

        <div className='flex justify-center'>
          <Btn htmlType='submit' className='w-36'>Save</Btn>
        </div>
      </Form>
    </FormContainer>
  )
}

export default MacroTestDetails