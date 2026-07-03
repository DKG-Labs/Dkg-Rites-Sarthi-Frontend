/* eslint-disable */
import React from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const SubHeader = ({ title, link }) => {
  const navigate = useNavigate();

  return (
    <header className="dkg-subheader">
      <button
        className="dkg-subheader-back"
        onClick={() => navigate(link)}
        aria-label="Go back"
      >
        <ArrowLeftOutlined style={{ fontSize: '13px' }} />
      </button>
      <span className="dkg-subheader-title">{title}</span>
    </header>
  );
};

export default SubHeader;
