/* eslint-disable */
import React, { useState } from "react";
import TableComponent from "../../../components/DKG_Table";
import SubHeader from "../../../components/DKG_SubHeader";
import { apiCall } from "../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import CustomDatePicker from "../../../components/DKG_CustomDatePicker";
import Btn from "../../../components/DKG_Btn";
import { Button, Form, message } from "antd";
import {
  CloseCircleOutlined,
} from "@ant-design/icons";
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

const SmsRecord = () => {
  const [form] = Form.useForm();

  const columns = [
    {
      title: "Date",
      dataIndex: "dateAndShift", // Use formatted field for Excel export
      key: "date",
      filterable: true, // Enable search
      render: (dateAndShift, record) => {
        // If dateAndShift is available, use it directly (properly formatted from backend)
        if (dateAndShift) {
          // Convert backend format "YYYY-MM-DD SHIFT" to display format "DD/MM/YYYY - Shift SHIFT"
          const parts = dateAndShift.split(' ');
          if (parts.length >= 2) {
            const datePart = parts[0]; // YYYY-MM-DD
            const shiftPart = parts[1]; // A, B, or C

            // Convert YYYY-MM-DD to DD/MM/YYYY
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = datePart.split('-');
              return `${day}/${month}/${year} - Shift ${shiftPart}`;
            }
          }
          // Fallback: return as-is if format is unexpected
          return dateAndShift;
        }

        // Fallback to old logic if dateAndShift is not available
        const date = record.date;
        if (!date) return "N/A";

        try {
          // Handle different date formats
          let dateObj;
          let formattedDate;

          if (typeof date === 'string') {
            // If it's already formatted as YYYY-MM-DD, just reformat it
            if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = date.split('-');
              formattedDate = `${day}/${month}/${year}`;
            } else {
              // Otherwise try to parse as Date
              dateObj = new Date(date);
              if (isNaN(dateObj.getTime())) {
                formattedDate = date.toString();
              } else {
                formattedDate = dateObj.toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
              }
            }
          } else if (date instanceof Date) {
            dateObj = date;
            formattedDate = dateObj.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          } else {
            // If it's a timestamp or other format
            dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
              formattedDate = date.toString();
            } else {
              formattedDate = dateObj.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              });
            }
          }

          // Add shift information to the date
          const shift = record.shift || "N/A";
          return `${formattedDate} - Shift ${shift}`;
        } catch (error) {
          console.error('Date parsing error:', error, 'Original date:', date);
          const shift = record.shift || "N/A";
          return `${date ? date.toString() : "N/A"} - Shift ${shift}`;
        }
      }
    },
    {
      title: "SMS & Caster No",
      dataIndex: "smsNumber",
      key: "smsNumber",
      filterable: true, // Enable filter
      render: (_, record) => {
        const sms = record.smsNumber || "N/A";
        const casters = record.casterNumber || "N/A";
        // Handle multiple caster numbers (already concatenated from backend)
        return `${sms} , ${casters}`;
      }
    },
    // {
    //   title: "Caster Number",
    //   dataIndex: "casterNumber",
    //   key: "casterNumber",
    //   searchable: true, // Enable search
    // },
    {
      title: "Rail Grade",
      dataIndex: "railGrade",
      key: "railGrade",
      filterable: true, // Enable filter
    },
    {
      title: "Heat Casted Count",
      dataIndex: "numberOfHeatsCast",
      key: "numberOfHeatsCast",
    },
    {
      title: "Heat Rejected Count",
      dataIndex: "numberOfHeatsRejected",
      key: "numberOfHeatsRejected",
      render: (count) => count || 0
    },
    {
      title: "Diverted Heat Count",
      dataIndex: "numberOfDivertedHeats",
      key: "numberOfDivertedHeats",
      render: (count) => count || 0
    },
    {
      title: "Rejected Heat Numbers",
      dataIndex: "rejectedHeatNumbers",
      key: "rejectedHeatNumbers",
      render: (heatNumbers) => {
        if (!heatNumbers || heatNumbers.trim() === '') return "N/A";
        // Split by comma and display in a more readable format
        const numbers = heatNumbers.split(',').map(num => num.trim()).filter(num => num);
        return numbers.length > 0 ? numbers.join(', ') : "N/A";
      }
    },
    {
      title: "Weight of Heats Casted",
      dataIndex: "weightOfHeatsCast",
      key: "weightOfHeatsCast",
    },
    {
      title: "Weight of Prime Blooms",
      dataIndex: "weightOfPrimeBlooms",
      key: "weightOfPrimeBlooms",
    },
    {
      title: "Weight of CO Blooms",
      dataIndex: "weightOfCOBlooms",
      key: "weightOfCOBlooms",
    },
    {
      title: "Weight of Accepted Blooms",
      dataIndex: "weightOfAcceptedBlooms",
      key: "weightOfAcceptedBlooms",
    },
    {
      title: "Weight of Rejected Blooms",
      dataIndex: "weightOfRejectedBlooms",
      key: "weightOfRejectedBlooms",
    },
    {
      title: "Reason for rejection",
      dataIndex: "reasonForRejection",
      key: "reasonForRejection",
      render: (reason) => {
        if (!reason || reason.trim() === '') return "N/A";
        // Handle multiple reasons separated by semicolon
        const reasons = reason.split(';').map(r => r.trim()).filter(r => r);
        return reasons.length > 0 ? reasons.join('; ') : "N/A";
      }
    },
  ];

  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
    startShift: null, // Shift for start date
    endShift: null    // Shift for end date
  });

  const [dataSource, setDataSource] = useState([]);
  console.log("Current dataSource for table:", dataSource)

  // Debug: Log sample data structure
  if (dataSource && dataSource.length > 0) {
    console.log("Sample record structure:", dataSource[0]);
    console.log("Available fields:", Object.keys(dataSource[0]));
  }

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if(!filter.startDate || !filter.endDate) {
      message.error("Please enter start date and end date both.")
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

      console.log("Request payload:", requestPayload);

      const { data } = await apiCall(
        "POST",
        "/sms/getSmsSummary",
        token,
        requestPayload
      );

      console.log("SMS Summary API Response:", data);
      console.log("Raw Response Data:", data?.responseData);

      // Backend handles shift-specific filtering when both shifts are provided
      setDataSource(data?.responseData || []);

      if (filter.startShift && filter.endShift) {
        console.log(`Filtered from ${filter.startDate} Shift ${filter.startShift} to ${filter.endDate} Shift ${filter.endShift}`);
      } else {
        console.log("All data without shift filtering");
      }
    } catch (error) {
      console.error("Error fetching SMS Summary:", error);
      message.error("Failed to fetch SMS Summary data");
    }
  };

  const handleChange = (fieldName, value) => {
    setFilter((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="SMS Summary" link="/record/sms" />

      <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form form={form} initialValues={filter} onFinish={populateData} className="grid md:grid-cols-5 grid-cols-2 gap-x-2 items-center p-2 pt-0">
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
              <Button className="flex gap-2 items-center border-darkBlue text-darkBlue justify-center" onClick={() => window.location.reload()}>
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

export default SmsRecord;
