/* eslint-disable */
import React, { useState } from 'react'
import {LineChartOutlined, MessageOutlined, ToolOutlined, ExperimentOutlined, EyeOutlined, DatabaseOutlined, CompassOutlined, DeploymentUnitOutlined, RadarChartOutlined, AuditOutlined } from '@ant-design/icons';
import FormContainer from '../../../../components/DKG_FormContainer';
import FinishingVerification from './FinishingVerificationUrm';
import SubHeader from '../../../../components/DKG_SubHeader';
import RollingControlIso from './RollingControlIso';
import RollingControlIso60E1A1 from './RollingControlIso60E1A1';
import RollingControlIsoUrm from './RollingControlIsoUrm';
import RollingControlIso60E1A1Urm from './RollingControlIso60E1A1Urm';
import FinishingVerificationRsm from './FinishingVerificationRsm';
import RollingVerificationIso from './RollingVerificationIso';
import RollingVerificationIsoUrm from './RollingVerificationIsoUrm';
import Tab from '../../../../components/DKG_Tab';

const RollingIsoMain = () => {
    const rollingIsoTabs = [
        {
            title: "Finishing Verification ISO Report URM",
            icon: <LineChartOutlined />,
            activeTab: 0
        },
        {
            title: "Finishing Verification ISO Report RSM",
            icon: <ToolOutlined />,
            activeTab: 1
        },
        {
            title: "Rolling Control ISO Report 60E1 IRS52 RSM",
            icon: <ExperimentOutlined />,
            activeTab: 2
        },
        {
            title: "Rolling Control ISO Report 60E1 IRS52 URM",
            icon: <ExperimentOutlined />,
            activeTab: 3
        },
        {
            title: "Rolling Control ISO Report 60E1A1 RSM",
            icon: <EyeOutlined />,
            activeTab: 4
        },
        {
            title: "Rolling Control ISO Report 60E1A1 URM",
            icon: <EyeOutlined />,
            activeTab: 5
        },
        {
            title: "Rolling Verification ISO Report RSM",
            icon: <DatabaseOutlined />,
            activeTab: 6
        },
        {
            title: "Rolling Verification ISO Report URM",
            icon: <CompassOutlined />,
            activeTab: 7
        },
    ]

    const [activeTab, setActiveTab] = useState(0);
    
  return (
    <FormContainer>
        <SubHeader link="/" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {
            rollingIsoTabs.map((item, index) => (
                <div key={index}>
                  <Tab
                    item={item}
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
                    <h1 className="text-2xl font-semibold text-center">Finishing Verification ISO URM</h1>
                <FinishingVerification />
                </div>
            )
        }
        {
            activeTab === 1 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Finishing Verification ISO RSM</h1>
                <FinishingVerificationRsm />
                </div>
            )
        }
        {
            activeTab === 2 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Control ISO 60E1 IRS52 RSM</h1>
                <RollingControlIso />
                </div>
            )
        }
        {
            activeTab === 3 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Control ISO 60E1 IRS52 URM</h1>
                <RollingControlIsoUrm />
                </div>
            )
        }
        {
            activeTab === 4 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Control ISO 60E1A1 RSM</h1>
                <RollingControlIso60E1A1 />
                </div>
            )
        }
        {
            activeTab === 5 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Control ISO 60E1A1 URM</h1>
                <RollingControlIso60E1A1Urm />
                </div>
            )
        }
        {
            activeTab === 6 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Verification ISO RSM</h1>
                <RollingVerificationIso />
                </div>
            )
        }
        {
            activeTab === 7 && (
                <div>
                    <h1 className="text-2xl font-semibold text-center">Rolling Verification ISO URM</h1>
                <RollingVerificationIsoUrm />
                </div>
            )
        }
      
    </FormContainer>
  )
}

export default RollingIsoMain
