/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import FormContainer from "../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/calibration/calibration.json";
import FormBody from "../../../../../components/DKG_FormBody";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
import { Divider, Table, Form, message, Button } from "antd";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from "react-router-dom";
import IconBtn from "../../../../../components/DKG_IconBtn";
import {
  CloseCircleOutlined,
  FilterFilled,
  PlusOutlined,
} from "@ant-design/icons";
import { apiCall, handleChange } from "../../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import { DeleteOutlined } from "@ant-design/icons";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import { filter } from "lodash";

const {
  instrumentMapping: sampleData,
  calibrationGeneralInfo,
  railSectionList,
  detailList,
  serialNumberList,
  calResultList,
} = data;

const BulkCalibrationForm = () => {
  const [instrumentCategoryList, setInstrumentCategoryList] = useState([]);
  const [instrumentList, setInstrumentList] = useState([]);

  const [clbList, setClbLst] = useState([]);
  const [filteredClbList, setFilteredClbList] = useState([]);

  console.log("FULTR: ", filteredClbList)

  const navigate = useNavigate();
  const [info, setInfo] = useState([
    {
      key: "1",
      serialNumber: "",
    },
  ]);

  const [formData, setFormData] = useState({
    detail: null,
    serialNumberList: [],
    calibrationResult: null,
    calibrationValidUpto: null,
    calibrationExpiryNumberOfDays: null,
  });

  const [filters, setFilters] = useState({
    instrumentCategory: null,
    instrument: null,
    railSection: null,
  });

  const populateData = useCallback(() => {
    const instrumentCategoryList = Object.keys(sampleData).map((inst) => {
      return {
        key: inst,
        value: inst,
      };
    });
    setInstrumentCategoryList([...instrumentCategoryList]);
  }, []);

  useEffect(() => {
    populateData();
  }, [populateData]);

  const calibrationGeneralInfo = useSelector((state) => state.calibrationDuty);
  const { token } = useSelector((state) => state.auth);

  const [form] = Form.useForm();

  useEffect(() => {
    if (sampleData[filters.instrumentCategory]) {
      const instrumentList = sampleData[filters.instrumentCategory].map(
        (inst) => {
          return {
            key: inst,
            value: inst,
          };
        }
      );
      setInstrumentList([...instrumentList]);
    }
  }, [filters.instrumentCategory, instrumentCategoryList]);

  const handleAddRow = () => {
    const newRow = {
      key: `${info.length + 1}`,
      serialNumber: "",
    };
    setInfo([...info, newRow]);
  };

  const handleSelectChange = (serialNumber) => {
    setFormData((prev) => {
      const updatedSerialNumberList = [...prev.serialNumberList, serialNumber];
      return {
        ...prev,
        serialNumberList: updatedSerialNumberList,
      };
    });

    const updatedFiltertedClbList = filteredClbList.filter(item => item.serialNumber !== serialNumber);
    setFilteredClbList(updatedFiltertedClbList);
  };

  const bulkColumns = [
    {
      title: "S.No.",
      dataIndex: "key",
      key: "key",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      render: (text, record) => (
        <FormDropdownItem
          name="serialNumber"
          formField="serialNumber"
          placeholder="Select serial number"
          dropdownArray={filteredClbList}
          visibleField="serialNumber"
          valueField="serialNumber"
          onChange={(_, value) => handleSelectChange(value)}
          required
        />
      ),
    },
  ];

  const handleClick = async () => {
    try {
      await apiCall("POST", "/calibration/saveBulkCalibration", token, {
        ...formData,
        dutyId: calibrationGeneralInfo.dutyId,
      });
      message.success("Bulk Calibration Data saved succesfully.");
      navigate("/sms/calibration/list");
    } catch (error) {}
  };

  const getClbDtls = async () => {
    try {
      const { data } = await apiCall(
        "GET",
        "/calibration/getAllLatestCalibrations",
        token
      );

      const { responseData } = data;
      setClbLst(responseData || []);
      setFilteredClbList(responseData || []);
    } catch (error) {}
  };

  const handleFinish = () => {
    let updatedClbList = [];

    if (filters.instrumentCategory) {
      updatedClbList = clbList.filter(
        (record) => record.instrumentCategory === filters.instrumentCategory
      );
    }

    if (filters.instrument) {
      updatedClbList = updatedClbList.filter(
        (record) => record.instrument === filters.instrument
      );
    }

    
    if (filters.railSection) {
      updatedClbList = updatedClbList.filter(
        (record) => record.railSection === filters.railSection
      );
    }
  
    setFilteredClbList(updatedClbList);
  };

  useEffect(() => {
    getClbDtls();
  }, []);

  return (
    <FormContainer>
      <SubHeader title="Bulk Re-Calibration List" link="/calibration/list" />
      <GeneralInfo data={calibrationGeneralInfo} />

      <Form
        initialValues={filters}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <FormDropdownItem
            label="Instrument Category"
            name="instrumentCategory"
            formField="instrumentCategory"
            dropdownArray={instrumentCategoryList}
            valueField="key"
            visibleField="value"
            onChange={(fieldName, value) =>
              handleChange(fieldName, value, setFilters)
            }
            className="w-full"
          />
          <FormDropdownItem
            label="Instrument"
            name="instrument"
            formField="instrument"
            dropdownArray={instrumentList}
            valueField="key"
            visibleField="value"
            onChange={(fieldName, value) =>
              handleChange(fieldName, value, setFilters)
            }
            className="w-full"
          />
          {(filters?.instrumentCategory === "Gauge (Working)" ||
            filters?.instrumentCategory === "Gauge (Master)") && (
            <>
              <FormDropdownItem
                label="Rail Section"
                name="railSection"
                formField="railSection"
                dropdownArray={railSectionList}
                visibleField="value"
                valueField="key"
                onChange={(fieldName, value) =>
                  handleChange(fieldName, value, setFilters)
                }
                className="w-full"
              />
              <div></div>
            </>
          )}

          <Btn htmlType="submit" text="Search" className="w-full" />
          <Button
            className="flex gap-2 items-center border-darkBlue text-darkBlue"
            onClick={() => window.location.reload()}
          >
            <span>
              <CloseCircleOutlined />
            </span>
            <span>Reset</span>
          </Button>
        </div>
      </Form>

      <Divider className="mt-0 mb-2" />

      {filters?.instrumentCategory != null || filters?.instrument != null}

      <Table
        columns={bulkColumns}
        dataSource={info}
        bordered
        pagination={false}
      />
      <div className="flex justify-center mt-4">
        <IconBtn
          icon={PlusOutlined}
          text="Add Row / Instrument"
          className="-mt-4 w-fit"
          onClick={handleAddRow}
        />
      </div>

      <Form layout="vertical">
        <div className="grid grid-cols-1 gap-2">
          <FormInputItem
            name="detail"
            label="Detail"
            onChange={(name, value) => handleChange(name, value, setFormData)}
          />
          <FormDropdownItem
            label="Cal. Result"
            name="calibrationResult"
            formField="calibrationResult"
            dropdownArray={calResultList}
            valueField="key"
            visibleField="value"
            onChange={(fieldName, value) =>
              handleChange(fieldName, value, setFormData)
            }
            required
          />
          {formData?.calibrationResult === "OK" && (
            <>
                <FormInputItem
                  name="calibrationExpiryNumberOfDays"
                  label="Clb expired after no. of days"
                  placeholder="0"
                  onChange={(name, value) =>
                    handleChange(name, value, setFormData)
                  }
                  // disabled
                />
              <CustomDatePicker
                label="Cal. Valid upto Date"
                name="calibrationValidUpto"
                defaultValue={formData?.calibrationValidUpto}
                onChange={(fieldName, value) =>
                  handleChange(fieldName, value, setFormData)
                }
                required
              />

            </>
          )}
          {/* {
            (formData?.calibrationResult === 'OK') && 
            <CustomDatePicker label='Cal. Valid upto Date' name='calibrationValidUpto' defaultValue={formData?.calibrationValidUpto} onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
          } */}
          {/* {
            (formData?.calibrationResult === 'OK') && 
            <FormInputItem label='Cal Expiry No. of Days' name='calibrationExpiryNumberOfDays' placeholder='0' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
          }

          {
            (formData?.calibrationResult === 'Not OK') && 
            <FormInputItem label='Cal Expiry No. of Days' name='calibrationExpiryNumberOfDays' placeholder='0' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}/>
          } */}
        </div>
      </Form>

      <div className="flex justify-center">
        <Btn onClick={handleClick}>Save</Btn>
      </div>
    </FormContainer>
  );
};

export default BulkCalibrationForm;
