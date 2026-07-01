/* eslint-disable */

import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const WeldingPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.weldingDuty);

    if(!dutyId){
        // message.error("No ongoing Welding duty. Please start a duty.")
    }

  return (
    <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/welding/startDuty' />}
    </>
  )
}

export default WeldingPrivateRoute