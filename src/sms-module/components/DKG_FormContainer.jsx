/* eslint-disable */
import React from 'react';

const FormContainer = ({ children, className }) => {
  return (
    <div
      className={`form-section-card w-full max-w-6xl mx-auto ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default FormContainer;
