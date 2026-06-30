/* eslint-disable */
import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  UserOutlined, CalendarOutlined, HomeOutlined, IdcardOutlined,
  FileTextOutlined, RobotOutlined, LineChartOutlined, ProfileOutlined, SettingOutlined
} from '@ant-design/icons';
import TableComponent from '../../../components/DKG_Table';
import { ActiveTabContext } from '../../../context/dashboardActiveTabContext';
import { hasPermission } from '../../../utils/permissions';

const Home = () => {
  const { firstName, lastName, userType } = useSelector(state => state.auth);
  const { setActiveTab } = useContext(ActiveTabContext);

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : 'User';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  const dataSource = [
    { date: "2024-11-18", shift: "A", sms: "SMS2", casterNo: "Caster1", railGrade: "GradeA", noOfHeatsCasted: 5, noOfHeatsRejected: 1, noOfDivertedHeats: 2, rejectedHeatNumbers: "heat003", weightOfHeatsCasted: 50.0, weightOfPrimeBlooms: 40.0, weightOfCOBlooms: 8.0, weightOfAcceptedBlooms: 48.0, weightOfRejectedBlooms: 2.0 },
    { date: "2024-11-19", shift: "C", sms: "SMS3", casterNo: "Caster2", railGrade: "GradeB", noOfHeatsCasted: 6, noOfHeatsRejected: 2, noOfDivertedHeats: 1, rejectedHeatNumbers: "heat007", weightOfHeatsCasted: 60.0, weightOfPrimeBlooms: 45.0, weightOfCOBlooms: 10.0, weightOfAcceptedBlooms: 55.0, weightOfRejectedBlooms: 5.0 },
  ];

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', searchable: true },
    { title: 'Shift', dataIndex: 'shift', key: 'shift', filterable: true },
    { title: 'SMS', dataIndex: 'sms', key: 'sms', filterable: true },
    { title: 'Caster Number', dataIndex: 'casterNo', key: 'casterNo', searchable: true },
    { title: 'Rail Grade', dataIndex: 'railGrade', key: 'railGrade', filterable: true },
    { title: 'Heats Casted', dataIndex: 'noOfHeatsCasted', key: 'noOfHeatsCasted' },
    { title: 'Heats Rejected', dataIndex: 'noOfHeatsRejected', key: 'noOfHeatsRejected' },
    { title: 'Diverted Heats', dataIndex: 'noOfDivertedHeats', key: 'noOfDivertedHeats' },
    { title: 'Rejected Heat Numbers', dataIndex: 'rejectedHeatNumbers', key: 'rejectedHeatNumbers' },
    { title: 'Weight Cast', dataIndex: 'weightOfHeatsCasted', key: 'weightOfHeatsCasted' },
    { title: 'Weight Prime', dataIndex: 'weightOfPrimeBlooms', key: 'weightOfPrimeBlooms' },
    { title: 'Weight CO', dataIndex: 'weightOfCOBlooms', key: 'weightOfCOBlooms' },
    { title: 'Weight Accepted', dataIndex: 'weightOfAcceptedBlooms', key: 'weightOfAcceptedBlooms' },
    { title: 'Weight Rejected', dataIndex: 'weightOfRejectedBlooms', key: 'weightOfRejectedBlooms' },
  ];

  const s = {
    fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
  };

  return (
    <div style={{ ...s }}>
      {/* Welcome Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(33,128,141,0.08) 0%, rgba(33,128,141,0.02) 100%)',
          border: '1px solid rgba(33,128,141,0.2)',
          borderLeft: '4px solid #21808d',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
            <div
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(33,128,141,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <UserOutlined style={{ color: '#21808d', fontSize: '18px' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#13343b' }}>
                Welcome, {fullName}!
              </div>
              {userType && (
                <div style={{ fontSize: '0.8rem', color: '#626c71', fontWeight: 500 }}>
                  {userType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#626c71', marginBottom: '0.25rem', justifyContent: 'flex-end' }}>
            <CalendarOutlined style={{ fontSize: '13px' }} />
            <span style={{ fontSize: '0.8rem' }}>{currentDate}</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#21808d' }}>{currentTime}</div>
        </div>
      </div>

      {/* Dashboard Overview Section */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '3px', height: '18px', background: '#21808d', borderRadius: '2px' }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#13343b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Dashboard Overview
        </span>
      </div>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid rgba(94, 82, 64, 0.15)',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <p style={{ fontSize: '0.875rem', color: '#626c71', margin: 0, lineHeight: 1.7 }}>
          Welcome to the <strong style={{ color: '#13343b' }}>RITES Quality Assurance System</strong>.
          {(userType === 'LOCAL_ADMIN' || userType === 'MAIN_ADMIN')
            ? ' Use the quick access cards above or the navigation menu to access different modules based on your role permissions.'
            : ' Use the navigation menu to access different modules based on your role permissions.'
          }
        </p>
      </div>
    </div>
  );
};

export default Home;
