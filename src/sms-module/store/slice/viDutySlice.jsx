/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { apiCall } from '../../utils/CommonFunctions'
import { message } from 'antd'

const initialState = {
    dutyId: null,
    startTime: null,
    date: null,
    shift: null,
    mill: null,
    lineNo: null,
    railGrade: null,
    railSection: null,
    stdOffLength: null,
    ieName1: null,
    ieName2: null,
    ieName3: null,
    rclIeName1: null,
    rclIeName2: null,
    rclIeName3: null,
}

const viDutySlice = createSlice({
    name: "viDuty",
    initialState,
    extraReducers: (builder) => {
        builder
        .addCase(startViDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(startViDuty.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.dutyId = payload?.dutyId;
            state.startTime = payload?.startTime;
            state.date = payload?.date;
            state.shift = payload?.shift;
            state.mill = payload?.mill;
            state.lineNo = payload?.lineNo;
            state.railGrade = payload?.railGrade;
            state.railSection = payload?.railSection;
            state.stdOffLength = payload?.stdOffLength;
            state.ieName1 = payload?.ieName1;
            state.ieName2 = payload?.ieName2;
            state.ieName3 = payload?.ieName3;
            state.rclIeName1 = payload?.rclIeName1;
            state.rclIeName2 = payload?.rclIeName2;
            state.rclIeName3 = payload?.rclIeName3;
        })
        .addCase(startViDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(endViDuty.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(endViDuty.fulfilled, (state, action) => {
            state.loading = false;
            state.dutyId = null;
            state.startTime = null;
            state.date = null;
            state.shift = null;
            state.mill = null;
            state.lineNo = null;
            state.railGrade = null;
            state.railSection = null;
            state.stdOffLength = null;
            state.ieName1 = null;
            state.ieName2 = null;
            state.ieName3 = null;
            state.rclIeName1 = null;
            state.rclIeName2 = null;
            state.rclIeName3 = null;
        })
        .addCase(endViDuty.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
        .addCase(getOngoingViDutyDtls.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(getOngoingViDutyDtls.fulfilled, (state, action) => {
            state.loading = false;
            const {payload} = action;
            state.dutyId = payload?.dutyId;
            state.startTime = payload?.startTime;
            state.date = payload?.date;
            state.shift = payload?.shift;
            state.mill = payload?.mill;
            state.lineNo = payload?.lineNo;
            state.railGrade = payload?.railGrade;
            state.railSection = payload?.railSection;
            state.stdOffLength = payload?.stdOffLength;
            state.ieName1 = payload?.ieName1;
            state.ieName2 = payload?.ieName2;
            state.ieName3 = payload?.ieName3;
            state.rclIeName1 = payload?.rclIeName1;
            state.rclIeName2 = payload?.rclIeName2;
            state.rclIeName3 = payload?.rclIeName3;
        })
        .addCase(getOngoingViDutyDtls.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        })
    }
})

export const startViDuty = createAsyncThunk(
    "viDuty/startViDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth
        try{
            const {data} = await apiCall("POST", "/vi/startDuty", token, formData)
            message.success("VI Duty started successfully");
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export const endViDuty = createAsyncThunk(
    "viDuty/endViDuty",
    async (formData, {getState})=> {
        const {token} = getState().auth;
        const {dutyId} = getState().viDuty;
        try{
            await apiCall("POST", "/vi/endDuty", token, {...formData, dutyId});
            message.success("VI duty ended successfully.");
        }
        catch(error){

        }
    }
)

export const getOngoingViDutyDtls = createAsyncThunk(
    "viDuty/getOngoingViDutyDtls",
    async (_, {getState}) => {
        const {token} = getState().auth;
        try{
            const {data} = await apiCall("GET", "/vi/getOngoingDutyDtls", token);
            return data?.responseData;
        }
        catch(error){
            
        }
    }
)

export default viDutySlice.reducer