/* eslint-disable */
import React, { useState } from 'react'
import Btn from '../../../components/DKG_Btn'
import { Button, Form, message } from 'antd'
import TableComponent from '../../../components/DKG_Table'
import { apiCall } from '../../../utils/CommonFunctions'
import { useSelector } from 'react-redux'
import {
  CloseCircleOutlined,
} from "@ant-design/icons";
import SubHeader from '../../../components/DKG_SubHeader'
import CustomDatePicker from '../../../components/DKG_CustomDatePicker'
import QuickAccess from '../../../components/DKG_QuickAccess'

const WeldingSummaryReport = () => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      filterable: true
    },
    {
      title: 'Rail Section',
      dataIndex: 'railSection',
      key: 'railSection',
      filterable: true
    },
    {
      title: 'Rail Grade',
      dataIndex: 'railGrade',
      key: 'railGrade',
      filterable: true
    },
    {
      title: 'Inspection Workspot',
      dataIndex: 'inspectionWorkspot',
      key: 'inspectionWorkspot',
    },
    {
      title: 'Welding Machine Number',
      dataIndex: 'weldingMachineNumber',
      key: 'weldingMachineNumber',
    },
    {
      title: 'No. of Joints Offered for Inspection',
      dataIndex: 'numberOfJointsOfferedForInspection',
      key: 'numberOfJointsOfferedForInspection',
    },
    {
      title: 'No. of Panels Offered for Inspection',
      dataIndex: 'numberOfPanelsOfferedForInspection',
      key: 'numberOfPanelsOfferedForInspection',
    },
    {
      title: 'Dimensional Check (Accepted)',
      dataIndex: 'dimensionalCheckAccepted',
      key: 'dimensionalCheckAccepted',
    },
    {
      title: 'Dimensional Check (Rejected)',
      dataIndex: 'dimensionalCheckRejected',
      key: 'dimensionalCheckRejected',
    },
    {
      title: 'UT Check (Accepted)',
      dataIndex: 'utCheckAccepted',
      key: 'utCheckAccepted',
    },
    {
      title: 'UT Check (Rejected)',
      dataIndex: 'utCheckRejected',
      key: 'utCheckRejected',
    },
    {
      title: 'No. of Joints Accepted',
      dataIndex: 'numberOfJointsAccepted',
      key: 'numberOfJointsAccepted',
    },
    {
      title: 'No. of Joints Rejected',
      dataIndex: 'numberOfJointsRejected',
      key: 'numberOfJointsRejected',
    },
    {
      title: 'No. of Panels Accepted',
      dataIndex: 'numberOfPanelsAccepted',
      key: 'numberOfPanelsAccepted',
    },
    {
      title: 'No. of Panels Rejected',
      dataIndex: 'numberOfPanelsRejected',
      key: 'numberOfPanelsRejected',
    },
    {
      title: 'Rail Length',
      dataIndex: 'railLength',
      key: 'railLength',
    },
  ];


  const [form] = Form.useForm();

  const [filter, setFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const [dataSource, setDataSource] = useState([]);
  console.log(dataSource)

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if(!filter.startDate || !filter.endDate) {
      message.error("Please enter start date and end date both.")
      return;
    }
    try {
      const { data } = await apiCall(
        "POST",
        "/welding/getWeldingSummaryReport",
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
      <SubHeader title="Welding Summary" link="/record/welding" />

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
  )
}

export default WeldingSummaryReport
