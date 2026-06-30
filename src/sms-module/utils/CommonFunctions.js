/* eslint-disable */
import { message } from "antd";
import axios from "axios";
import dayjs from "dayjs"

export const apiCall = async (method, url, token, payload = null, signal = null) => {

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // Add abort signal if provided
  if (signal) {
    config.signal = signal;
  }

  const unbuiltDuties = [
    '/rolling/', '/ndt/', '/testing/', '/vi/',
    '/welding/', '/shortrailinspection/', '/qct/', '/calibration/'
  ];

  // MOCK missing backend APIs to prevent 404 spam on load
  if (unbuiltDuties.some(duty => url.includes(duty))) {
    console.log("Mocking missing API:", method, url, payload);
    return {
      data: {
        responseStatus: { statusCode: 0, message: "Mock Success" },
        responseData: {
            heatDtlList: [],
            lecoClbList: [],
            records: [],
            isDiverted: false,
            dutyId: null, // Null indicates duty is not active
            ...(payload || {})
        }
      }
    };
  }

  try {
    let response;

    if (method === "GET") {
      response = await axios.get(url, config);
    } else if (method === "POST") {
      response = await axios.post(url, payload, config);
    } else if (method === "PUT") {
      response = await axios.put(url, payload, config);
    } else if (method === "DELETE") {
      response = await axios.delete(url, config);
    }

    // Check response status code (allow 1 for old APIs, 0 for new Sarthi Backend)
    const statusCode = response.data?.responseStatus?.statusCode;
    if (statusCode === 1 || statusCode === 0) {
      return response; // Return the data on success
    } else {
      // Throw an error if the status code indicates failure
      throw new Error(response.data?.responseStatus?.message || "Request failed.");
    }
  } catch (error) {
    // Don't show error message for cancelled requests
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      throw error; // Just rethrow without showing message
    }

    // Display error alert for other errors, extracting the actual backend message if possible
    const errorMessage = error?.response?.data?.responseStatus?.message 
      || error?.message 
      || "Some error occurred.";
    message.error(errorMessage);
    
    // Rethrow the error for the calling function to handle
    throw error;
  }
};

  export const handleChange = (fieldName, value, setFormData) => {
    setFormData(prev => {
      return {
        ...prev,
        [fieldName]: value
      }
    })
  }

  

  export const checkAndConvertToFLoat = (value) => {
    if( value === null || value === ""){
      console.log("VALIE NULL")
      return {number: null, isFLoat: true}
    }

    console.log("VALIE NOT NULL, ", value)

    if (value.trim() === "" || !/^-?\d+(\.\d+)?$/.test(value)) {
      message.error("Invalid number.");
      return{number: null, isFloat: false};
    }

    return {number: parseFloat(value), isFloat: true}
  }

  export const getCurrentDate = () => {
    const dateFormat = "DD/MM/YYYY";
    const currentDate = dayjs();
    return currentDate.format(dateFormat);
  }