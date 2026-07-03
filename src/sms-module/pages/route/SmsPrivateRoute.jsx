/* eslint-disable */

import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const SmsPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.smsDuty);
    if(!dutyId){
      // message.error("No ongoing SMS duty. Please start a duty.")
    }

    return (
        <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/sms/dutyStart' />}
        </>
      )
}

export default SmsPrivateRoute