/* eslint-disable */
import React from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const SubHeader = ({ title, link }) => {
  const navigate = useNavigate();

  return (
    <header className="dkg-subheader relative flex items-center justify-center min-h-[56px] px-4">
      {link && (
        <button
          className="dkg-subheader-back absolute left-4 top-1/2 -translate-y-1/2"
          onClick={() => navigate(link)}
          aria-label="Go back"
        >
          <ArrowLeftOutlined style={{ fontSize: '14px' }} />
        </button>
      )}
      <span className="dkg-subheader-title text-center m-0">{title}</span>
    </header>
  );
};

export default SubHeader;
