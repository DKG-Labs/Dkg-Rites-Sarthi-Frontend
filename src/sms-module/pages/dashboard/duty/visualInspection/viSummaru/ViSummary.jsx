/* eslint-disable */
﻿import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import { useSelector } from 'react-redux'
import { apiCall } from '../../../../../utils/CommonFunctions'
import TableComponent from '../../../../../components/DKG_Table'
import Btn from '../../../../../components/DKG_Btn'
import { useNavigate } from 'react-router-dom'
import { Button, message, Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'

const ViSummary = () => {
    const viGeneralInfo = useSelector(state => state.viDuty);
    const {token} = useSelector(state => state.auth);
    const [tableData, setTableData] = useState([])

    const navigate = useNavigate();

    const handleBtnClick = (record) => {
        navigate("/visual/inspection", {state: record})
    }

    const handleDelete = async (record) => {
        try {
            const response = await apiCall("DELETE", `/vi/deleteViDtls?railId=${record.railId}`, token);
            console.log("Delete response:", response);
            message.success("Visual inspection record deleted successfully.");
            populateData(); // Refresh the table data
        } catch (error) {
            console.error("Delete error:", error);
            // The error message is already shown by apiCall function
        }
    }

    const columns = [
        {
            title: "Heat Number",
            dataIndex: "heatNo",
            key: "heatNumber",
        },
        {
            title: "Rail ID",
            dataIndex: "railId",
            key: "railId",
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            width: 180,
            align: "center",
            render: (_, record) => (
                <div className="flex gap-1 justify-center">
                    <Button
                        type="default"
                        size="small"
                        onClick={() => handleBtnClick(record)}
                        className="px-3"
                    >
                        EDIT
                    </Button>
                    <Popconfirm
                        title="Delete Record"
                        description="Are you sure you want to delete this record?"
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                        placement="topLeft"
                    >
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            className="px-2"
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </div>
            )
        }
    ]

    console.log("TABLE dATA: ", tableData)

    const populateData = async () => {
        console.log("POPULATE DATA CAKLLED")
        try {
            const {data} = await apiCall("GET", `/vi/getViSummary?dutyId=${viGeneralInfo.dutyId}`, token)
            setTableData(data.responseData || [])
        }
        catch(error){
        }
    }

    useEffect(() => {
        populateData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  return (
    <FormContainer>
        <SubHeader title="Visual Inspection Summary" link="/" />
        <GeneralInfo data={viGeneralInfo} />

        <h1 className='font-semibold !text-md'>Rail ID and corresponding heat numbers of the data entered in the shift</h1>

        <TableComponent dataSource={tableData} columns={columns}/>
    </FormContainer>
  )
}

export default ViSummary
