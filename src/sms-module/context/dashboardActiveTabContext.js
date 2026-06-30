/* eslint-disable */
// UserContext.js
import React, { createContext, useEffect, useState } from 'react';

// Create a Context
const ActiveTabContext = createContext();

// Create a provider component
const ActiveTabProvider = ({ children }) => {
  const [activeTab, setActiveTb] = useState(1);

    useEffect(() => {
        const dashboardActiveTab = localStorage.getItem("dashboardActiveTab")
        if(dashboardActiveTab){
            setActiveTb(parseInt(dashboardActiveTab))
        }
    }, [])

    const setActiveTab = (tabNo) => {
        setActiveTb(tabNo)
        localStorage.setItem("dashboardActiveTab", tabNo)
    }

  return (
    <ActiveTabContext.Provider value={{activeTab, setActiveTab}}>
      {children}
    </ActiveTabContext.Provider>
  );
};

export {ActiveTabProvider, ActiveTabContext}
