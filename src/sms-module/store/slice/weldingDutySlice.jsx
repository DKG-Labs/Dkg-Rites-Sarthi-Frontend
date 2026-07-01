/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { apiCall } from '../../utils/CommonFunctions'
import { message } from 'antd'

const initialState = {
    // dutyId: null,
    date: null,
    startTime: null,
    shift: null,
    mill: null,
    weldingLine: null,
    railGrade: null,
    railSection: null
}

const weldingDutySlice = createSlice({
    name: "weldingDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startWeldingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startWeldingDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.dutyId = payload?.dutyId;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.mill = payload?.mill
            state.weldingLine = payload?.weldingLine
            state.railGrade = payload?.railGrade
            state.railSection = payload?.railSection
        })
        .addCase(startWeldingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endWeldingDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endWeldingDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.dutyId = null;
            state.date = null;
            state.startTime = null;
            state.shift = null;
            state.mill = null;
            state.weldingLine = null;
            state.railGrade = null;
            state.railSection = null;
        })
        .addCase(endWeldingDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingWeldingDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingWeldingDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.dutyId = payload?.dutyId;
            state.date = payload?.date;
            state.startTime = payload?.startTime;
            state.shift = payload?.shift;
            state.mill = payload?.mill
            state.weldingLine = payload?.weldingLine
            state.railGrade = payload?.railGrade
            state.railSection = payload?.railSection
        })
        .addCase(getOngoingWeldingDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startWeldingDuty = createAsyncThunk(
    "weldingDuty/startWeldingDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/welding/startDuty", token, formData)
            message.success("Welding duty started successfully.");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endWeldingDuty = createAsyncThunk(
    "weldingDuty/endWeldingDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().weldingDuty;
        try{
            await apiCall("POST", "/welding/endDuty", token, {...formData, dutyId});
            message.success("Welding duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingWeldingDutyDtls = createAsyncThunk(
    "weldingDuty/getOngoingWeldingDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        try{
            const {data} = await apiCall("GET", "/welding/getOngoingDutyDtls", token);
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export default weldingDutySlice.reducer