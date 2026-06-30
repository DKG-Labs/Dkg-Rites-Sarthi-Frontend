/* eslint-disable */
import React, { useState } from 'react'
import {LineChartOutlined, MessageOutlined, ToolOutlined, ExperimentOutlined, EyeOutlined, DatabaseOutlined, CompassOutlined, DeploymentUnitOutlined, RadarChartOutlined, AuditOutlined } from '@ant-design/icons';
import FormContainer from '../../../../components/DKG_FormContainer';
import SubHeader from '../../../../components/DKG_SubHeader';
import WeldDimensionCheckIso from './WeldDimensionCheckIso';
import WeldTestingIso from './WeldTestingIso';
import WeldTltIso from './WeldTltIso';
import WeldingHardnessIso from './WeldingHardnessIso';
import WeldMacroIso from './WeldMacroIso';
import WeldMicroIso from './WeldMicroIso';
import Tab from '../../../../components/DKG_Tab';

const WeldingIsoMain = () => {
    const weldIsoTabs = [
        {
            title: "Welding Dimensional Check",
            icon: <LineChartOutlined />,
            activeTab: 0
        },
        {
            title: "Welding Testing Of Joints",
            icon: <ExperimentOutlined />,
            activeTab: 1
        },
        {
            title: "Welding TLT",
            icon: <ToolOutlined />,
            activeTab: 2
        },
        {
            title: "Welding Hardness",
            icon: <ToolOutlined />,
            activeTab: 3
        },
        {
            title: "Welding Macro",
            icon: <ToolOutlined />,
            activeTab: 4
        },
        {
            title: "Welding Micro",
            icon: <ToolOutlined />,
            activeTab: 5
        },
    ]

    const [activeTab, setActiveTab] = useState(0);
    
  return (
    <FormContainer>
        <SubHeader link="/" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {
            weldIsoTabs.map((item, index) => (
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
                    <h1 className="text-2xl font-semibold text-center">Welding Dimensional Check</h1>
                    <WeldDimensionCheckIso />
                </div>
            )
        }
        {
            activeTab === 1 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Weld Testing Of Joints</h1>
                <WeldTestingIso />
                </div>
            )
        }
        {
            activeTab === 2 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Weld TLT</h1>
                <WeldTltIso />
                </div>
            )
        }
        {
            activeTab === 3 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Weld Hardness</h1>
                <WeldingHardnessIso />
                </div>
            )
        }
        {
            activeTab === 4 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Weld Macro</h1>
                <WeldMacroIso />
                </div>
            )
        }
        {
            activeTab === 5 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Weld Micro</h1>
                <WeldMicroIso />
                </div>
            )
        }
        {/* {
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

export default WeldingIsoMain
