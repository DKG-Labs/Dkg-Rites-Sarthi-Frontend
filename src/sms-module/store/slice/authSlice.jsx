/* eslint-disable */
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import { message } from 'antd'
import axios from 'axios'

const initialState = {
    token: null,
    firstName: null,
    lastName: null,
    userId: null,
    employeeId: null,
    userType: null
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state, action){
            state.token = null
            state.firstName = null
            state.lastName = null
            state.userId = null
            state.employeeId = null
            state.userType = null
        },
        setAuthData(state, action) {
            state.token = action.payload.token;
            state.firstName = action.payload.userName;
            state.userId = action.payload.userId;
            state.employeeId = action.payload.employeeCode;
            
            // Map roleName to userType for SMS module permissions
            const roles = action.payload.roleName || [];
            if (roles.includes("Rail SMS") || roles.includes("IE") || roles.includes("Process IE")) {
                state.userType = "INSPECTING_ENGINEER";
            } else if (roles.includes("Rites Admin") || roles.includes("MAIN_ADMIN")) {
                state.userType = "MAIN_ADMIN";
            } else if (roles.includes("LOCAL_ADMIN")) {
                state.userType = "LOCAL_ADMIN";
            } else if (roles.includes("MANAGER")) {
                state.userType = "MANAGER";
            } else {
                state.userType = "INSPECTING_ENGINEER"; // Default fallback
            }
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(login.pending, state => {
            state.loading = true
            state.error = null
        })
        .addCase(login.fulfilled, (state, action) => {
            state.loading = false
            const{payload} = action
                state.token = payload?.token
                state.firstName = payload?.firstName;
                state.lastName = payload?.lastName;
                state.userId = payload?.userId;
                state.employeeId = payload?.employeeId;
                state.userType = payload?.userType
        })
        .addCase(login.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message
        })
    }
})

export const login = createAsyncThunk(
    'auth/login',
    async (formData) => {
        try{
            const {data} = await axios.post("/login", formData);
            if (data?.responseStatus?.statusCode === 1) {
                return data?.responseData;
            } else {
                throw new Error(data?.responseStatus?.message || "Login failed.");
            }
        }
        catch(error){
            const errorMsg = error?.response?.data?.responseStatus?.message || error.message || "Error logging.";
            message.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
)

export const {logout, setAuthData} = authSlice.actions
export default authSlice.reducer
