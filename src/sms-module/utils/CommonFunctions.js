/* eslint-disable */
import { message } from "antd";
import axios from "axios";
import dayjs from "dayjs"

const RAILMILL_API_PREFIXES = [
  'rolling', 'ndt', 'testing', 'vi', 'welding', 'shortrailinspection', 'qct',
  'calibration', 'bsp', 'dashboard', 'public', 'iso', 'api/fwt',
];

/** "/rolling/startDuty" -> "/sms/rolling/startDuty"; "/sms/..." and other paths are left unchanged. */
export const toRailMillUrl = (url) => {
  if (typeof url !== 'string' || /^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url.slice(1) : url;
  if (path.startsWith('sms/')) return '/' + path;
  const hit = RAILMILL_API_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'));
  return hit ? '/sms/' + path : url;
};

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

  // Rail-mill (Rites) APIs live in SARTHI under /sms/... (com.sarthi.Sms) so they never collide with SARTHI's own
  // routes (e.g. /calibration/{callNo}, /dashboard). Prefix them here once, so the pages keep their original paths.
  url = toRailMillUrl(url);

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
    if (value === null || value === undefined || value === "") {
      return { number: null, isFloat: true };
    }

    const strVal = String(value).trim();
    if (strVal === "" || !/^-?\d+(\.\d+)?$/.test(strVal)) {
      message.error("Invalid number.");
      return { number: null, isFloat: false };
    }

    return { number: parseFloat(strVal), isFloat: true };
  };

  export const getCurrentDate = () => {
    const dateFormat = "DD/MM/YYYY";
    const currentDate = dayjs();
    return currentDate.format(dateFormat);
  }