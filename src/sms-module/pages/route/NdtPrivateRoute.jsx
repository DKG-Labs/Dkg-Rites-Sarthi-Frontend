/* eslint-disable */

import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const NdtPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.ndtDuty);

    if(!dutyId){
        // message.error("No ongoing NDT duty. Please start a duty.")
    }

  return (
    <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/ndt/startDuty' />}
    </>
  )
}

export default NdtPrivateRoute