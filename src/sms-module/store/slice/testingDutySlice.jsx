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

const testingDutySlice = createSlice({
    name: "testingDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startTestingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startTestingDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(startTestingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endTestingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endTestingDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.dutyId = null;
        })
        .addCase(endTestingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingTestingDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingTestingDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingTestingDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startTestingDuty = createAsyncThunk(
    "testingDuty/startTestingDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/testing/startDuty", token, formData)
            message.success("Testing Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endTestingDuty = createAsyncThunk(
    "testingDuty/endTestingDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().testingDuty;
        try{
            await apiCall("POST", "/testing/endDuty", token, {...formData, dutyId});
            message.success("Testing duty ended successfully.");
        }
        catch(error){

        }

        return true;
    }
)

export const getOngoingTestingDutyDtls = createAsyncThunk(
    "testingDuty/getOngoingTestingDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        const {data} = await apiCall("GET", "/testing/getOngoingDutyDtls", token);
        return data?.responseData;
    }
)

export default testingDutySlice.reducer