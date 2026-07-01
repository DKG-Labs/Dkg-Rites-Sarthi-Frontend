/* eslint-disable */
import React from 'react'
import { ActiveTabProvider } from '../../context/dashboardActiveTabContext'
import CustomLayout from '../../components/DKG_CustomLayout'
import Dashboard from '../dashboard/Dashboard'
import { Outlet } from 'react-router-dom'

const LayoutWithDashboard = () => {
  return (
    <ActiveTabProvider>
      <CustomLayout>
        <Dashboard />
        <Outlet />
      </CustomLayout>
    </ActiveTabProvider>
  )
}

export default LayoutWithDashboard
