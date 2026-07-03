/* eslint-disable */
import React from 'react';

const DKG_FormSectionHeader = ({ step, title }) => {
  return (
    <div className="step-indicator-wrapper">
      <div className="step-circle">
        {step}
      </div>
      <span className="step-text">
        {title}
      </span>
    </div>
  );
};

export default DKG_FormSectionHeader;
