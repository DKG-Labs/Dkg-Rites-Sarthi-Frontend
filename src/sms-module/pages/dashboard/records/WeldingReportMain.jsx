/* eslint-disable */
import React from 'react'
import { ToolOutlined, AuditOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../../components/DKG_SubHeader';
import QuickAccess from '../../../components/DKG_QuickAccess';
import Tab from '../../../components/DKG_Tab';

const WeldingReportMain = () => {
    const smsRecordTabs = [
        {
            id: 1,
            title: 'Welding Summary',
            icon: <MessageOutlined />,
            link: '/record/welding/summary'
          },
          {
            id: 2,
            title: 'New Weld Report',
            icon: <AuditOutlined />,
            link: '/record/welding/newWeld'
          },
          {
            id: 3,
            title: 'Test Sample Report',
            icon: <ToolOutlined />,
            link: '/record/welding/testSample'
          },
    ]
    const navigate = useNavigate()
  const renderRecordItemTabs = () =>
    smsRecordTabs.map(item => {
      return (
        <div key={item.id}>
          <Tab
            title={item.title}
            icon={item.icon}
            onClick={() => navigate(item.link)}
          />
        </div>
      )
    })


  return (
    <div className='flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen'>
      <QuickAccess />
    <section>
        <SubHeader title="Welding Records" link="/" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {renderRecordItemTabs()}
    </div>
  </section>
    </div>
  )
}

export default WeldingReportMain
