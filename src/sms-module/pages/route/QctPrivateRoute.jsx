/* eslint-disable */
import { message } from 'antd';
import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const QctPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.qctDuty);

    if(!dutyId){
        // message.error("No ongoing QCT duty. Please start a duty.")
    }

  return (
    <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/qct/startDuty' />}
    </>
    // <Navigate to='/sms/qct/startDuty' />
  )
}

export default QctPrivateRoute