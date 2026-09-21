/* eslint-disable */
import React from 'react';
import { Button, Tooltip } from 'antd';
import PropTypes from 'prop-types';

/**
 * DKG_IconBtn — Icon button matching Sleeper Vendor design.
 * Styled as a clean square button with teal hover.
 */
const IconBtn = React.forwardRef(({ icon: Icon, tooltipTitle, onClick, className, text, ...props }, ref) => {
  const buttonNode = (
    <Button
      ref={ref}
      onClick={onClick}
      className={className}
      {...props}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        width: text ? 'auto' : '36px',
        height: '36px',
        padding: text ? '0 0.875rem' : '0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer',
        color: '#626c71',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'all 0.2s',
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        fontSize: '0.8rem',
        fontWeight: 600,
        ...(props.style || {}),
      }}
    >
      {Icon && <Icon style={{ fontSize: '14px', color: 'inherit' }} />}
      {text && <span>{text}</span>}
    </Button>
  );

  if (tooltipTitle) {
    return <Tooltip title={tooltipTitle}>{buttonNode}</Tooltip>;
  }

  return buttonNode;
});

IconBtn.displayName = 'IconBtn';

IconBtn.propTypes = {
  icon: PropTypes.elementType,
  tooltipTitle: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  text: PropTypes.string,
};

export default IconBtn;
