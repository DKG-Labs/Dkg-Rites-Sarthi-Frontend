/* eslint-disable */
import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import SideNav from "./DKG_SideNav";
import { Outlet, useLocation } from "react-router-dom";
import { MenuOutlined } from "@ant-design/icons";

const { Content } = Layout;

const CustomLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically close sidebar on mobile upon navigation
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-full w-full overflow-hidden relative bg-[#f8fafc]">
      {/* Mobile Backdrop Overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed top-[60px] bottom-0 left-0 right-0 bg-black/50 z-40 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}

      {/* Side Navigation */}
      <SideNav collapsed={collapsed} toggleCollapse={toggleCollapse} isMobile={isMobile} />

      {/* Main Layout Area */}
      <Layout className="layout flex-1 flex flex-col h-full overflow-hidden bg-[#f8fafc] w-full min-w-0">
        {/* Mobile Sub-Header / Toggle Bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 shadow-xs z-20 flex-shrink-0">
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-xs font-semibold hover:bg-gray-100 active:scale-95 transition-all shadow-xs"
            aria-label="Toggle Navigation"
          >
            <MenuOutlined style={{ fontSize: '14px', color: '#0F4C81' }} />
            <span>Menu & Modules</span>
          </button>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Rail SMS
          </span>
        </div>

        {/* Content Container */}
        <Content className="p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col gap-4 overflow-y-auto overflow-x-hidden relative main-content w-full flex-1">
          <div className="relative z-1 flex flex-col gap-4 w-full max-w-full">
            <Outlet />
          </div>
        </Content>

        {/* Floating Menu Toggle Button on Mobile (Always Accessible) */}
        {isMobile && collapsed && (
          <button
            onClick={toggleCollapse}
            className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0F4C81] text-white text-xs font-bold shadow-xl hover:bg-[#0d3f6b] active:scale-95 transition-all"
            style={{
              boxShadow: '0 4px 14px rgba(15, 76, 129, 0.45)',
            }}
            aria-label="Open Navigation Menu"
          >
            <MenuOutlined style={{ fontSize: '14px' }} />
            <span>Menu</span>
          </button>
        )}
      </Layout>
    </div>
  );
};

export default CustomLayout;
