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

const ViAcptRejReport = () => {
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      filterable: true
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      filterable: true
    },
    {
      title: 'Inspection Workspot',
      dataIndex: 'inspectionWorkspot',
      key: 'inspectionWorkspot',
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
      title: 'Std Offered Length for Inspection',
      dataIndex: 'stdOfferedLengthForInspection',
      key: 'stdOfferedLengthForInspection',
      filterable: true
    },
    {
      title: 'Rails Offered for Inspection',
      dataIndex: 'railsOfferedForInspection',
      key: 'railsOfferedForInspection',
    },
    {
      title: 'Class A (130m)',
      dataIndex: 'classA130m',
      key: 'classA130m',
    },
    {
      title: 'Class A (117m)',
      dataIndex: 'classA117m',
      key: 'classA117m',
    },
    {
      title: 'Class A (104m)',
      dataIndex: 'classA104m',
      key: 'classA104m',
    },
    {
      title: 'Class A (86.67m)',
      dataIndex: 'classA86_67m',
      key: 'classA86_67m',
    },
    {
      title: 'Class A (65m)',
      dataIndex: 'classA65m',
      key: 'classA65m',
    },
    {
      title: 'Class A (52m)',
      dataIndex: 'classA52m',
      key: 'classA52m',
    },
    {
      title: 'Class A (26m)',
      dataIndex: 'classA26m',
      key: 'classA26m',
    },
    {
      title: 'Class A (25m)',
      dataIndex: 'classA25m',
      key: 'classA25m',
    },
    {
      title: 'Class A (24m)',
      dataIndex: 'classA24m',
      key: 'classA24m',
    },
    {
      title: 'Class A (18m)',
      dataIndex: 'classA18m',
      key: 'classA18m',
    },
    {
      title: 'Class A (17m)',
      dataIndex: 'classA17m',
      key: 'classA17m',
    },
    {
      title: 'Class A (16m)',
      dataIndex: 'classA16m',
      key: 'classA16m',
    },
    {
      title: 'Class A (13m)',
      dataIndex: 'classA13m',
      key: 'classA13m',
    },
    {
      title: 'Class A (12m)',
      dataIndex: 'classA12m',
      key: 'classA12m',
    },
    {
      title: 'Class A (11m)',
      dataIndex: 'classA11m',
      key: 'classA11m',
    },
    {
      title: 'Class A (10m)',
      dataIndex: 'classA10m',
      key: 'classA10m',
    },
    {
      title: 'Recycle (Cut Bar)',
      dataIndex: 'recycleCutBar',
      key: 'recycleCutBar',
    },
    {
      title: 'Recycle (Refinish)',
      dataIndex: 'recycleRefinish',
      key: 'recycleRefinish',
    },
    {
      title: 'Rejection (13m)',
      dataIndex: 'rejection13m',
      key: 'rejection13m',
    },
    {
      title: 'Rejection (12m)',
      dataIndex: 'rejection12m',
      key: 'rejection12m',
    },
    {
      title: 'Rejection (11m)',
      dataIndex: 'rejection11m',
      key: 'rejection11m',
    },
    {
      title: 'Rejection (10m)',
      dataIndex: 'rejection10m',
      key: 'rejection10m',
    },
    {
      title: 'Rejection Component Length',
      dataIndex: 'rejectionComponentLength',
      key: 'rejectionComponentLength',
    },
  ];
  

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
        "/vi/getAcptRejReport",
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
      <SubHeader title="Accepted & Rejected Rails Report" link="/record/vi" />

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

export default ViAcptRejReport;
