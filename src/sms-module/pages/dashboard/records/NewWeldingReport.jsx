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

const NewWeldingReport = () => {
  const columns = [
    {
      title: 'Date & Shift',
      dataIndex: 'dateAndShift',
      key: 'dateAndShift',
      render: (_, record) => record.date + " - " + record.shift,
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
      title: 'Panel ID',
      dataIndex: 'panelId',
      key: 'panelId',
    },
    {
      title: 'Joint No',
      dataIndex: 'jointNo',
      key: 'jointNo',
    },
    {
      title: 'Weld Joint Result',
      dataIndex: 'weldJointResult',
      key: 'weldJointResult',
    },
    {
      title: 'Weld Joint Reason (if rejected)',
      dataIndex: 'weldJointReason',
      key: 'weldJointReason',
    },
    {
      title: 'Weld Joint Remark',
      dataIndex: 'weldJointRemark',
      key: 'weldJointRemark',
    },
    {
      title: 'Rail ID 1',
      dataIndex: 'railId1',
      key: 'railId1',
    },
    {
      title: 'Rail ID 2',
      dataIndex: 'railId2',
      key: 'railId2',
    },
    {
      title: 'Panel Length',
      dataIndex: 'panelLength',
      key: 'panelLength',
    },
    {
      title: 'Panel Decision',
      dataIndex: 'panelDecision',
      key: 'panelDecision',
    },
    {
      title: 'Panel Remark',
      dataIndex: 'panelRemark',
      key: 'panelRemark',
    },
    {
      title: 'Welding Rail Length 1',
      dataIndex: 'weldingRailLength1',
      key: 'weldingRailLength1',
    },
    {
      title: 'Welding Rail Length 2',
      dataIndex: 'weldingRailLength2',
      key: 'weldingRailLength2',
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
        "/welding/getNewWeldingReport",
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
      <SubHeader title="New Welding Report" link="/record/welding" />

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

export default NewWeldingReport
