/* eslint-disable */
import { message } from 'antd';
import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

const CalibrationPrivateRoute = () => {

    const {dutyId} = useSelector(state => state.calibrationDuty);

    if(!dutyId){
        message.error("No ongoing Calibration duty. Please start a duty.")
    }

  return (
    <>
        {(dutyId) ? <Outlet /> : <Navigate to='/sms/calibration/list' />}
    </>
  )
}

export default CalibrationPrivateRoute