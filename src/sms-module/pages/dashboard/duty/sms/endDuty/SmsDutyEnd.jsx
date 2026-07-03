/* eslint-disable */
import React, { useState } from 'react'
import {FileSearchOutlined, EyeOutlined, PieChartOutlined}from '@ant-design/icons';
import { message } from 'antd';
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';

import TabList from '../../../../../components/DKG_TabList';
import FormBody from '../../../../../components/DKG_FormBody';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import Btn from '../../../../../components/DKG_Btn';
import { useNavigate } from 'react-router-dom';
import { handleChange } from '../../../../../utils/CommonFunctions';
import { useDispatch, useSelector } from 'react-redux';
import { endSmsDuty } from '../../../../../store/slice/smsDutySlice';

const smsDutyEndTabs = [
  {
    title: 'SMS Summary',
    icon: <FileSearchOutlined />,
    link: "/sms/sms/heatSummary"
  },
  {
    title: 'Bloom Inspection',
    icon: <EyeOutlined />,
    link: "/sms/sms/bloomInspection"
  },
  {
    title: 'Shift Reports',
    icon: <PieChartOutlined />,
    link: "/sms/sms/shiftReports"
  },
]

const SmsDutyEnd = () => {
  const [formData, setFormData] = useState({shiftRemarks: null})
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleFormSubmit = async () => {
    await dispatch(endSmsDuty(formData)).unwrap();
    // navigate('/sms/dutyEnd', {state: {dutyEnd: true}});
  }

  const smsGeneralInfo = useSelector(state => ({
    StartTime: state.smsDuty.startTime,
    Date: state.smsDuty.date,
    Shift: state.smsDuty.shift,
    Sms: state.smsDuty.sms,
    RailGrade: state.smsDuty.railGrade
  }));

  return (
    <FormContainer className='flex flex-col gap-4 md:gap-8'>
    <SubHeader title='SMS - Home' link='/' />
    <GeneralInfo data={smsGeneralInfo} />

      <section>
        <TabList tabList={smsDutyEndTabs} />
      </section>

      <section>
        <FormBody
          initialValues={formData}
          onFinish={handleFormSubmit}
        >
          <FormInputItem placeholder='Enter Remarks' onChange={(field, value) => handleChange(field, value, setFormData)} name='shiftRemarks' required/>
            <div className="text-center">
              <Btn htmlType='submit'>End Duty</Btn>
            </div>
        </FormBody>
      </section>
    </FormContainer>
  )
}

export default SmsDutyEnd