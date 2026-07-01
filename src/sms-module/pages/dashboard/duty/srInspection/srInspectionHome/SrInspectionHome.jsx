/* eslint-disable */
import React, { useState, useCallback, useEffect } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import { Divider, message, Table } from 'antd';
import TabList from "../../../../../components/DKG_TabList";
import SrInspectionHomeTabs from "../../../../../utils/frontSharedData/srInspection/srInspection"
import FormBody from '../../../../../components/DKG_FormBody';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import { useNavigate } from 'react-router-dom'
import Btn from '../../../../../components/DKG_Btn';
import { useSelector, useDispatch } from 'react-redux';
import { endSriDuty } from '../../../../../store/slice/sriDutySlice';
import { apiCall } from '../../../../../utils/CommonFunctions';
import IconBtn from '../../../../../components/DKG_IconBtn';
import { FilterFilled, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const SrInspectionHome = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sriGeneralInfo = useSelector((state) => state.sriDuty);
  const { token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    remarks: null
  });

  const [inspectedData, setInspectedData] = useState([])

  const [totalTonnes, setTotalTonnes] = useState([
    // {
    //   totalTonnesInspected: 12,
    //   totalTonnesAccepted: 9,
    //   totalTonnesRejected: 3,
    // },
    // {
    //   totalTonnesInspected: 200,
    //   totalTonnesAccepted: 112,
    //   totalTonnesRejected: 88,
    // },
    // {
    //   totalTonnesInspected: 39,
    //   totalTonnesAccepted: 9,
    //   totalTonnesRejected: 30,
    // },
  ]);

  const populateTableData = useCallback(async () => {
    try {
      const { data } = await apiCall(
        "GET",
        `/shortrailinspection/shortRailSummary?dutyId=${sriGeneralInfo.dutyId}`,
        token
      );
      // const { responseData } = data;

      setTotalTonnes(data?.responseData || []);
    } catch (error) {}
    try {
      const { data } = await apiCall(
        "GET",
        `/shortrailinspection/getShortRailMasterByDutyId?dutyId=${sriGeneralInfo.dutyId}`,
        token
      );
      // const { responseData } = data;

      setInspectedData(data?.responseData || []);
    } catch (error) {}

  }, [sriGeneralInfo.dutyId, token]);

  const handleChange = (fieldName, value) => {
    setFormData(prev => {
      return {
        ...prev,
        [fieldName]: value
      }
    })
  };

  const handleFormSubmit = async () => {
    await dispatch(endSriDuty(formData)).unwrap();
    navigate('/')
  }

  useEffect(() => {
    populateTableData();
  }, [populateTableData]);

  const handleInspectedRowClick = (row) => {
    console.log(row) 
    navigate("/srInspection/addNewInspection", {state: {data: row}})
  }

  const handleDelete = async (row) => {
    const payload = {
      railGrade: row.railGradeInspected,
      railSection: row.railSectionInspected,
      dutyId: sriGeneralInfo.dutyId
    }

    try {
      await apiCall("POST", "/shortrailinspection/deleteInspectedRgRs", token, payload)
      message.success("Record deleted successfully.")
      populateTableData();
    }
    catch(error){}
  }

  const totalTonnesColumns = [
    {
      title: "S/No",
      dataIndex: "sNo",
      key: "sNo",
      render: (_, __, index) => index + 1, // Adding 1 to the index to start from 1
    },
    {
      title: "Inspected Tonnage",
      dataIndex: "totalTonnesInspected",
      key: "totalTonnesInspected",
      render: (value) => (value / 1000).toFixed(3) // Convert to tonnes with 3 decimal places
    },
    {
      title: "Accepted Tonnage",
      dataIndex: "totalTonnesAccepted",
      key: "totalTonnesAccepted",
      render: (value) => (value / 1000).toFixed(3) // Convert to tonnes with 3 decimal places
    },
    {
      title: "Rejected Tonnage",
      dataIndex: "totalTonnesRejected",
      key: "totalTonnesRejected",
      render: (value) => (value / 1000).toFixed(3) // Convert to tonnes with 3 decimal places
    }
  ];
  const inspectedDataColumns = [
    {
      title: "S/No",
      dataIndex: "sNo",
      key: "sNo",
      render: (_, __, index) => index + 1, // Adding 1 to the index to start from 1
    },
    {
      title: "Rail Grade Inspected",
      dataIndex: "railGradeInspected",
      key: "railGradeInspected"
    },
    {
      title: "Rail Section Inspected",
      dataIndex: "railSectionInspected",
      key: "railSectionInspected",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, row) => (
        <div className='flex gap-2'>
          <IconBtn icon={EditOutlined} text="Edit" onClick={() => handleInspectedRowClick(row)} />
          <IconBtn icon={DeleteOutlined} text="Delete" onClick ={() => handleDelete(row)} />
        </div>
      )
    },
    // {
    //   title: "Rejected Tonnage",
    //   dataIndex: "totalTonnesRejected",
    //   key: "totalTonnesRejected",
    // }
  ];

  return (
    <FormContainer>
      <SubHeader title='Short Rail Inspection - Home' link='/' />
      <GeneralInfo data={sriGeneralInfo} />

      <section className='mt-6'>
        <Table
          dataSource={totalTonnes}
          columns={totalTonnesColumns}
          scroll={{ x: true }}
          bordered
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
          }}
        />
      </section>

      <section className='mt-6'>
        <h1 className='font-semibold text-md text-center'>Inspected Rail Grade and Rail Section in current shift</h1>
        <Table
          dataSource={inspectedData}
          columns={inspectedDataColumns}
          scroll={{ x: true }}
          bordered
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
          }}
        />
      </section>

      <Divider className='mt-0 mb-0' />

      <section className="mt-6">
        <TabList tabList={SrInspectionHomeTabs} />
      </section>

      <FormBody initialValues={formData} onFinish={handleFormSubmit} >
        <FormInputItem label='Shift Remarks by GL' name='remarks' value={formData.remarks} onChange={handleChange} required/>

        <div className='flex justify-center'>
          <Btn htmlType='submit' className='w-36'>End Duty</Btn>
        </div>
      </FormBody>
    </FormContainer>
  )
}

export default SrInspectionHome