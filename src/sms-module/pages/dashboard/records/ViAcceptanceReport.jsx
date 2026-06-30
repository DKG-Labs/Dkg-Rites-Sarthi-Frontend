/* eslint-disable */
import React, { useState } from "react";
import TableComponent from "../../../components/DKG_Table";
import SubHeader from "../../../components/DKG_SubHeader";
import { apiCall } from "../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import CustomDatePicker from "../../../components/DKG_CustomDatePicker";
import Btn from "../../../components/DKG_Btn";
import QuickAccess from "../../../components/DKG_QuickAccess";
import { Button, Form, message } from "antd";
import {
  CloseCircleOutlined,
} from "@ant-design/icons";

const ViAcceptanceReport = () => {
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Rail ID',
      dataIndex: 'railId',
      key: 'railId',
      filterable: true
    },
    {
      title: 'Heat Number',
      dataIndex: 'heatNumber',
      key: 'heatNumber',
      filterable: true
    },
    {
      title: 'Date & Shift',
      dataIndex: 'dateShift',
      key: 'dateShift',
      filterable: true
    },
    {
      title: 'Rail Grade',
      dataIndex: 'railGrade',
      key: 'railGrade',
      filterable: true
    },
    {
      title: 'Rail Section',
      dataIndex: 'railSection',
      key: 'railSection',
      filterable: true
    },
    {
      title: 'Inspection Workspot',
      dataIndex: 'inspectionWorkspot',
      key: 'inspectionWorkspot',
      filterable: true
    },
    {
      title: 'Standard Offered Length',
      dataIndex: 'standardOfferedLength',
      key: 'standardOfferedLength',
      filterable: true
    },
    {
      title: 'Actual Offered Length',
      dataIndex: 'actualOfferedLength',
      key: 'actualOfferedLength',
    },
    {
      title: 'Acceptance in Class A',
      dataIndex: 'acceptanceInClassA',
      key: 'acceptanceInClassA',
    },
    {
      title: 'Acceptance in Class A+0.1',
      dataIndex: 'acceptanceInClassAPlus01',
      key: 'acceptanceInClassAPlus01',
    },
    {
      title: 'Acceptance in Class B',
      dataIndex: 'acceptanceInClassB',
      key: 'acceptanceInClassB',
    },
    {
      title: 'Accepted IDs',
      dataIndex: 'acceptedIds',
      key: 'acceptedIds',
    },
    {
      title: 'Rejected Length',
      dataIndex: 'rejectedLength',
      key: 'rejectedLength',
    },
    {
      title: 'Reason for Defect',
      dataIndex: 'reasonForDefect',
      key: 'reasonForDefect',
    },
  ];
  
// 
  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const [dataSource, setDataSource] = useState([]);

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if(!filter.startDate || !filter.endDate) {
      message.error("Please enter start date and end date both.")
      return;
    }
    try {
      const { data } = await apiCall(
        "POST",
        "/vi/getAcptDataReport",
        token,
        filter
      );
      setDataSource(data?.responseData);
    } catch (error) {}
  };

  const handleChange = (fieldName, value) => {
    setFilter((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="VI Acceptance Report" link="/record/vi" />

      <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form form={form} initialValues={filter} onFinish={populateData} className="grid md:grid-cols-4 grid-cols-2 gap-x-2 items-center p-2 pt-0">
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
              Search
              {" "}
            </Btn>
            <Button className="flex gap-2 items-center border-darkBlue text-darkBlue" onClick={() => window.location.reload()}>
              <span>
                <CloseCircleOutlined />
              </span>
              <span>Reset</span>
            </Button>
          </Form>
        </div>

        <TableComponent dataSource={dataSource} columns={columns} />
      </div>
    </div>
  );
};

export default ViAcceptanceReport;
