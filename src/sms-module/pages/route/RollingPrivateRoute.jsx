/* eslint-disable */

import React from 'react'
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const RollingPrivateRoute = () => {
    const {dutyId} = useSelector(state => state.rollingDuty);
    if(!dutyId){
      // message.error("No ongoing Rolling duty. Please start a duty.")
    }

    return (
        <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/stage/startDuty' />}
        </>
      )
}

export default RollingPrivateRoute