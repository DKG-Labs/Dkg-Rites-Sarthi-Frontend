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

const sriDutySlice = createSlice({
    name: "sriDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startSriDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startSriDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(startSriDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endSriDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endSriDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.dutyId = null;
        })
        .addCase(endSriDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingSriDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingSriDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingSriDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startSriDuty = createAsyncThunk(
    "sriDuty/startSriDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/shortrailinspection/startDuty", token, formData)
            message.success("SRI Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endSriDuty = createAsyncThunk(
    "sriDuty/endSriDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().sriDuty;
        try{
            await apiCall("POST", "/shortrailinspection/endDuty", token, {...formData, dutyId});
            message.success("SRI duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingSriDutyDtls = createAsyncThunk(
    "sriDuty/getOngoingSriDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        const {data} = await apiCall("GET", "/shortrailinspection/getOngoingDutyDtls", token);
        return data?.responseData;
    }
)

export default sriDutySlice.reducer