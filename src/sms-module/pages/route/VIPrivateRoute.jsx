/* eslint-disable */

import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const VIPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.viDuty);

    if(!dutyId){
        // message.error("No ongoing VI duty. Please start a duty.")
    }

  return (
    <>
        {(dutyId) ? <Outlet /> : <Navigate to='/vi/startDuty' />}
    </>
  )
}

export default VIPrivateRoute