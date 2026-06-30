/**
 * SMS Dashboard Wrapper
 * Wrapper component for the SMS Module that isolates its Redux Provider
 */

import React, { useEffect } from 'react';
import { Provider, useDispatch } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import toolkitStore, { persistor } from "../../sms-module/store/index";
import SmsApp from "../../sms-module/App";
import "../../sms-module/index.css";
import { getStoredUser } from '../../services/authService';
import { setAuthData } from '../../sms-module/store/slice/authSlice';

const SmsInit = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.token) {
      dispatch(setAuthData(user));
    }
  }, [dispatch]);
  return <SmsApp />;
};

export const SmsDashboardWrapper = () => {
  return (
    <PersistGate persistor={persistor}>
      <Provider store={toolkitStore}>
        <SmsInit />
      </Provider>
    </PersistGate>
  );
};
