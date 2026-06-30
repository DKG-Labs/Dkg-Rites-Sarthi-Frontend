/* eslint-disable */
import React from 'react'
import {ExperimentOutlined, ToolOutlined, DatabaseOutlined, CompassOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../components/DKG_SubHeader';
import QuickAccess from '../../components/DKG_QuickAccess';

const BspRecordMain = () => {
    const bspRecordTabs = [
        {
            id: 1,
            title: 'FWT Tests',
            icon: <ToolOutlined />,
            link: '/bsp/data/fwt'
          },
          {
            id: 2,
            title: 'Macro Tests',
            icon: <CompassOutlined />,
            link: '/bsp/data/macro'
          },
          {
            id: 3,
            title: 'Chemical Tests',
            icon: <ExperimentOutlined />,
            link: '/bsp/data/chem'
          },
          {
            id: 4,
            title: 'Tensile Tests',
            icon: <DatabaseOutlined />,
            link: '/bsp/data/tensile'
          },
    ]
    const navigate = useNavigate()
  const renderRecordItemTabs = () =>
    bspRecordTabs.map(item => {
      return (
        <>
        {/* // <Tab  title={item.title} icon={item.icon} onClick={()=> navigate(item.link)} /> */}

        <div onClick={() => navigate(item.link)} className="flex justify-between items-center  border border-darkBlueHover w-full p-2 px-4 gap-4 rounded-lg shadow-lg bg-gray-200">
        <span className="records-tab-icon">{item.icon}</span>
        <span className="font-medium">
          {item.title}
        </span>
      </div>
        </>
      )
    })


  return (
    <div className='flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen'>
      <QuickAccess />
    <section>
        <SubHeader title="BSP Test Records" link="/bsp" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {renderRecordItemTabs()}
    </div>
  </section>
    </div>
  )
}

export default BspRecordMain
