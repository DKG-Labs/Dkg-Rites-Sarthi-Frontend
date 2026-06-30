/* eslint-disable */
import React, { useState } from "react";
import TableComponent from "../../components/DKG_Table";
import SubHeader from "../../components/DKG_SubHeader";
import { apiCall } from "../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import CustomDatePicker from "../../components/DKG_CustomDatePicker";
import Btn from "../../components/DKG_Btn";
import QuickAccess from "../../components/DKG_QuickAccess";
import { Button, Form, message } from "antd";
import {
  CloseCircleOutlined,
} from "@ant-design/icons";

const BspTensileRecord = () => {
  const [form] = Form.useForm();
  const { token } = useSelector((state) => state.auth);
  const [dataSource, setDataSource] = useState([]);
  const [filter, setFilter] = useState({
    startDate: "",
    endDate: "",
  });

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Test Name",
      dataIndex: "testName",
      key: "testName",
      filterable: true,
    },
    {
      title: "Heat No",
      dataIndex: "heatNo",
      key: "heatNo",
      filterable: true,
    },
    {
      title: "Lot No",
      dataIndex: "lotNo",
      key: "lotNo",
      filterable: true,
    },
    {
      title: "Sample No",
      dataIndex: "sampleNo",
      key: "sampleNo",
      filterable: true,
    },
    {
      title: "Strand No",
      dataIndex: "strandNo",
      key: "strandNo",
    },
    {
      title: "Test",
      dataIndex: "test",
      key: "test",
    },
    {
      title: "YS (MPa)",
      dataIndex: "ys",
      key: "ys",
    },
    {
      title: "UTS (MPa)",
      dataIndex: "uts",
      key: "uts",
    },
    {
      title: "Elongation (%)",
      dataIndex: "elongation",
      key: "elongation",
    },
    {
      title: "Hardness (BHN)",
      dataIndex: "hardness",
      key: "hardness",
    },
    {
      title: "Rail Grade",
      dataIndex: "railGrade",
      key: "railGrade",
      filterable: true,
    },
    {
      title: "Mill",
      dataIndex: "mill",
      key: "mill",
      filterable: true,
    },
    {
      title: "Heat Status",
      dataIndex: "heatStatus",
      key: "heatStatus",
      filterable: true,
    },
    {
      title: "Test Date",
      dataIndex: "sampleTestDtm",
      key: "sampleTestDtm",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
    },
  ];

  const populateData = async () => {
    try {
      let url = `/bsp/tensile/data?page=0&size=1000`;
      
      if (filter.startDate && filter.endDate) {
        url += `&startDate=${filter.startDate}&endDate=${filter.endDate}`;
      }

      const response = await apiCall("GET", url, token);
      const data = response.data;

      console.log("Tensile API Response:", data);
      console.log("Raw Response Data:", data?.responseData);

      setDataSource(data?.responseData?.content || []);

      if (filter.startDate && filter.endDate) {
        console.log(`Filtered from ${filter.startDate} to ${filter.endDate}`);
      } else {
        console.log("All Tensile data without date filtering");
      }
    } catch (error) {
      console.error("Error fetching Tensile data:", error);
      message.error("Failed to fetch Tensile data");
    }
  };

  const handleChange = (fieldName, value) => {
    setFilter((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="Tensile Test Records" link="/bsp/data" />

      <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form form={form} initialValues={filter} onFinish={populateData} className="grid md:grid-cols-3 grid-cols-2 gap-x-2 items-center p-2 pt-0">
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

export default BspTensileRecord;
