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

const WeldingTestSampleReport = () => {
  const columns = [
    {
      title: 'Mill',
      dataIndex: 'mill',
      key: 'mill',
    },
    {
      title: 'Rail Section',
      dataIndex: 'railSection',
      key: 'railSection',
    },
    {
      title: 'Rail Grade',
      dataIndex: 'railGrade',
      key: 'railGrade',
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
      title: 'TLT Joint No',
      dataIndex: 'tltJointNo',
      key: 'tltJointNo',
    },
    {
      title: 'TLT Marking Date & Shift',
      dataIndex: 'tltMarkingDateShift',
      key: 'tltMarkingDateShift',
    },
    {
      title: 'TLT Testing Status',
      dataIndex: 'tltTestingStatus',
      key: 'tltTestingStatus',
    },
    {
      title: 'TLT Load / Deflection',
      dataIndex: 'tltLoadDeflection',
      key: 'tltLoadDeflection',
    },
    {
      title: 'TLT Remark',
      dataIndex: 'tltRemark',
      key: 'tltRemark',
    },
    {
      title: 'Hardness Joint No',
      dataIndex: 'hardnessJointNo',
      key: 'hardnessJointNo',
    },
    {
      title: 'Hardness Marking Date',
      dataIndex: 'hardnessMarkingDate',
      key: 'hardnessMarkingDate',
    },
    {
      title: 'Hardness Testing Status',
      dataIndex: 'hardnessTestingStatus',
      key: 'hardnessTestingStatus',
    },
    {
      title: 'Hardness Deviation',
      dataIndex: 'hardnessDeviation',
      key: 'hardnessDeviation',
    },
    {
      title: 'Hardness Remark',
      dataIndex: 'hardnessRemark',
      key: 'hardnessRemark',
    },
    {
      title: 'Macro/Micro Joint No',
      dataIndex: 'macroMicroJointNo',
      key: 'macroMicroJointNo',
    },
    {
      title: 'Macro/Micro Marking Date',
      dataIndex: 'macroMicroMarkingDate',
      key: 'macroMicroMarkingDate',
    },
    {
      title: 'Macro/Micro Testing Status',
      dataIndex: 'macroMicroTestingStatus',
      key: 'macroMicroTestingStatus',
    },
    {
      title: 'Macro/Micro HAZ Full Rail Foot',
      dataIndex: 'macroMicroHazFullRailFoot',
      key: 'macroMicroHazFullRailFoot',
    },
    {
      title: 'Macro/Micro HAZ One Side Foot',
      dataIndex: 'macroMicroHazOneSideFoot',
      key: 'macroMicroHazOneSideFoot',
    },
    {
      title: 'Macro/Micro Remark',
      dataIndex: 'macroMicroRemark',
      key: 'macroMicroRemark',
    },
    {
      title: 'Rail Length 1',
      dataIndex: 'railLength1',
      key: 'railLength1',
    },
    {
      title: 'Rail Length 2',
      dataIndex: 'railLength2',
      key: 'railLength2',
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
        "/welding/getTestSampleReport",
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
      <SubHeader title="Welding Test Sample Report" link="/record/welding" />

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

export default WeldingTestSampleReport
