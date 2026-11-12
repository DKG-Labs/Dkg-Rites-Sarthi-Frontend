/* eslint-disable */
import React from 'react'
import { LineChartOutlined, ExperimentOutlined, ToolOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import TabList from '../../../../../components/DKG_TabList';

// Same report pages / tabs as the side menu (ISO Reports → SMS)
const smsIsoReportTabs = [
  {
    title: 'Verification ISO Report',
    icon: <LineChartOutlined />,
    link: "/sms/iso/sms?tab=0"
  },
  {
    title: 'Chemical Analysis ISO Report - 1',
    icon: <ExperimentOutlined />,
    link: "/sms/iso/sms?tab=1"
  },
  {
    title: 'Chemical Analysis ISO Report - 2',
    icon: <ToolOutlined />,
    link: "/sms/iso/sms?tab=2"
  },
]

/** SMS ISO Reports — separate view opened from the SMS Home card. */
const SmsIsoReportsHome = () => {
  const smsGeneralInfo = useSelector(state => ({
    StartTime: state?.smsDuty?.startTime,
    Date: state?.smsDuty?.date,
    Shift: state?.smsDuty?.shift,
    Sms: state?.smsDuty?.sms,
    RailGrade: state?.smsDuty?.railGrade
  }));

  return (
    <FormContainer className='flex flex-col gap-4 md:gap-8'>
      <SubHeader title='SMS - ISO Reports' link='/sms/sms/dutyEnd' />
      <GeneralInfo data={smsGeneralInfo} />

      <section>
        <TabList tabList={smsIsoReportTabs} />
      </section>
    </FormContainer>
  )
}

export default SmsIsoReportsHome
