/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import data from "../../../../../utils/frontSharedData/calibration/calibration.json";
import { useLocation, useNavigate } from 'react-router-dom';
import { message, Form } from 'antd'
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import CustomDatePicker from '../../../../../components/DKG_CustomDatePicker';
import Btn from '../../../../../components/DKG_Btn';
import { apiCall, handleChange } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';
import dayjs from "dayjs";
import FormSearchItem from '../../../../../components/DKG_FormSearchItem';

import { Upload, Button } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import Papa from 'papaparse';
import axios from 'axios';

const { instrumentMapping: sampleData, railSectionList, calResultList } = data;
const currentDate = dayjs();
const dateFormat = "DD/MM/YYYY";

const NewCalibrationForm = () => {
  const location = useLocation();
  const serialNumber = location.state?.serialNumber || null;
  const editMode = location.state?.editMode || false;
  const calibrationData = location.state?.calibrationData || null;
  console.log("SERIAL NUMBER: ", serialNumber)
  console.log("EDIT MODE: ", editMode)
  console.log("CALIBRATION DATA: ", calibrationData)
  const [instrumentCategoryList, setInstrumentCategoryList] = useState([])
  const [instrumentList, setInstrumentList] = useState([]);
  const navigate = useNavigate();
  const [isDisabled, setIsDisabled] = useState(false);
  const [formData, setFormData] = useState({
    instrumentCategory: null, instrument: null, detail: null, railSection: null, serialNumber: null, calibrationDate: currentDate.format(dateFormat), calibrationResult: null, calibrationValidUpto: null, calibrationExpiryNumberOfDays: null
  })

  const calibrationGeneralInfo = useSelector((state) => state.calibrationDuty);
  const { token, userType } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  // Check if user can create new calibrations (only MAIN_ADMIN and LOCAL_ADMIN)
  const canCreateNewCalibration = userType === 'MAIN_ADMIN' || userType === 'LOCAL_ADMIN';

  useEffect(()=>{
    if(sampleData[formData.instrumentCategory]){
        const instrumentList = sampleData[formData.instrumentCategory].map(inst => {
        return {
            key: inst,
            value: inst
        }
        })
        setInstrumentList([...instrumentList])
    }else {
      setInstrumentList([]);
      setFormData(prevData => ({ ...prevData, instrument: null }));
    }
  }, [formData.instrumentCategory, instrumentCategoryList])

  const handleFormSubmit = async () => {
    try {
      await apiCall("POST", "/calibration/saveCalibration", token, {
        ...formData,
        dutyId: calibrationGeneralInfo.dutyId
      });
      message.success("New / Modify Calibration Data saved succesfully.");
      navigate("/sms/calibration/list");
    } catch (error) {}
  }

  const [loading, setLoading] = useState(false)

  const downloadCsvTemplate = () => {
    const csvTemplate = `instrumentCategory,instrument,detail,railSection,serialNumber,calibrationExpiryNumberOfDays,calibrationDate,calibrationResult,calibrationValidUpto
Measuring Instrument,Vernier,BSP1,60E1A1 - Prime,VER001,365,2024-01-15,OK,2025-01-15`;

    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'calibration_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

   const handleUpload = (file) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data || [];
        console.log('Parsed rows:', rows);

        if (rows.length === 0) {
          message.warning('No data found in CSV file');
          setLoading(false);
          return;
        }

        // Choose between single and bulk import based on row count
        let successCount = 0;
        let failureCount = 0;
        const errors = [];

        if (rows.length === 1) {
          // Single row import - use existing single row API
          const row = rows[0];
          const csvData = {
            instrumentCategory: row.instrumentCategory,
            instrument: row.instrument,
            detail: row.detail,
            railSection: row.railSection,
            serialNumber: row.serialNumber,
            calibrationExpiryNumberOfDays: row.calibrationExpiryNumberOfDays ? Number(row.calibrationExpiryNumberOfDays) : null,
            calibrationDate: row.calibrationDate,
            calibrationResult: row.calibrationResult,
            calibrationValidUpto: row.calibrationValidUpto,
            rowNumber: 1
          };

          try {
            const response = await apiCall("POST", '/calibration/importCalibrationFromCsv', token, csvData);
            const importResult = response.data.responseData;

            if (importResult.hasErrors || importResult.failedRows > 0) {
              failureCount++;
              if (importResult.errors && importResult.errors.length > 0) {
                errors.push(`Row 1: ${importResult.errors.join(', ')}`);
              }
            } else {
              successCount++;
            }
          } catch (error) {
            failureCount++;
            console.error('Error importing single row:', error);
            errors.push(`Row 1: ${error.message || 'Import failed'}`);
          }

        } else {
          // Multiple rows - use bulk import API for better performance
          const csvRows = rows.map((row, index) => ({
            instrumentCategory: row.instrumentCategory,
            instrument: row.instrument,
            detail: row.detail,
            railSection: row.railSection,
            serialNumber: row.serialNumber,
            calibrationExpiryNumberOfDays: row.calibrationExpiryNumberOfDays ? Number(row.calibrationExpiryNumberOfDays) : null,
            calibrationDate: row.calibrationDate,
            calibrationResult: row.calibrationResult,
            calibrationValidUpto: row.calibrationValidUpto,
            rowNumber: index + 1
          }));

          const bulkCsvData = {
            csvRows: csvRows
          };

          try {
            const response = await apiCall("POST", '/calibration/importBulkCalibrationFromCsv', token, bulkCsvData);
            const importResult = response.data.responseData;

            successCount = importResult.successfulRows || 0;
            failureCount = importResult.failedRows || 0;

            if (importResult.errors && importResult.errors.length > 0) {
              errors.push(...importResult.errors);
            }

          } catch (error) {
            failureCount = rows.length;
            console.error('Error importing bulk CSV:', error);
            const errorMsg = error.response?.data?.responseStatus?.message || error.message || 'Unknown error';
            errors.push(`Bulk import failed: ${errorMsg}`);
          }
        }

        // Show final results
        if (failureCount > 0) {
          message.warning(`CSV import completed. Success: ${successCount}, Failed: ${failureCount}`);

          // Show first few errors
          errors.slice(0, 5).forEach(error => {
            message.error(error, 5);
          });

          if (errors.length > 5) {
            message.info(`... and ${errors.length - 5} more errors. Check console for details.`);
            console.error('All import errors:', errors);
          }
        } else {
          message.success(`Successfully imported all ${successCount} calibration records!`);
        }

        setLoading(false);
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        message.error('Failed to parse CSV file. Please check the file format.');
        setLoading(false);
      }
    });

    // Prevent default Upload behavior
    return false;
  };

  const populateData = () => {
    const instrumentCategoryList = Object.keys(sampleData).map(inst => {
      return {
        key: inst,
        value: inst
      }
    })
    setInstrumentCategoryList([...instrumentCategoryList])
  }

  useEffect(()=> {
    populateData()
  }, [])

  const populateInfo = useCallback( async(serialNumber = null ) => {
    try {
      const { data } = await apiCall(
        "GET",
        `/calibration/getCalibrationDtls?serialNumber=${ serialNumber ? serialNumber : formData?.serialNumber}`,
        token
      );

      const { responseData } = data;

      if (responseData) {
        setIsDisabled(true);
      } else {
        setIsDisabled(false);
      }

      setFormData({
        instrumentCategory: responseData?.instrumentCategory || null,
        instrument: responseData?.instrument || null,
        detail: responseData?.detail || null,
        serialNumber: responseData?.serialNumber || null,
        railSection: responseData?.railSection || null,
        calibrationDate: responseData?.calibrationDate || null,
        calibrationResult: responseData?.calibrationResult || null,
        calibrationValidUpto: responseData?.calibrationValidUpto || null,
        calibrationExpiryNumberOfDays: responseData?.notificationAfterDays || null
      });
    }catch (error) {}
  }, [token, formData.serialNumber])

  useEffect(()=> {
    if(editMode && calibrationData){
      // Use the passed calibration data directly for edit mode
      setFormData({
        instrumentCategory: calibrationData?.instrumentCategory || null,
        instrument: calibrationData?.instrument || null,
        detail: calibrationData?.detail || null,
        serialNumber: calibrationData?.serialNumber || null,
        railSection: calibrationData?.railSection || null,
        calibrationDate: calibrationData?.calibrationDate || null,
        calibrationResult: calibrationData?.result || null,
        calibrationValidUpto: calibrationData?.calibrationValidUpto || null,
        calibrationExpiryNumberOfDays: calibrationData?.notificationAfterDays || null
      });
    } else if(serialNumber){
      // Fetch data from API for new calibration or when calibrationData is not available
      populateInfo(serialNumber)
    }
  }, [populateInfo, serialNumber, editMode, calibrationData])

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData, form]);

  // Check permissions for new calibration creation
  useEffect(() => {
    if (!editMode && !canCreateNewCalibration) {
      message.error('Access denied. Only Main Admin and Local Admin can create new calibrations.');
      navigate('/sms/calibration/list');
    }
  }, [editMode, canCreateNewCalibration, navigate]);

  return (
    <FormContainer>
      <SubHeader title={editMode ? 'Modify Calibration Detail' : 'New Calibration Detail'} link='/calibration/list' />
      <GeneralInfo data={calibrationGeneralInfo} />

      {editMode && !canCreateNewCalibration && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> You are modifying an existing calibration instrument.
            You can update the calibration details but cannot create new instruments.
          </p>
        </div>
      )}

      {/* CSV Import Section - Only show for non-edit mode and users with permission */}
      {!editMode && canCreateNewCalibration && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-3">Bulk Import from CSV</h3>
          <p className="text-blue-600 text-sm mb-4">
            Import multiple calibration records at once using a CSV file. Download the template to see the required format.
          </p>
          <div className="flex gap-3">
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={downloadCsvTemplate}
            >
              Download CSV Template
            </Button>
            <Upload beforeUpload={handleUpload} showUploadList={false} accept=".csv">
              <Button
                type="primary"
                loading={loading}
                icon={<UploadOutlined />}
              >
                Import from CSV
              </Button>
            </Upload>
          </div>
        </div>
      )}


      <Form initialValues={formData} form={form} layout="vertical" onFinish={handleFormSubmit}>
        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          {/* <FormDropdownItem label='Instrument Category' name="instrumentCategory" formField="instrumentCategory" dropdownArray={instrumentCategoryList} valueField='key' visibleField='value' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled={isDisabled} />
          <FormDropdownItem label ='Instrument' name='instrument' formField="instrument" dropdownArray={instrumentList} valueField='key' visibleField='value' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled={isDisabled} /> */}
          <FormDropdownItem label='Instrument Category' name="instrumentCategory" formField="instrumentCategory" dropdownArray={instrumentCategoryList} valueField='key' visibleField='value' onChange={(fieldName, value) => {
            handleChange(fieldName, value, setFormData);
            setFormData(prevData => ({ ...prevData, instrument: null }));
          }} disabled={isDisabled} />
          <FormDropdownItem label ='Instrument' name='instrument' formField="instrument" dropdownArray={instrumentList} valueField='key' visibleField='value' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled={isDisabled} />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <FormInputItem label='Instrument Detail' name='detail' placeholder='Enter Instrument Detail' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required disabled={isDisabled} />
          {
            (formData?.instrumentCategory === 'Gauge (Working)' || formData?.instrumentCategory === 'Gauge (Master)') && 
            <FormDropdownItem label='Rail Section' name='railSection' formField="railSection" dropdownArray={railSectionList} visibleField='value' valueField='key' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required disabled={isDisabled} />
          }
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>

          <FormSearchItem
            label="Serial Number"
            name="serialNumber"
            onSearch={populateInfo}
            onChange={(fieldName, value) =>
              handleChange(fieldName, value, setFormData)
            }
            required
            rules={[
              { required: true, message: "Serial Number is required" }
            ]}
          />
          {
            (formData?.calibrationResult === 'OK') && 
            <FormInputItem label='Calibration expiry notification no. of days' name='calibrationExpiryNumberOfDays' placeholder='0' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} disabled = {isDisabled} />
          }

          {
            (formData?.calibrationResult === 'Not OK') && 
            <FormInputItem label='Cal Expiry No. of Days' name='calibrationExpiryNumberOfDays' placeholder='0' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}/>
          }
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <CustomDatePicker
            label={<span><span style={{ color: "red" }}>*</span> Calibration Date</span>}
            name="calibrationDate"
            defaultValue={formData?.calibrationDate}
            onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
            required
            rules={[
              { required: true, message: "Calibration Date is required" }
            ]}
          />
          <FormDropdownItem
            label="Calibration Result"
            name="calibrationResult"
            formField="calibrationResult"
            dropdownArray={calResultList}
            valueField="key"
            visibleField="value"
            onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
            required
          />
        </div>

        <div className='grid grid-cols-1'>
          {
            (formData?.calibrationResult === 'OK') && 
            <CustomDatePicker label='Cal. Valid upto Date' name='calibrationValidUpto' defaultValue={formData?.calibrationValidUpto} onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
          } 
        </div>

        <div className='flex justify-center mt-4'>
          <Btn htmlType='submit' disabled={loading}>Save</Btn>
        </div>
      </Form>
    </FormContainer>
  )
}

export default NewCalibrationForm