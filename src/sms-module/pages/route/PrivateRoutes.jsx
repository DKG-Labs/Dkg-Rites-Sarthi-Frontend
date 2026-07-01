/* eslint-disable */
import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

const PrivateRoutes = () => {
  const {token} = useSelector(state => state.auth)
  
  return (
    <> 
    {token ? <Outlet /> : <Navigate to='/login' />}
    </>
  )
  
}

export default PrivateRoutes
