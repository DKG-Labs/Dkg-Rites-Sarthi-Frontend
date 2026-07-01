/* eslint-disable */
import { Button, Form, message } from "antd";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { apiCall } from "../../../utils/CommonFunctions";
import SubHeader from "../../../components/DKG_SubHeader";
import { CloseCircleOutlined } from "@ant-design/icons";
import CustomDatePicker from "../../../components/DKG_CustomDatePicker";
import Btn from "../../../components/DKG_Btn";
import TableComponent from "../../../components/DKG_Table";

const NdtReport = () => {
    const [form] = Form.useForm();
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      filterable: true
    },
    {
      title: "NDT",
      dataIndex: "ndt",
      key: "ndt",
      filterable: true
    },
    {
      title: "Rail Grade",
      dataIndex: "railGrade",
      key: "railGrade",
      filterable: true
    },
    {
      title: "Rail Section",
      dataIndex: "railSection",
      key: "railSection",
      filterable: true
    },
    {
      title: "Total Rails Inspected",
      dataIndex: "totalRailsInspected",
      key: "totalRailsInspected",
    },
    {
      title: "Total UT Marked Rails",
      dataIndex: "totalUtMarkedRails",
      key: "totalUtMarkedRails",
    },
    {
      title: "Total UT Suspected Rails",
      dataIndex: "totalUtSuspectedRails",
      key: "totalUtSuspectedRails",
    },
    {
      title: "Total Recycled Rails",
      dataIndex: "totalRecycledRails",
      key: "totalRecycledRails",
    },
    {
      title: "Total UT Rejected Rails",
      dataIndex: "totalUtRejectedRails",
      key: "totalUtRejectedRails",
    },
    {
      title: "ECT Suspected Rails",
      dataIndex: "ectSuspectedRails",
      key: "ectSuspectedRails",
    },
    {
      title: "Body Straightness Result A",
      dataIndex: "bodyStraightnessResultA",
      key: "bodyStraightnessResultA",
    },
    {
      title: "Body Straightness Result A1",
      dataIndex: "bodyStraightnessResultA1",
      key: "bodyStraightnessResultA1",
    },
    {
      title: "Body Straightness Result Marked",
      dataIndex: "bodyStraightnessResultMarked",
      key: "bodyStraightnessResultMarked",
    },
    {
      title: "Total Profile Marked",
      dataIndex: "totalProfileMarked",
      key: "totalProfileMarked",
    },
    {
      title: "Rail Length",
      dataIndex: "railLength",
      key: "railLength",
    },
  ];

  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const [dataSource, setDataSource] = useState([]);

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if (!filter.startDate || !filter.endDate) {
      message.error("Please enter start date and end date both.");
      return;
    }
    try {
      const { data } = await apiCall(
        "POST",
        "/ndt/getReport",
        token,
        filter
      );
      setDataSource(data?.responseData);
    } catch (error) {}
  };

  const handleChange = (fieldName, value) => {
    setFilter((prev) => ({ ...prev, [fieldName]: value }));
  };


  return <div className="container">
    <SubHeader title="NDT" link="/" />

    <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form
            form={form}
            initialValues={filter}
            onFinish={populateData}
            className="grid md:grid-cols-4 grid-cols-2 gap-x-2 items-center p-2 pt-0"
          >
            <CustomDatePicker
              className="no-border"
              defaultValue={filter.startDate}
              placeholder="From date"
              name="startDate"
              onChange={handleChange}
              required
            />
            <CustomDatePicker
              className="no-border"
              defaultValue={filter.endDate}
              placeholder="To date"
              name="endDate"
              onChange={handleChange}
              required
            />
            <Btn htmlType="submit" className="w-full">
              {" "}
              Search{" "}
            </Btn>
            <Button
              className="flex gap-2 items-center border-darkBlue text-darkBlue"
              onClick={() => window.location.reload()}
            >
              <span>
                <CloseCircleOutlined />
              </span>
              <span>Reset</span>
            </Button>
          </Form>
        </div>

        <TableComponent dataSource={dataSource} columns={columns} />
      </div>
  </div>;
};

export default NdtReport;
