/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { apiCall } from '../../utils/CommonFunctions'
import { message } from 'antd'

const initialState = {
    dutyId: null,
    date: null,
    startTime: null,
    shift: null,
    mill: null,
    railGrade: null,
    railSection: null
}

const rollingDutySlice = createSlice({
    name: "rollingDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startRollingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startRollingDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.railGrade = payload?.railGrade
            state.railSection = payload?.railSection
            state.mill = payload?.mill
            state.dutyId = payload?.dutyId
        })
        .addCase(startRollingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endRollingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endRollingDuty.fulfilled, (state, action) => {
            state.dutyId= null
            state.date= null
            state.startTime= null
            state.shift= null
            state.mill= null
            state.railGrade= null
            state.railSection= null
        })
        .addCase(endRollingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingRollingDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingRollingDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.railGrade = payload?.railGrade
            state.railSection = payload?.railSection
            state.mill = payload?.mill
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingRollingDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startRollingDuty = createAsyncThunk(
    "rollingDuty/startRollingDuty",
    async (formData, {getState}) => {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/rolling/startDuty", token, formData)
            message.success("Rolling Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endRollingDuty = createAsyncThunk(
    "rollingDuty/endRollingDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().rollingDuty;
        try{
            await apiCall("POST", "/rolling/endDuty", token, {...formData, dutyId});
            message.success("Rolling duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingRollingDutyDtls = createAsyncThunk(
    "rollingDuty/getOngoingRollingDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        try{
            const {data} = await apiCall("GET", "/rolling/getOngoingDutyDtls", token);
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export default rollingDutySlice.reducer;