/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LineChartOutlined,
  ExperimentOutlined,
  ToolOutlined
} from '@ant-design/icons';
import VerificationIso from './VerificationIso';
import FormContainer from '../../../../components/DKG_FormContainer';
import ChemicalAnalysis from './ChemicalAnalysis';
import SubHeader from '../../../../components/DKG_SubHeader';
import ChemicalAnalysis2 from './ChemicalAnalysis2';
import Tab from '../../../../components/DKG_Tab';

const SmsIsoMain = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ? parseInt(searchParams.get('tab'), 10) : 0;
  const [activeTab, setActiveTab] = useState(isNaN(initialTab) ? 0 : initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      const parsed = parseInt(tabParam, 10);
      if (!isNaN(parsed) && parsed !== activeTab) {
        setActiveTab(parsed);
      }
    }
  }, [searchParams]);

  const smsIsoTabs = [
    {
      title: "Verification ISO Report",
      icon: <LineChartOutlined />,
      activeTab: 0
    },
    {
      title: "Chemical Analysis ISO Report - 1",
      icon: <ExperimentOutlined />,
      activeTab: 1
    },
    {
      title: "Chemical Analysis ISO Report - 2",
      icon: <ToolOutlined />,
      activeTab: 2
    },
  ];

  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);
    setSearchParams({ tab: tabIndex });
  };

  return (
    <FormContainer>
      <SubHeader title="SMS - ISO Reports" link="/sms/" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {smsIsoTabs.map((item, index) => (
          <div key={index}>
            <Tab
              title={item.title}
              icon={item.icon}
              onClick={() => handleTabClick(item.activeTab)}
              isActive={activeTab === item.activeTab}
            />
          </div>
        ))}
      </div>
      {activeTab === 0 && (
        <div>
          <h1 className="text-xl font-semibold text-center mb-4 text-slate-800">Verification ISO Report</h1>
          <VerificationIso />
        </div>
      )}
      {activeTab === 1 && (
        <div>
          <h1 className="text-xl font-semibold text-center mb-4 text-slate-800">Chemical Analysis ISO Report - 1</h1>
          <ChemicalAnalysis />
        </div>
      )}
      {activeTab === 2 && (
        <div>
          <h1 className="text-xl font-semibold text-center mb-4 text-slate-800">Chemical Analysis ISO Report - 2</h1>
          <ChemicalAnalysis2 />
        </div>
      )}
    </FormContainer>
  );
};

export default SmsIsoMain;
