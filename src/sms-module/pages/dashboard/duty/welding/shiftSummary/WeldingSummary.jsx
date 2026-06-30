/* eslint-disable */
﻿import React, { useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/weldingInspection/WeldingInspection.json";
import { message, Table } from 'antd';
import FormBody from "../../../../../components/DKG_FormBody";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { FilterFilled } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { apiCall } from "../../../../../utils/CommonFunctions";

const { weldData: sampleData, weldingInspectionGeneralInfo, lineNumberList } = data;

const WeldingSummary = () => {
  const navigate = useNavigate();

  const handleEdit = (record) => {
    navigate('/welding/newWeldInspection', {state: {record: record, edit: true}})
  }

  const handleDelete = async(record) => {
    try{
      await apiCall("POST", `/welding/deleteWeldInspection?id=${record.inspectionMasterId}`, token)
      message.success("Successfully deleted.");
      populateData()
    }
    catch (error) {
      message.error("Error deleting data.");
    }
  }

   const weldColumns = [
  { title: "Panel ID", dataIndex: "panelId", key: "panelID", align: "center" },
  {
    title: "Weld Joint No.",
    dataIndex: "details",
    key: "details",
    align: "center",
    render: (details) => Array.isArray(details) ? details.map(item => item.jointNo).join(", ") : ""
  },
  { title: "Rail ID", dataIndex: "details", key: "railID", align: "center",
    render: (details) => Array.isArray(details) ? details.map(item => item.railId1 + ", " + item.railId2).join(", ") : ""
   },
  { title: "Status", dataIndex: "panelDecision", key: "status", align: "center" },
  {
    title: "Action",
    dataIndex: "action",
    key: "action",
    align: "center",
    render: (_, record) => (
      <div className="flex gap-x-2">
        <Btn onClick={() => handleEdit(record)}>Update</Btn>
        <Btn onClick={() => handleDelete(record)}>Delete</Btn>
      </div>
    )
  }
];

  const [data, setData] = useState([])

  const handleClick = () => {
    navigate('/sms/welding/home')
  }

  const weldingGeneralInfo = useSelector((state) => state.weldingDuty)
const {token} = useSelector(state => state.auth)
  const populateData = async () => {
    try{
      const {data} = await apiCall("GET", `/welding/getWeldingInspectionsByDutyId?dutyId=${weldingGeneralInfo.dutyId}`, token);
      setData(data?.responseData || [])
    } catch (error) {
      message.error("Error fetching data.");
    }
  }

  console.log("DATA: ", data)

  useEffect(() => {
    populateData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormContainer>
        <SubHeader title="Welding Inspection - Shift Summary" link="/welding/home" />
        <GeneralInfo data={weldingInspectionGeneralInfo} />
        <Table
          dataSource={data}
          columns={weldColumns}
          scroll={{ x: true }}
          bordered
          pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
          }}
        />

        <div className='flex justify-center mt-2'>
          <Btn onClick={handleClick} className='w-[25%]'>Go Home</Btn>
        </div>
    </FormContainer>
  )
}

export default WeldingSummary