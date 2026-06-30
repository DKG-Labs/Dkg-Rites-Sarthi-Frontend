/* eslint-disable */
import { message } from 'antd';
import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const SRIPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.sriDuty);

    if(!dutyId){
        // message.error("No ongoing SRI duty. Please start a duty.")
    }

  return (
    <>
      {(dutyId) ? <Outlet /> : <Navigate to='/sms/srInspection/startDuty' />}
    </>
  )
}

export default SRIPrivateRoute