/* eslint-disable */
import { Layout, Menu, message } from "antd";
import Sider from "antd/es/layout/Sider";
import React, { useContext, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOutlined,
  ForkOutlined,
  RadarChartOutlined,
  BarChartOutlined,
  FilePdfOutlined,
  PieChartOutlined,
  BuildOutlined,
  BranchesOutlined,
  CompassOutlined,
  DeploymentUnitOutlined,
  BarsOutlined,
  ToolOutlined,
  FundOutlined,
  DatabaseOutlined,
  AuditOutlined,
  ExperimentOutlined,
  ControlOutlined,
  CheckOutlined,
  FileDoneOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FlagOutlined,
  SendOutlined,
  MessageOutlined,
  BankOutlined,
  InfoCircleOutlined,
  FireOutlined,
  HomeOutlined,
  LogoutOutlined,
  FileTextOutlined,
  RobotOutlined,
  LineChartOutlined,
  ProfileOutlined,
  UserOutlined,
  HourglassOutlined,
  AppstoreAddOutlined,
  IdcardOutlined,
  WarningOutlined
} from "@ant-design/icons";
import IconBtn from "./DKG_IconBtn";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slice/authSlice";
import { ActiveTabContext } from "../context/dashboardActiveTabContext";

// Define role-based access permissions for menu items
const ROLE_PERMISSIONS = {
  INSPECTING_ENGINEER: [
    'home', 'duty-sms', 'duty-rolling', 'duty-ndt', 'duty-vi', 'duty-welding', 'iso-reports'
  ],
  MANAGER: [
    'home', 'duty', 'records', 'iso-reports', 'data-analysis'
  ],
  LOCAL_ADMIN: [
    'home', 'duty', 'records', 'iso-reports', 'admin', 'data-analysis', 'ai-system'
  ],
  MAIN_ADMIN: [
    'full-access'
  ]
};

const items = [
  {
    key: "1",
    icon: <HomeOutlined />,
    label: "Home",
    path: "/sms/",
    permission: "home",
  },
  {
    key: "30",
    icon: <PieChartOutlined />,
    label: "BSP Dashboard",
    path: "/sms/bsp",
    permission: "bsp",
  },
  {
    key: "2",
    icon: <IdcardOutlined />,
    label: "Duty",
    permission: "duty",
    items: [
      {
        key: "2.1",
        icon: <BankOutlined />,
        label: "Duty Home",
        activeTab: 2,
        path: "/sms/",
      },
      {
        key: "2.2",
        icon: <MessageOutlined />,
        label: "SMS",
        permission: "duty-sms",
        items: [
          {
            key: "2.2.1",
            icon: <SendOutlined />,
            label: "SMS Duty Start",
            path: "/sms/sms/dutyStart",
          },
          {
            key: "2.2.2",
            icon: <FlagOutlined />,
            label: "SMS Duty End",
            path: "/sms/sms/dutyEnd",
            items: [
              {
                key: "2.2.2.1",
                icon: <BankOutlined />,
                label: "SMS Duty End Home",
                path: "/sms/sms/dutyEnd",
              },
              {
                key: "2.2.2.2",
                icon: <FileSearchOutlined />,
                label: "SMS Summary",
                path: "/sms/sms/heatSummary",
              },
              {
                key: "2.2.2.3",
                icon: <EyeOutlined />,
                label: "Bloom Inspection",
                path: "/sms/sms/bloomInspection",
              },
              {
                key: "2.2.2.4",
                icon: <BarChartOutlined />,
                label: "Shift Reports",
                items: [
                  {
                    key: "2.2.2.4.1",
                    icon: <ExperimentOutlined />,
                    label: "Shift Reports Home",
                    path: "/sms/sms/shiftReports",
                  },
                  {
                    key: "2.2.2.4.2",
                    icon: <FireOutlined />,
                    label: "Heat List",
                    path: "/sms/sms/shiftReports/heatList",
                  },
                  {
                    key: "2.2.2.4.3",
                    icon: <CheckOutlined />,
                    label: "Check List",
                    path: "/sms/sms/shiftReports/checkList",
                  },
                  {
                    key: "2.2.2.4.4",
                    icon: <FileDoneOutlined />,
                    label: "Verification",
                    path: "/sms/sms/shiftReports/verification",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        key: "2.3",
        icon: <AuditOutlined />,
        label: "Rolling Stage",
        permission: "duty-rolling",
        underConstruction: true,
        items: [
          {
            key: "2.3.1",
            icon: <SendOutlined />,
            label: "Stage Start Duty",
            path: "/sms/stage/startDuty",
          },
          {
            key: "2.3.2",
            icon: <FlagOutlined />,
            label: "Stage Duty End",
            items: [
              {
                key: "2.3.2.1",
                icon: <BankOutlined />,
                label: "Stage Duty End Home",
                path: "/sms/stage/home",
              },
              {
                key: "2.3.2.2",
                icon: <ControlOutlined />,
                label: "Rolling Stage Control",
                items: [
                  {
                    key: "2.3.2.2.1",
                    icon: <ControlOutlined />,
                    label: "Rail Control",
                    path: "/sms/stage/rollingControl"
                  },
                  {
                    key: "2.3.2.2.2",
                    icon: <HourglassOutlined />,
                    label: "Control Sample",
                    path: "/sms/stage/rollingControl/rollingControlSample"
                  },
                  // {
                  //   key: "2.3.2.2.3",
                  //   icon: <ExclamationCircleOutlined />,
                  //   label: "Control Sample for IRS52",
                  //   path: "/sms/stage/rollingControl/rollingControlSampleIRS52"
                  // },
                  // {
                  //   key: "2.3.2.2.4",
                  //   icon: <ThunderboltOutlined />,
                  //   label: "Control Sample for 60E1A1",
                  //   path: "/sms/stage/rollingControl/rollingControlSample60E1A1"
                  // },
                ]
              },
              {
                key: "2.3.2.5",
                icon: <ExperimentOutlined />,
                label: "Rolling Verification",
                path: "/sms/stage/rollingVerification"
              },
              {
                key: "2.3.2.6",
                icon: <ExperimentOutlined />,
                label: "Finishing Verification",
                path: "/sms/stage/finishingVerification"
              },
              {
                key: "2.3.2.3",
                icon: <ExperimentOutlined />,
                label: "Test Sample Marking",
                items: [
                  {
                    key: "2.3.2.3.1",
                    icon: <AppstoreAddOutlined />,
                    label: "Test Sample List",
                    path: "/sms/stage/testSampleMarkingList"
                  },
                  {
                    key: "2.3.2.3.2",
                    icon: <BookOutlined />,
                    label: "New Sample Declaration",
                    path: "/sms/stage/newTestSampleDeclaration"
                  }
                ]
              },
              {
                key: "2.3.2.4",
                icon: <ForkOutlined />,
                label: "HT Sequence",
                path: "/sms/stage/htSequence",
              }
            ]
          },
        ],
      },
      {
        key: "2.4",
        icon: <RadarChartOutlined />,
        label: "NDT",
        permission: "duty-ndt",
        underConstruction: true,
        items: [
          {
            key: "2.4.1",
            icon: <SendOutlined />,
            label: "NDT Start Duty",
            path: "/sms/ndt/startDuty",
          },
          {
            key: "2.4.2",
            icon: <FlagOutlined />,
            label: "NDT Duty End",
            items: [
              {
                key: '2.4.2.1',
                label: "NDT Duty End Home",
                icon: <BankOutlined />,
                path: "/sms/ndt/home",
              },
              {
                key: "2.4.2.2",
                icon: <BarChartOutlined />,
                label: "Calibration",
                path: "/sms/ndt/calibration",
              },
              // {
              //   key: "2.4.2.3",
              //   icon: <FilePdfOutlined />,
              //   label: "Report",
              //   path: "/sms/ndt/report",
              // },
              {
                key: '2.4.2.3',
                icon: <FileDoneOutlined />,
                label: 'Shift Summary',
                path: '/ndt/shiftSummary',
              },
            ]
          }
        ],
      },
      {
        key: "2.5",
        icon: <RadarChartOutlined />,
        label: "Testing",
        permission: "duty-testing",
        underConstruction: true,
        items: [
          {
            key: "2.5.17",
            icon: <FlagOutlined />,
            label: "Testing Start Duty",
            path: "/sms/testing/startDuty"
          },
          {
            key: "2.5.1",
            icon: <FlagOutlined />,
            label: "Testing Home",
            items: [
              {
                key: '2.5.1.1',
                label: "Testing End Duty",
                icon: <BankOutlined />,
                path: "/sms/testing/home",
              },
              {
                key: "2.5.1.2",
                icon: <BarChartOutlined />,
                label: "Pending Test Samples",
                path: "/sms/testing/pendingTestSamples",
              },
              {
                key: "2.5.1.3",
                icon: <FilePdfOutlined />,
                label: "Shift Testing Report",
                path: "/sms/testing/testingReport"
              },
              {
                key: "2.5.1.4",
                icon: <FilePdfOutlined />,
                label: "Heat Pending for Testing",
                path: "/sms/testing/heatPending"
              }
            ]
          }
        ],
      },
      {
        key: "2.6",
        icon: <EyeOutlined />,
        label: "Visual Inspection",
        permission: "duty-vi",
        underConstruction: true,
        items: [
          {
            key: "2.6.1",
            icon: <SendOutlined />,
            label: "VI Duty Start",
            path: "/sms/visual/startDuty",
          },
          {
            key: "2.6.2",
            icon: <FlagOutlined />,
            label: "VI Duty End",
            items: [
              {
                key: "2.6.2.1",
                icon: <BankOutlined />,
                label: "VI Duty End Home",
                path: "/sms/visual/home",
              },
              {
                key: "2.6.2.3",
                icon: <BranchesOutlined />,
                label: "Inspection",
                path: "/sms/visual/inspection",
              },
              {
                key: "2.6.2.4",
                icon: <FileSearchOutlined />,
                label: "Visual Inspection Summary",
                path: "/sms/visual/summary",
              },
            ],
          },
        ],
      },
      {
        key: "2.7",
        icon: <BuildOutlined />,
        label: "Welding Inspection",
        permission: "duty-welding",
        underConstruction: true,
        items: [
          {
            key: "2.7.1",
            icon: <SendOutlined />,
            label: "Welding Duty Start",
            path: "/sms/welding/startDuty",
          },
          {
            key: "2.7.2",
            icon: <FlagOutlined />,
            label: "Welding Duty End",
            items: [
              {
                key: "2.7.2.1",
                icon: <BankOutlined />,
                label: "Welding Duty End Home",
                path: "/sms/welding/home",
              },
              {
                key: "2.7.2.2",
                icon: <BranchesOutlined />,
                label: "New Welding Inspection",
                path: "/sms/welding/newWeldInspection",
              },
              {
                key: "2.7.2.3",
                icon: <WarningOutlined />,
                label: "Held or Rejected Panel Inspection",
                path: "/sms/welding/heldRejectedPanel",
              },
              {
                key: "2.7.2.4",
                icon: <WarningOutlined />,
                label: "Weld Test Sample",
                path: "/sms/welding/testSample",
              },
              {
                key: "2.7.2.5",
                icon: <FileSearchOutlined />,
                label: "Welding Inspection Summary",
                path: "/sms/welding/shiftSummary",
              },
            ],
          },
        ],
      },
      {
        key: "2.8",
        icon: <CompassOutlined />,
        label: "Short Rail Inspection",
        permission: "duty-sri",
        underConstruction: true,
        items: [
          {
            key: "2.8.1",
            icon: <AppstoreAddOutlined />,
            label: "SRI Start Duty",
            path: "/sms/srInspection",
          },
          {
            key: "2.8.2",
            icon: <FlagOutlined />,
            label: "Short Rail Inspection Home",
            items: [
              {
                key: "2.8.2.1",
                icon: <BankOutlined />,
                label: "SR Inspection Home",
                path: "/sms/srInspection/home",
              },
              {
                key: "2.8.2.2",
                icon: <DeploymentUnitOutlined />,
                label: "New SR Inspection",
                path: "/sms/srInspection/addNewInspection",
              },
              {
                key: "2.8.2.3",
                icon: <InfoCircleOutlined />,
                label: "Other WS Remarks",
                path: "/sms/srInspection/wsRemarks",
              },
            ],
          },
        ],
      },
      {
        key: "2.9",
        icon: <DatabaseOutlined />,
        label: "QCT",
        permission: "duty-qct",
        underConstruction: true,
        items: [
          // {
          //   key: "2.9.1",
          //   icon: <AppstoreAddOutlined />,
          //   label: "QCT Sample List",
          //   path: "/sms/qct/sampleList",
          // },
          {
            key: "2.9.2",
            icon: <BarsOutlined />,
            label: "New Sample Declaration",
            path: "/sms/qct/newSampleDeclaration",
          },
        ],
      },
      {
        key: "2.10",
        icon: <ToolOutlined />,
        label: "Calibration",
        permission: "duty-calibration",
        underConstruction: true,
        items: [
          // {
          //   key: "2.10.1",
          //   icon: <AppstoreAddOutlined />,
          //   label: "Calibration Start Duty",
          //   path: "/sms/calibration/startDuty",
          // },
          {
            key: "2.10.1",
            icon: <AppstoreAddOutlined />,
            label: "Calibration List",
            path: "/sms/calibration/list",
          },
          {
            key: "2.10.2",
            icon: <FundOutlined />,
            label: "New / Modify Calibration List",
            path: "/sms/calibration/newModifyCalibration",
          },
          {
            key: "2.10.3",
            icon: <DatabaseOutlined />,
            label: "Bulk Calibration",
            path: "/sms/calibration/bulkCalibration",
          },
        ],
      },
    ],
  },
  {
    key: "3",
    icon: <FileTextOutlined />,
    label: "Record",
    activeTab: 3,
    path: "/sms/",
    permission: "records",
    underConstruction: true,
  },
  {
    key: "4",
    icon: <RobotOutlined />,
    label: "AI System",
    activeTab: 4,
    path: "/sms/",
    permission: "ai-system",
    underConstruction: true,
  },
  {
    key: "5",
    icon: <LineChartOutlined />,
    label: "Data Analysis",
    activeTab: 5,
    path: "/sms/",
    permission: "data-analysis",
    underConstruction: true,
  },
  {
    key: "6",
    icon: <ProfileOutlined />,
    label: "ISO Reports",
    activeTab: 6,
    path: "/sms/",
    permission: "iso-reports",
    underConstruction: true,
  },
  {
    key: "7",
    icon: <UserOutlined />,
    label: "Admin",
    activeTab: 7,
    path: "/sms/",
    permission: "admin",
    underConstruction: true,
  },
];

const SideNav = ({ collapsed, toggleCollapse }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setActiveTab, activeTab } = useContext(ActiveTabContext);
  const dispatch = useDispatch();
  const { userType } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const currentNotification = useRef(null);

  // Get all duty states from Redux to check which duties are active
  const dutyStates = useSelector(state => ({
    smsDuty: state.smsDuty,
    rollingDuty: state.rollingDuty,
    ndtDuty: state.ndtDuty,
    testingDuty: state.testingDuty,
    viDuty: state.viDuty,
    weldingDuty: state.weldingDuty,
    sriDuty: state.sriDuty,
    qctDuty: state.qctDuty,
    calibrationDuty: state.calibrationDuty
  }));

  // Define blockable duty types and their corresponding duty keys
  const blockableDuties = {
    '/sms/sms/dutyStart': { dutyKey: 'smsDuty', title: 'SMS' },
    '/sms/stage/startDuty': { dutyKey: 'rollingDuty', title: 'Rolling Stage' },
    '/sms/ndt/startDuty': { dutyKey: 'ndtDuty', title: 'NDT' },
    '/sms/testing/startDuty': { dutyKey: 'testingDuty', title: 'Testing' },
    '/sms/visual/startDuty': { dutyKey: 'viDuty', title: 'Visual Inspection' },
    '/sms/welding/startDuty': { dutyKey: 'weldingDuty', title: 'Welding Inspection' },
    '/sms/srInspection': { dutyKey: 'sriDuty', title: 'Short Rail Inspection' }
  };

  // Check if any blockable duty is currently active
  const getActiveDuty = () => {
    for (const [dutyKey, dutyState] of Object.entries(dutyStates)) {
      if (dutyState?.dutyId && dutyKey !== 'qctDuty' && dutyKey !== 'calibrationDuty') {
        const dutyInfo = Object.values(blockableDuties).find(duty => duty.dutyKey === dutyKey);
        if (dutyInfo) {
          return {
            dutyKey,
            dutyTitle: dutyInfo.title,
            dutyId: dutyState.dutyId
          };
        }
      }
    }
    return null;
  };

  const activeDuty = getActiveDuty();

  // Handle navigation with duty blocking logic
  const handleDutyNavigation = (path) => {
    // Check if this is a duty start path
    const dutyInfo = blockableDuties[path];

    if (!dutyInfo) {
      // Not a duty start path, navigate normally
      navigate(path);
      return;
    }

    // If this is the active duty, allow navigation
    if (activeDuty && dutyInfo.dutyKey === activeDuty.dutyKey) {
      navigate(path);
      return;
    }

    // If another duty is active, show warning
    if (activeDuty && dutyInfo.dutyKey !== activeDuty.dutyKey) {
      // Close existing notification if any
      if (currentNotification.current) {
        currentNotification.current();
      }

      // Show new notification and store its destroy function
      currentNotification.current = message.warning(
        `Cannot start ${dutyInfo.title} duty. Please end the current ${activeDuty.dutyTitle} duty first.`,
        5,
        () => {
          // Clear reference when notification disappears
          currentNotification.current = null;
        }
      );
      return;
    }

    // No active duty, allow navigation
    navigate(path);
  };

  // Function to check if user has permission for a menu item
  const hasPermission = (permission) => {
    if (!userType || !permission) return false;

    // Main Admin has access to everything
    if (userType === 'MAIN_ADMIN') return true;

    // Get user permissions
    const userPermissions = ROLE_PERMISSIONS[userType] || [];

    // Umbrella: if user has 'duty', allow all duty-* permissions
    if (permission.startsWith('duty-') && userPermissions.includes('duty')) return true;

    // Check if user has the required permission
    return userPermissions.includes(permission) || userPermissions.includes('full-access');
  };

  // Check if a duty module is currently active (excluding QCT and Calibration)
  const isDutyModuleActive = (permission) => {
    // QCT and Calibration should never show green
    if (permission === 'duty-qct' || permission === 'duty-calibration') {
      return false;
    }

    // Check each duty module for active state
    switch (permission) {
      case 'duty-sms':
        return dutyStates.smsDuty?.dutyId;
      case 'duty-rolling':
        return dutyStates.rollingDuty?.dutyId;
      case 'duty-ndt':
        return dutyStates.ndtDuty?.dutyId;
      case 'duty-testing':
        return dutyStates.testingDuty?.dutyId;
      case 'duty-vi':
        return dutyStates.viDuty?.dutyId;
      case 'duty-welding':
        return dutyStates.weldingDuty?.dutyId;
      case 'duty-sr-inspection':
        return dutyStates.sriDuty?.dutyId;
      default:
        return false;
    }
  };

  // Function to filter menu items based on user role
  const filterMenuItems = (menuItems) => {
    const result = [];
    for (const item of menuItems) {
      let subItems = [];
      if (item.items) {
        subItems = filterMenuItems(item.items);
      }

      // If there are accessible subitems, show the parent regardless of its own permission
      if (subItems.length > 0) {
        result.push({ ...item, items: subItems });
        continue;
      }

      // Leaf item: check permission if specified
      if (!item.permission || hasPermission(item.permission)) {
        result.push({ ...item });
      }
    }
    return result;
  };

  // Get filtered menu items based on user role
  const filteredItems = filterMenuItems(items);

  const getSelectedKey = (item) => {
    if (item.path === currentPath) {
      return item.key;
    }

    if (item.items) {
      for (const child of item.items) {
        const key = getSelectedKey(child);
        if (key) {
          return key;
        }
      }
    }
    return null;
  };

  const selectedKey = filteredItems.reduce((acc, item) => {
    return acc || getSelectedKey(item);
  }, null);

  const handleMenuItemClick = (activeTab = null) => {
    setActiveTab(activeTab);
    if (window.innerWidth <= 768) {
      toggleCollapse();
    }
  };

  const displaySideNavItems = (item) => {
    // Under Construction handler — intercept at the submenu/item level
    if (item.underConstruction) {
      const handleUnderConstructionClick = () => {
        message.warning({
          content: `🚧 "${item.label}" is under construction and will be available in a future release.`,
          duration: 3,
          key: 'under-construction',
        });
        navigate('/sms/underConstruction');
      };

      // If it has sub-items, render as a clickable SubMenu that intercepts expand
      if (item.items) {
        return (
          <Menu.SubMenu
            key={item.key}
            icon={item.icon}
            title={
              <span
                onClick={(e) => { e.stopPropagation(); handleUnderConstructionClick(); }}
                className="opacity-60"
              >
                {item.label} <span style={{ fontSize: 10, marginLeft: 4 }}>🚧</span>
              </span>
            }
            className="opacity-60"
            onTitleClick={handleUnderConstructionClick}
          >
            <Menu.Item key={`${item.key}-uc`} disabled>
              🚧 Under Construction
            </Menu.Item>
          </Menu.SubMenu>
        );
      }

      // Leaf item under construction
      return (
        <Menu.Item
          key={item.key}
          icon={item.icon}
          onClick={handleUnderConstructionClick}
          className="opacity-60"
        >
          <span>{item.label} <span style={{ fontSize: 10 }}>🚧</span></span>
        </Menu.Item>
      );
    }

    if (!item.items) {
      // Check if this is an active duty module
      const isActiveDuty = isDutyModuleActive(item.permission);

      // Check if this is a duty start path that needs blocking logic
      const isDutyStartPath = blockableDuties[item.path];

      // Check if this duty start path should be blocked
      const isBlocked = isDutyStartPath && activeDuty && isDutyStartPath.dutyKey !== activeDuty.dutyKey;

      return (
        <Menu.Item
          key={item.key}
          icon={item.icon}
          onClick={() => {
            handleMenuItemClick(item.activeTab);
            // Use duty navigation handler for duty start paths, otherwise use normal navigation
            if (isDutyStartPath) {
              handleDutyNavigation(item.path);
            }
          }}
          className={`${
            activeTab === item.activeTab ? "ant-menu-item-selected" : ""
          } ${isActiveDuty ? "!bg-green-500 !text-white" : ""} ${
            isBlocked ? "opacity-60 cursor-not-allowed" : ""
          }`}
          style={isActiveDuty ? { backgroundColor: '#10b981', color: 'white' } : {}}
          title={isBlocked ? `Cannot start ${isDutyStartPath.title} duty. End current ${activeDuty.dutyTitle} duty first.` : undefined}
        >
          {isDutyStartPath ? (
            // For duty start paths, use span instead of Link to prevent default navigation
            <span style={isActiveDuty ? { color: 'white' } : {}}>{item.label}</span>
          ) : (
            // For normal paths, use Link as before
            <Link to={item.path} style={isActiveDuty ? { color: 'white' } : {}}>{item.label}</Link>
          )}
        </Menu.Item>
      );
    }

    // For submenus, show green for any active duty module
    const isThisSubmenuActiveDuty = isDutyModuleActive(item.permission);
    const isActiveDutySubmenu = isThisSubmenuActiveDuty;

    return (
      <Menu.SubMenu
        key={item.key}
        icon={item.icon}
        title={item.label}
        className={isActiveDutySubmenu ? "active-duty-submenu" : ""}
        style={isActiveDutySubmenu ? {
          backgroundColor: '#10b981',
          color: 'white',
        } : {}}
      >
        {item.items.map((child) => displaySideNavItems(child))}
      </Menu.SubMenu>
    );
  };
  const menuItems = filteredItems.map(displaySideNavItems);

  return (
    <Layout
      style={{ flex: 0 }}
      className={`absolute md:static h-full w-fit bg-offWhite z-10 !flex !flex-col transition-all duration-150 ${
        collapsed ? "-translate-x-full md:-translate-x-0" : ""
      }`}
    >
      <Sider
        width={260}
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapse}
        className="overflow-y-auto !bg-offWhite !w-[100vw] !flex-1 custom-sider-css"
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          selectedKeys={selectedKey ? [selectedKey] : []}
          className="!bg-offWhite"
        >
          {menuItems}
        </Menu>
        <div className="mt-auto pb-4 px-2 flex justify-center w-full">
          <IconBtn
            text={collapsed ? null : "Logout"}
            icon={LogoutOutlined}
            className={`!w-full !border-none !shadow-none !bg-transparent hover:!bg-gray-100 ${
              collapsed ? "flex justify-center" : "flex justify-start !px-4"
            }`}
            onClick={() => dispatch(logout())}
          />
        </div>
      </Sider>
    </Layout>
  );
};

export default SideNav;