/* eslint-disable */
import React, { useState } from 'react'
import {LineChartOutlined, MessageOutlined, ToolOutlined, ExperimentOutlined, EyeOutlined, DatabaseOutlined, CompassOutlined, DeploymentUnitOutlined, RadarChartOutlined, AuditOutlined } from '@ant-design/icons';
import FormContainer from '../../../../components/DKG_FormContainer';
import SubHeader from '../../../../components/DKG_SubHeader';
import ViOnlineInspection from './ViOnlineInspection';
import Tab from '../../../../components/DKG_Tab';

const ViIsoMain = () => {
    const viIsoTabs = [
        {
            title: "Online Inspection of Long Rails",
            icon: <LineChartOutlined />,
            activeTab: 0
        },
        // {
        //     title: "Chemical Analysis ISO Report - 1",
        //     icon: <ExperimentOutlined />,
        //     activeTab: 1
        // },
        // {
        //     title: "Chemical Analysis ISO Report - 2",
        //     icon: <ToolOutlined />,
        //     activeTab: 2
        // },
    ]

    const [activeTab, setActiveTab] = useState(0);
    
  return (
    <FormContainer>
        <SubHeader link="/" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {
            viIsoTabs.map((item, index) => (
                <div key={index}>
                  <Tab
                    title={item.title}
                    icon={item.icon}
                    onClick={() => setActiveTab(item.activeTab)}
                    isActive={activeTab === item.activeTab}
                  />
                </div>
            ))
        }
        </div>
        {
            activeTab === 0 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Online Inspection of Long Rails</h1>
                <ViOnlineInspection />
                </div>
            )
        }
        {/* {
            activeTab === 1 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Chemical Analysis ISO - 1</h1>
                <ChemicalAnalysis />
                </div>
            )
        }
        {
            activeTab === 2 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Chemical Analysis ISO - 2</h1>
                <ChemicalAnalysis2 />
                </div>
            )
        } */}
      
    </FormContainer>
  )
}

export default ViIsoMain
