/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { apiCall } from '../../utils/CommonFunctions'
import { message } from 'antd'

const initialState = {
    dutyId: null,
    date: null,
    startTime: null,
    shift: null,
    sms: null,
    railGrade: null
}

const smsDutySlice = createSlice({
    name: "smsDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startSmsDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startSmsDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.sms = payload?.sms;
            state.railGrade = payload?.railGrade
            state.dutyId = payload?.dutyId
        })
        .addCase(startSmsDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endSmsDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endSmsDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.sms = null;
            state.railGrade = null;
            state.dutyId = null;
        })
        .addCase(endSmsDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingSmsDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingSmsDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.sms = payload?.sms;
            state.railGrade = payload?.railGrade
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingSmsDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startSmsDuty = createAsyncThunk(
    "smsDuty/startSmsDuty",
    async (formData, {getState, rejectWithValue})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/sms/startDuty", token, formData)
            message.success("SMS Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            return rejectWithValue(error?.response?.data || error?.message);
        }
    }
)

export const endSmsDuty = createAsyncThunk(
    "smsDuty/endSmsDuty",
    async (formData, {getState, rejectWithValue})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().smsDuty;
        try{
            await apiCall("POST", "/sms/endDuty", token, {...formData, dutyId});
            message.success("SMS duty ended successfully.");
        }
        catch(error){
            return rejectWithValue(error?.response?.data || error?.message);
        }
    }
)

export const getOngoingSmsDutyDtls = createAsyncThunk(
    "smsDuty/getOngoingSmsDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        try{
            const {data} = await apiCall("GET", "/sms/getOngoingDutyDtls", token);
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export default smsDutySlice.reducer