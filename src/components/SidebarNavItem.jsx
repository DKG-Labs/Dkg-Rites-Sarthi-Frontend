import React from 'react';

const SidebarNavItem = React.memo(({ active, onClick, icon, text, title, style }) => (
  <li
    className={`sidebar-item${active ? ' active' : ''}`}
    onClick={onClick}
    title={title}
    style={style}
  >
    <span className="sidebar-icon">{icon}</span>
    <span className="sidebar-text">{text}</span>
  </li>
));

export default SidebarNavItem;
