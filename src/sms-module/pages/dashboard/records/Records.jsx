/* eslint-disable */
import { EyeOutlined, DatabaseOutlined, DeploymentUnitOutlined, RadarChartOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Tab from '../../../components/DKG_Tab';

import { filterByPermissions } from '../../../utils/permissions';

const recordItemTabs = [
  {
    id: 1,
    title: 'SMS Record',
    icon: <MessageOutlined />,
    link: '/record/sms',
    permission: 'records'
  },
  {
    id: 2,
    title: 'NDT Record',
    icon: <RadarChartOutlined />,
    link: '/record/ndt',
    permission: 'records'
  },
  {
    id: 3,
    title: 'Visual Inspection Record',
    icon: <EyeOutlined />,
    link: '/record/vi',
    permission: 'records'
  },
  {
    id: 4,
    title: 'Welding Inspection Record',
    icon: <DeploymentUnitOutlined />,
    link: '/record/welding',
    permission: 'records'
  },
  {
    id: 5,
    title: 'QCT Record',
    icon: <DatabaseOutlined />,
    link: '/record/qct',
    permission: 'admin' // QCT records are admin-only
  },
  // Future record types can be added here
  // {
  //   id: 6,
  //   title: 'Rolling Stage Record',
  //   icon: <AuditOutlined />,
  //   link: '/record/rolling',
  //   permission: 'records'
  // },
  // {
  //   id: 7,
  //   title: 'Testing Record',
  //   icon: <ExperimentOutlined />,
  //   link: '/record/testing',
  //   permission: 'admin'
  // },
  // {
  //   id: 8,
  //   title: 'Short Rail Inspection Record',
  //   icon: <CompassOutlined />,
  //   link: '/record/sri',
  //   permission: 'admin'
  // },
  // {
  //   id: 9,
  //   title: 'Calibration Record',
  //   icon: <ToolOutlined />,
  //   link: '/record/calibration',
  //   permission: 'admin'
  // }
]


const Records = () => {
  const navigate = useNavigate();
  const { userType } = useSelector(state => state.auth);

  // Filter records based on user permissions
  const filteredRecords = filterByPermissions(recordItemTabs, userType);

  const renderRecordItemTabs = () =>
    filteredRecords.map(item => {
      return (
        <div key={item.id}>
          <Tab
            title={item.title}
            icon={item.icon}
            onClick={() => navigate(item.link)}
          />
        </div>
      )
    });

  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {renderRecordItemTabs()}
      </div>
      {filteredRecords.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No records available for your role.</p>
        </div>
      )}
    </section>
  )
}

export default Records
