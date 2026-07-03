/* eslint-disable */
import React from 'react';

const FormContainer = ({ children, className }) => {
  return (
    <div
      className={`form-section-card max-w-4xl mx-auto ${className || ''}`}
    >
      {children}
    </div>
  );
};

export default FormContainer;
