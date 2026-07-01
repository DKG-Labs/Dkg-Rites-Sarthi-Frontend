/* eslint-disable */
import React, { useState } from "react";
import TableComponent from "../../../components/DKG_Table";
import SubHeader from "../../../components/DKG_SubHeader";
import { apiCall } from "../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import Btn from "../../../components/DKG_Btn";
import QuickAccess from "../../../components/DKG_QuickAccess";
import { Button, Form, message } from "antd";
import {
  CloseCircleOutlined,
} from "@ant-design/icons";

import { DatePicker } from "antd";
import dayjs from "dayjs";

const { MonthPicker } = DatePicker;


const QctRecord1 = () => {
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Mill',
      dataIndex: 'mill',
      key: 'mill',
    },
    {
      title: 'Rail Grade',
      dataIndex: 'railGrade',
      key: 'railGrade',
    },
    {
      title: 'Rail Section',
      dataIndex: 'railSection',
      key: 'railSection',
    },
    {
      title: 'Heat No',
      dataIndex: 'heatNo',
      key: 'heatNo',
    },
    {
      title: 'Strand No',
      dataIndex: 'strandNo',
      key: 'strandNo',
    },
    {
      title: 'Sample ID',
      dataIndex: 'sampleId',
      key: 'sampleId',
    },
    {
      title: 'Fatigue Info',
      dataIndex: 'fatigueInfo',
      key: 'fatigueInfo',
    },
    {
      title: 'Residual Info',
      dataIndex: 'residualInfo',
      key: 'residualInfo',
    },
    {
      title: 'FCGR Info',
      dataIndex: 'fcgrInfo',
      key: 'fcgrInfo',
    },
    {
      title: 'Fracture Toughness Info',
      dataIndex: 'fractureToughnessInfo',
      key: 'fractureToughnessInfo',
    },
    {
      title: 'Centerline Info',
      dataIndex: 'centerlineInfo',
      key: 'centerlineInfo',
    },
  ];
  
  
// 
  const [filter, setFilter] = useState({
    date: null,
    // endDate: null,
  });

  const [dataSource, setDataSource] = useState([]);

  const { token } = useSelector((state) => state.auth);

  const populateData = async () => {
    if(!filter.startDate) {
      message.error("Please enter date.")
      return;
    }
    try {
      const { data } = await apiCall(
        "POST",
        "/qct/getQctRecord",
        token,
        filter
      );
      setDataSource(data?.responseData);
    } catch (error) {}
  };

  const handleChange = (fieldName, date) => {

    if (date) {
        const storedFormat = date.format("DD/MM/YYYY"); // Store as dd/mm/yyyy
        setFilter({startDate: storedFormat});
      } else {
        setFilter({startDate: ""});
      }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="QCT Record" link="/record/qct" />

      <div className="mt-4 border border-darkBlueHover p-2 py-4">
        <div>
          <Form form={form} initialValues={filter} onFinish={populateData} className="grid md:grid-cols-4 grid-cols-2 gap-x-2 items-center p-2 pt-0">
            {/* <CustomDatePicker
              className="no-border"
              defaultValue={filter.date}
              placeholder="Date"
              name="date"
              onChange={handleChange}
              required
              /> */}

<MonthPicker
      onChange={(value, string) => handleChange("startDate", value)}
      value={filter.startDate ? dayjs(filter.startDate, "DD/MM/YYYY") : null} 
      format="YYYY-MM"
      placeholder="Select Month & Year"
    />
            {/* <CustomDatePicker
              className="no-border"
              defaultValue={filter.endDate}
              placeholder="To date"
              name="endDate"
              onChange={handleChange}
              required
              /> */}
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

export default QctRecord1;
