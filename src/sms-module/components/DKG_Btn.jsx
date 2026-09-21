/* eslint-disable */
import { Button } from 'antd';
import React from 'react';

/**
 * DKG_Btn — Primary action button, styled with Sleeper Vendor design.
 * Preserves all original props: text, children, onClick, htmlType, className, disabled
 */
const Btn = ({ text, children, onClick, htmlType, className, disabled, loading, ...rest }) => {
  return (
    <Button
      disabled={disabled}
      loading={loading}
      htmlType={htmlType || 'button'}
      onClick={onClick}
      type="primary"
      className={className}
      {...rest}
    >
      {text ? text : children}
    </Button>
  );
};

export default Btn;
