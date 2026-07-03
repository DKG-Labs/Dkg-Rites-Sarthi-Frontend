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

const qctDutySlice = createSlice({
    name: "qctDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startQctDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startQctDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(startQctDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endQctDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endQctDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.dutyId = null;
        })
        .addCase(endQctDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingQctDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingQctDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingQctDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startQctDuty = createAsyncThunk(
    "qctDuty/startQctDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/qct/startDuty", token, formData)
            message.success("QCT Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endQctDuty = createAsyncThunk(
    "qctDuty/endQctDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().qctDuty;
        try{
            await apiCall("POST", "/qct/endDuty", token, {...formData, dutyId});
            message.success("QCT duty ended successfully.");
        }
        catch(error){

        }

        return true;
    }
)

export const getOngoingQctDutyDtls = createAsyncThunk(
    "qctDuty/getOngoingQctDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        const {data} = await apiCall("GET", "/qct/getOngoingDutyDtls", token);
        return data?.responseData;
    }
)

export default qctDutySlice.reducer