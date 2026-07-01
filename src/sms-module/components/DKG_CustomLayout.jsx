/* eslint-disable */
import React, { useEffect, useState } from "react";
import Header from './DKG_Header'
import { Layout} from "antd";
import SideNav from "./DKG_SideNav";
import { Outlet } from "react-router-dom";
const { Content } = Layout;

const CustomLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (window.innerWidth <= 768) setCollapsed(true);
  }, []);
  return (
    <>
      <div className="flex max-h-[100vh] overflow-y-auto h-[calc(100vh-4.5rem)] relative">
          <SideNav collapsed={collapsed} toggleCollapse={toggleCollapse} />
        <Layout className="layout flex-1 overflow-auto">
          <Content className="md:px-8 md:py-4 flex flex-col gap-4 md:gap-8 overflow-auto relative main-content w-full">
            <div className="relative z-1 flex flex-col gap-4 md:gap-8 w-full">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </div>
    </>
  );
};
export default CustomLayout;
