/* eslint-disable */
import React, { useEffect } from 'react';
import Routes from './pages/route/Routes';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { getOngoingSmsDutyDtls } from './store/slice/smsDutySlice';
import { getOngoingRollingDutyDtls } from './store/slice/rollingDutySlice';
import { getOngoingNdtDutyDtls } from './store/slice/ndtDutySlice';
import { getOngoingViDutyDtls } from './store/slice/viDutySlice';
import { getOngoingCalibrationDutyDtls } from './store/slice/calibrationDutySlice';
import { getOngoingWeldingDutyDtls } from './store/slice/weldingDutySlice';
import { getOngoingQctDutyDtls } from './store/slice/qctDutySlice';
import { getOngoingSriDutyDtls } from './store/slice/sriDutySlice';
import { getOngoingTestingDutyDtls } from './store/slice/testingDutySlice';
import { API_BASE_URL } from '../services/apiConfig';

axios.defaults.baseURL = API_BASE_URL;

// console.log("accd")

function App() {
  const dispatch = useDispatch();
  const {token} = useSelector(state => state.auth);

  useEffect(() => {
    if(token){
      dispatch(getOngoingSmsDutyDtls());
      dispatch(getOngoingRollingDutyDtls());
      dispatch(getOngoingViDutyDtls());
      dispatch(getOngoingCalibrationDutyDtls());
      dispatch(getOngoingNdtDutyDtls());
      dispatch(getOngoingWeldingDutyDtls());
      dispatch(getOngoingQctDutyDtls());
      dispatch(getOngoingSriDutyDtls());
      dispatch(getOngoingTestingDutyDtls());
    }
  }, [dispatch, token])
  
  return (
    <Routes />
  );
}

export default App;
