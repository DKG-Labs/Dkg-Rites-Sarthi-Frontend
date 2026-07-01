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
    ndt: null,
    railGrade: null,
    railSection: null,
}

const ndtDutySlice = createSlice({
    name: "ndtDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startNdtDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startNdtDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.mill = payload?.mill;
            state.ndt = payload?.ndt;
            state.railGrade = payload?.railGrade;
            state.railSection = payload?.railSection;
            state.dutyId = payload?.dutyId
        })
        .addCase(startNdtDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endNdtDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endNdtDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.mill = null;
            state.ndt = null;
            state.railGrade = null;
            state.railSection = null;
            state.dutyId = null;
        })
        .addCase(endNdtDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingNdtDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingNdtDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.mill = payload?.mill;
            state.ndt = payload?.ndt;
            state.railGrade = payload?.railGrade;
            state.railSection = payload?.railSection;
            state.dutyId = payload?.dutyId
        })
        .addCase(getOngoingNdtDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startNdtDuty = createAsyncThunk(
    "ndtDuty/startNdtDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/ndt/startDuty", token, formData)
            message.success("NDT Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endNdtDuty = createAsyncThunk(
    "ndtDuty/endNdtDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().ndtDuty;
        try{
            await apiCall("POST", "/ndt/endDuty", token, {...formData, dutyId});
            message.success("NDT duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingNdtDutyDtls = createAsyncThunk(
    "ndtDuty/getOngoingNdtDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        const {data} = await apiCall("GET", "/ndt/getOngoingDutyDtls", token);
        return data?.responseData;
    }
)

export default ndtDutySlice.reducer                                                                       
