/* eslint-disable */
import React, { useState } from "react";
import SmsIsoMain from "./sms/SmsIsoMain";
import {
  MessageOutlined,
  AuditOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  CompassOutlined,
  RadarChartOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import Tab from "../../../components/DKG_Tab";

const IsoReports = () => {
  const [selectedModule, setSelectedModule] = useState("sms");

  const isoModules = [
    {
      id: "sms",
      title: "SMS",
      icon: <MessageOutlined />,
      isUnderDevelopment: false,
    },
    {
      id: "rolling",
      title: "Rolling Stage",
      icon: <AuditOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "vi",
      title: "Visual Inspection",
      icon: <EyeOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "welding",
      title: "Welding",
      icon: <DeploymentUnitOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "sri",
      title: "Short Rail",
      icon: <CompassOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "ndt",
      title: "NDT",
      icon: <RadarChartOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "testing",
      title: "Testing",
      icon: <ExperimentOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "qct",
      title: "QCT",
      icon: <DatabaseOutlined />,
      isUnderDevelopment: true,
    },
    {
      id: "calibration",
      title: "Calibration",
      icon: <ToolOutlined />,
      isUnderDevelopment: true,
    },
  ];

  const handleModuleClick = (mod) => {
    if (mod.isUnderDevelopment) {
      message.warning({
        content: `🚧 "${mod.title} ISO Report" is currently under development.`,
        duration: 3,
        key: 'under-development',
      });
      return;
    }
    setSelectedModule(mod.id);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select ISO Report Module</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isoModules.map((item) => (
            <div key={item.id} className="relative">
              <Tab
                title={item.title}
                icon={item.icon}
                onClick={() => handleModuleClick(item)}
                isActive={selectedModule === item.id}
                className={item.isUnderDevelopment ? "opacity-60 cursor-pointer" : ""}
              />
              {item.isUnderDevelopment && (
                <span className="absolute top-1 right-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-300">
                  🚧 Dev
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedModule === "sms" && (
        <div className="mt-4">
          <SmsIsoMain />
        </div>
      )}
    </div>
  );
};

export default IsoReports;
