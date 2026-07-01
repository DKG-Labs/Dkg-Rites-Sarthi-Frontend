/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { apiCall } from '../../utils/CommonFunctions'
import { message } from 'antd'

const initialState = {
    dutyId: null,
    date: null,
    startTime: null,
    shift: null,
}

const calibrationDutySlice = createSlice({
    name: "calibrationDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startCalibrationDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startCalibrationDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(startCalibrationDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endCalibrationDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endCalibrationDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.dutyId = null;
        })
        .addCase(endCalibrationDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingCalibrationDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingCalibrationDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingCalibrationDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startCalibrationDuty = createAsyncThunk(
    "calibrationDuty/startCalibrationDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/calibration/startDuty", token, formData)
            // message.success("Calibration Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endCalibrationDuty = createAsyncThunk(
    "calibrationDuty/endCalibrationDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().calibrationDuty;
        try{
            await apiCall("POST", "/calibration/endDuty", token, {...formData, dutyId});
            message.success("Calibration duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingCalibrationDutyDtls = createAsyncThunk(
    "calibrationDuty/getOngoingCalibrationDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        const {data} = await apiCall("GET", "/calibration/getOngoingDutyDtls", token);
        return data?.responseData;
    }
)

export default calibrationDutySlice.reducer