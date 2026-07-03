/* eslint-disable */
import { Button, Form, message } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { apiCall } from "../../../utils/CommonFunctions";
import TableComponent from "../../../components/DKG_Table";
import { CloseCircleOutlined } from "@ant-design/icons";
import CustomDatePicker from "../../../components/DKG_CustomDatePicker";
import Btn from "../../../components/DKG_Btn";
import SubHeader from "../../../components/DKG_SubHeader";
import FormDropdownItem from "../../../components/DKG_FormDropdownItem";
import QuickAccess from "../../../components/DKG_QuickAccess";

const shiftList = [
    {
      "key": "A",
      "value": "A"
    },
    {
      "key": "B",
      "value": "B"
    },
    {
      "key": "C",
      "value": "C"
    }
  ]

const SmsHeatReport = () => {
  const [form] = Form.useForm();
  const columns = [
    // Filterable Columns
    { title: "Heat No", dataIndex: "heatNo", key: "heatNo", filterable: true },
    {
      title: "SMS & Caster No",
      dataIndex: "smsNumber",
      key: "smsNumber",
      filterable: true, // Enable filter
      render: (_, record) => record.smsNumber + " , " + record.casterNumber
    },
    {
      title: "Rail Grade",
      dataIndex: "railGrade",
      key: "railGrade",
      filterable: true,
    },
    {
      title: "Date & Shift of Casting",
      dataIndex: "dateAndShiftOfCasting",
      key: "dateAndShiftOfCasting",
      filterable: true,
    },
    {
      title: "Probe Make Name",
      dataIndex: "probeMakeName",
      key: "probeMakeName",
      filterable: true,
    },
    {
      title: "Make of Casting Powder",
      dataIndex: "makeOfCastingPowder",
      key: "makeOfCastingPowder",
      filterable: true,
    },

    // Boolean Filterable Columns
    {
      title: "Hydris Measured (80-100m)",
      dataIndex: "isHydrisMeasuredBw80To100mOfCasting",
      key: "isHydrisMeasuredBw80To100mOfCasting",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "Probe Dipped (Below 300mm)",
      dataIndex: "isProbeDippedBelow300mmFromSlagMetalInterface",
      key: "isProbeDippedBelow300mmFromSlagMetalInterface",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "EMS Functioning",
      dataIndex: "isEmsFunctioning",
      key: "isEmsFunctioning",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "Slag Detector Functioning",
      dataIndex: "isSlagDetectorFunctioning",
      key: "isSlagDetectorFunctioning",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },

    {
      title: "AMLC Functioning",
      dataIndex: "isAmlcFunctioning",
      key: "isAmlcFunctioning",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "Hydrogen Measurement Automatic",
      dataIndex: "isHydrogenMeasurementAutomatic",
      key: "isHydrogenMeasurementAutomatic",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "Ladle to Tundish Used",
      dataIndex: "isLadleToTundishUsed",
      key: "isLadleToTundishUsed",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },
    {
      title: "Tundish to Mould Used",
      dataIndex: "isTundishToMouldUsed",
      key: "isTundishToMouldUsed",
      filterable: true,
      render: (value) => value ? "Yes" : "No"
    },

    // Non-Filterable Columns
    { title: "Sequence No", dataIndex: "sequenceNo", key: "sequenceNo" },
    {
      title: "Turn Down Temp (°C)",
      dataIndex: "turnDownTemp",
      key: "turnDownTemp",
    },
    {
      title: "Degassing Vacuum",
      dataIndex: "degassingVacuum",
      key: "degassingVacuum",
    },
    {
      title: "Degassing Duration (min)",
      dataIndex: "degassingDuration",
      key: "degassingDuration",
    },
    {
      title: "Casting Temp (°C)",
      dataIndex: "castingTemp",
      key: "castingTemp",
    },
    { title: "Hydrogen", dataIndex: "hydrogen", key: "hydrogen" },
    { title: "Nitrogen", dataIndex: "nitrogen", key: "nitrogen" },
    { title: "Oxygen", dataIndex: "oxygen", key: "oxygen" },
    // { title: 'Chemical', dataIndex: 'chemical', key: 'chemical' },
    {
      title: "No. of Prime Blooms",
      dataIndex: "noOfPrimeBlooms",
      key: "noOfPrimeBlooms",
    },
    {
      title: "No. of Co Blooms",
      dataIndex: "noOfCoBlooms",
      key: "noOfCoBlooms",
    },
    {
      title: "No. of Rejected Blooms",
      dataIndex: "noOfRejectedBlooms",
      key: "noOfRejectedBlooms",
    },
    { title: "Total Cast Wt", dataIndex: "totalCastWt", key: "totalCastWt" },
    { title: "Heat Remark", dataIndex: "heatRemark", key: "heatRemark", render: (rem) => rem || "---" },
    {
      title: "Reason for Rejection",
      dataIndex: "reasonForRejection",
      key: "reasonForRejection",

      render: (_, record) => record.hydrogen > 1.6 ? "Rejected for Hydrogen" : (record.oxygen > 20 ? "Rejected for Oxygen" : (record.nitrogen > 0.009 ? "Rejected for Nitrogen" : "N/A"))
    },
  ];



  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
    startShift: null, // Shift for start date
    endShift: null    // Shift for end date
  });

  const [dataSource, setDataSource] = useState([]);

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if (!filter.startDate || !filter.endDate) {
      message.error("Please enter start date and end date both.");
      return;
    }

    // Validate shift-specific date range inputs
    if ((filter.startShift && !filter.endShift) || (!filter.startShift && filter.endShift)) {
      message.error("Please provide both start shift and end shift for shift-specific date range filtering.");
      return;
    }

    try {
      // Prepare request payload
      const requestPayload = {
        startDate: filter.startDate,
        endDate: filter.endDate,
        startShift: filter.startShift, // Shift-specific filtering
        endShift: filter.endShift      // Shift-specific filtering
      };

      console.log("Heat Report Request payload:", requestPayload);

      const { data } = await apiCall(
        "POST",
        "/sms/getHeatSummary",
        token,
        requestPayload
      );

      // Backend handles shift-specific filtering when both shifts are provided
      setDataSource(data?.responseData || []);

      if (filter.startShift && filter.endShift) {
        console.log(`Filtered from ${filter.startDate} Shift ${filter.startShift} to ${filter.endDate} Shift ${filter.endShift}`);
      } else {
        console.log("All data without shift filtering");
      }
    } catch (error) {
      console.error("Error fetching Heat Summary:", error);
      message.error("Failed to fetch Heat Summary data");
    }
  };

  const handleChange = (fieldName, value) => {
    setFilter((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="SMS Heat Summary" link="/record/sms" />

      <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form
            form={form}
            initialValues={filter}
            onFinish={populateData}
            className="grid md:grid-cols-5 grid-cols-2 gap-x-2 items-center p-2 pt-0"
          >
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">From Date</label>
              <CustomDatePicker
                className="no-border"
                defaultValue={filter.startDate}
                placeholder="From date"
                name="startDate"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">From Shift</label>
              <FormDropdownItem
                placeholder="Start Shift"
                dropdownArray={shiftList}
                formField="startShift"
                name="startShift"
                onChange={handleChange}
                valueField="key"
                visibleField="value"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">To Date</label>
              <CustomDatePicker
                className="no-border"
                defaultValue={filter.endDate}
                placeholder="To date"
                name="endDate"
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">To Shift</label>
              <FormDropdownItem
                placeholder="End Shift"
                dropdownArray={shiftList}
                formField="endShift"
                name="endShift"
                onChange={handleChange}
                valueField="key"
                visibleField="value"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Btn htmlType="submit" className="w-full">
                Search
              </Btn>
              <Button
                className="flex gap-2 items-center border-darkBlue text-darkBlue justify-center"
                onClick={() => window.location.reload()}
              >
                <CloseCircleOutlined />
                <span>Reset</span>
              </Button>
            </div>
          </Form>
        </div>

        <TableComponent dataSource={dataSource} columns={columns} />
      </div>
    </div>
  );
};

export default SmsHeatReport;
