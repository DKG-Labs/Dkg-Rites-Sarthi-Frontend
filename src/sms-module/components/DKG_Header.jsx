/* eslint-disable */
import React from "react";
import { ReactComponent as Logo } from "../assets/images/logo.svg";
import { MenuOutlined, IdcardOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Header = ({ toggleCollapse }) => {
  const navigate = useNavigate();
  const { firstName, lastName, userType, userId, employeeId } = useSelector(state => state.auth);

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : 'User';
  const displayEmployeeId = employeeId || userId;

  return (
    <header
      className="dkg-header"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(94, 82, 64, 0.15)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        padding: '0 1.5rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        width: '100%',
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Left: Menu toggle + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          onClick={toggleCollapse}
          aria-label="Toggle sidebar"
          style={{
            background: 'transparent',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            width: '34px',
            height: '34px',
            minWidth: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#626c71',
            transition: 'all 0.2s',
            padding: 0,
            outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#21808d';
            e.currentTarget.style.color = '#21808d';
            e.currentTarget.style.background = 'rgba(33,128,141,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#626c71';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <MenuOutlined style={{ fontSize: '14px', color: 'inherit' }} />
        </button>

        <span
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Logo height={32} width={84} />
        </span>
      </div>

      {/* Right: User info */}
      {displayEmployeeId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.375rem 0.875rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'box-shadow 0.2s',
          }}
        >
          {/* Employee ID badge */}
          <div
            style={{
              background: 'rgba(33,128,141,0.08)',
              border: '1px solid rgba(33,128,141,0.2)',
              borderRadius: '6px',
              padding: '0.15rem 0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <IdcardOutlined style={{ color: '#21808d', fontSize: '12px' }} />
            <span style={{ fontSize: '0.7rem', color: '#21808d', fontWeight: 700 }}>
              {displayEmployeeId}
            </span>
          </div>

          {/* Divider — hidden on mobile */}
          <div
            className="hidden md:block"
            style={{ width: '1px', height: '24px', background: '#e2e8f0' }}
          />

          {/* Name + role — hidden on mobile */}
          <div className="hidden md:block" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#13343b', lineHeight: 1.3 }}>
              {fullName}
            </div>
            {userType && (
              <div style={{ fontSize: '0.68rem', color: '#626c71', marginTop: '1px' }}>
                {userType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
