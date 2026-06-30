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

const ViDefectAnalysis = () => {
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Inspection Workspot',
      dataIndex: 'inspectionWorkspot',
      key: 'inspectionWorkspot',
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
      title: 'Std. Offered Length',
      dataIndex: 'stdOfferedLengthForInspection',
      key: 'stdOfferedLengthForInspection',
    },
    {
      title: 'Rails Offered',
      dataIndex: 'noOfRailsOfferedForInspection',
      key: 'noOfRailsOfferedForInspection',
    },
    {
      title: 'NMI',
      dataIndex: 'nmi',
      key: 'nmi',
    },
    {
      title: 'MDF',
      dataIndex: 'mdf',
      key: 'mdf',
    },
    {
      title: 'MDM',
      dataIndex: 'mdm',
      key: 'mdm',
    },
    {
      title: 'HS',
      dataIndex: 'hs',
      key: 'hs',
    },
    {
      title: 'LS',
      dataIndex: 'ls',
      key: 'ls',
    },
    {
      title: 'HH',
      dataIndex: 'hh',
      key: 'hh',
    },
    {
      title: 'LH',
      dataIndex: 'lh',
      key: 'lh',
    },
    {
      title: 'NF',
      dataIndex: 'nf',
      key: 'nf',
    },
    {
      title: 'WF',
      dataIndex: 'wf',
      key: 'wf',
    },
    {
      title: 'OHT',
      dataIndex: 'oht',
      key: 'oht',
    },
    {
      title: 'UHT',
      dataIndex: 'uht',
      key: 'uht',
    },
    {
      title: 'TNW',
      dataIndex: 'tnw',
      key: 'tnw',
    },
    {
      title: 'TKW',
      dataIndex: 'tkw',
      key: 'tkw',
    },
    {
      title: 'LAP',
      dataIndex: 'lap',
      key: 'lap',
    },
    {
      title: 'GM',
      dataIndex: 'gm',
      key: 'gm',
    },
    {
      title: 'BR',
      dataIndex: 'br',
      key: 'br',
    },
    {
      title: 'KK',
      dataIndex: 'kk',
      key: 'kk',
    },
    {
      title: 'TW',
      dataIndex: 'tw',
      key: 'tw',
    },
    {
      title: 'NS',
      dataIndex: 'ns',
      key: 'ns',
    },
    {
      title: 'OL',
      dataIndex: 'ol',
      key: 'ol',
    },
    {
      title: 'SL',
      dataIndex: 'sl',
      key: 'sl',
    },
    {
      title: 'OS',
      dataIndex: 'os',
      key: 'os',
    },
    {
      title: 'NHN',
      dataIndex: 'nhn',
      key: 'nhn',
    },
    {
      title: 'ASY',
      dataIndex: 'asy',
      key: 'asy',
    },
    {
      title: 'BE',
      dataIndex: 'be',
      key: 'be',
    },
    {
      title: 'US',
      dataIndex: 'us',
      key: 'us',
    },
    {
      title: 'DS',
      dataIndex: 'ds',
      key: 'ds',
    },
    {
      title: 'UT',
      dataIndex: 'ut',
      key: 'ut',
    },
    {
      title: 'TF (+)',
      dataIndex: 'tfPositive',
      key: 'tfPositive',
    },
    {
      title: 'TF (-)',
      dataIndex: 'tfNegative',
      key: 'tfNegative',
    },
    {
      title: 'HF (+)',
      dataIndex: 'hfPositive',
      key: 'hfPositive',
    },
    {
      title: 'HF (-)',
      dataIndex: 'hfNegative',
      key: 'hfNegative',
    },
    {
      title: 'CP',
      dataIndex: 'cp',
      key: 'cp',
    },
    {
      title: 'FBC',
      dataIndex: 'fbc',
      key: 'fbc',
    },
    {
      title: 'FBCX',
      dataIndex: 'fbcx',
      key: 'fbcx',
    },
    {
      title: 'Others',
      dataIndex: 'others',
      key: 'others',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: 'UT Date', // More descriptive
      dataIndex: 'dateForSteelMillFinishUT',
      key: 'dateForSteelMillFinishUT',
    },
    {
      title: 'Mill',
      dataIndex: 'mill',
      key: 'mill',
    },
    {
      title: 'Finish',
      dataIndex: 'finish',
      key: 'finish',
    },
    {
      title: 'UT Offered Length',
      dataIndex: 'utStandardOfferedLength',
      key: 'utStandardOfferedLength',
    },
      {
      title: 'C/RC',
      dataIndex: 'crc',
      key: 'crc',
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
        "/vi/getViDefectAnalysisRecord",
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
      <SubHeader title="VI Defect Analysis" link="/record/vi" />

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

export default ViDefectAnalysis;
