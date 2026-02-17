import React from 'react';

/**
 * StatusBadge Component
 * Supports two usage patterns:
 * 1. Simple: <StatusBadge status="pending" /> - uses CSS classes
 * 2. Styled: <StatusBadge label="Pending" color="#f59e0b" bgColor="rgba(...)" borderColor="rgba(...)" />
 * Fixed: Now properly renders status badges for Call Desk module
 */
const StatusBadge = ({ status, label, color, bgColor, borderColor }) => {
  // If using styled props (Call Desk pattern)
  if (label && color && bgColor && borderColor) {
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: bgColor,
          color: color,
          border: `1px solid ${borderColor}`,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-block',
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </span>
    );
  }

  // If using simple status prop (original pattern)
  if (!status) return null;

  // Convert status to CSS class (handle spaces, underscores and special characters)
  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/[_\s]+/g, '-')   // Replace spaces/underscores with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove other special characters
  };

  // Format status text for display (convert underscores to spaces and title case)
  const formatStatusText = (status) => {
    return status
      .replace(/_/g, ' ')  // Replace underscores with spaces
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const className = `status-badge ${getStatusClass(status)}`;
  const displayText = formatStatusText(status);

  return <span className={className}>{displayText}</span>;
};

export default StatusBadge;
