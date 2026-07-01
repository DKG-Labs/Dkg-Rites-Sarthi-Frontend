/* eslint-disable */
import React from 'react'
import SubHeader from '../../../../../components/DKG_SubHeader'
import { FireOutlined, CheckCircleOutlined, CheckSquareOutlined } from '@ant-design/icons';
import TabList from '../../../../../components/DKG_TabList';
import Btn from '../../../../../components/DKG_Btn';
import { useNavigate } from 'react-router-dom';
import data from '../../../../../utils/db.json'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import FormContainer from '../../../../../components/DKG_FormContainer';

const {smsGeneralInfo} = data

const smsDutyEndTabs = [
  {
    title: 'Report - Heat List',
    icon: <FireOutlined />,
    link: "/sms/sms/shiftReports/heatList"
  },
  {
    title: 'Report - Check List',
    icon: <CheckCircleOutlined />,
    link: "/sms/sms/shiftReports/checkList"
  },
  {
    title: 'Report - Verification',
    icon: <CheckSquareOutlined />,
    link: "/sms/sms/shiftReports/verification"
  },
]

const ShiftReports = () => {
  const navigate = useNavigate()
  return (
    <FormContainer className='flex flex-col gap-4'>
      <SubHeader title='SMS - Shift Reports' link='/sms/sms/dutyEnd' />
      <section>
        <GeneralInfo data={smsGeneralInfo} />
      </section>
      <section>
        <TabList tabList={smsDutyEndTabs} />
      </section>
      <section className='flex-1 flex justify-center items-end'>
        <Btn onClick={() => navigate(-1)}> Go Back </Btn>
      </section>


    </FormContainer>
  )
}

export default ShiftReports
