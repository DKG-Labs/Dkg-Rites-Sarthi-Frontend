/* eslint-disable */
import React from 'react'
import Tab from './DKG_Tab'
import { useNavigate } from 'react-router-dom'

const TabList = ({tabList, className}) => {
    const navigate = useNavigate()


  return (
//     <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
//     {tabList?.map((tab, key) => (
//       tab.state ? (
//         <Tab
//           key={key}
//           title={tab.title}
//           icon={tab.icon}
//           onClick={() => navigate(tab.link, tab.state)}
//         />
//       ) : (
//         <Tab
//           key={key}
//           title={tab.title}
//           icon={tab.icon}
//           onClick={() => navigate(tab.link)}
//         />
//       )
//     ))}
//   </div>

<div className={`grid grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
  {tabList?.map((tab, index) => (
    <Tab
      key={index} // Used for React's reconciliation process
      id={index}  // Pass it explicitly as a prop if needed in the child
      title={tab.title}
      icon={tab.icon}
      onClick={tab.onClick || (() => navigate(tab.link, tab.state))}
    />
  ))}
</div>
  )
}

export default TabList