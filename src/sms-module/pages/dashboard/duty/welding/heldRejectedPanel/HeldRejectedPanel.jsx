/* eslint-disable */
﻿import React, { useState, useEffect, useCallback } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import data from "../../../../../utils/frontSharedData/weldingInspection/WeldingInspection.json";
import FormBody from '../../../../../components/DKG_FormBody';
import { FilterFilled, EditOutlined } from '@ant-design/icons';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import { Checkbox, Table, message } from 'antd';
import Search from "../../../../../components/DKG_Search"
import CustomDatePicker from '../../../../../components/DKG_CustomDatePicker';
import moment from 'moment'
import { Divider } from 'antd';
import IconBtn from '../../../../../components/DKG_IconBtn';
import { useNavigate } from "react-router-dom";
import Btn from '../../../../../components/DKG_Btn';
import { apiCall } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';
import TableComponent from '../../../../../components/DKG_Table';

const { weldingInspectionGeneralInfo, railGradeDropdownList, railSectionList, heldRejectedPanelTableData } = data;

const checkBoxItems = [
  { "key": 1, "value": "Held" },
  { "key": 2, "value": "Rejected" },
  { "key": 3, "value": "Refinish" }
]

const HeldRejectedPanel = () => {
  const navigate = useNavigate()
  const [tableData, setTableData] = useState([]);
  const [weldStartDate, setWeldStartDate] = useState('')
  const [weldEndDate, setWeldEndDate] = useState('')
  const [checkedValues, setCheckedValues] = useState([])
  const [currentTablePage, setCurrentTablePage] = useState(1)
  const [tablePageSize, setTablePageSize] = useState(5)
  const [formData, setFormData] = useState({
    railSection: '', railGrade: ''
  })

  const {token} = useSelector(state => state.auth)
  const weldingGeneralInfo = useSelector(state => state.weldingDuty);

  const populateTableData = useCallback( async () => {
    // setTableData([...heldRejectedPanelTableData]);

    try{
      const {data} = await apiCall("GET", "/welding/getRefinishHoldingWeldingDtls", token)
      setTableData(data?.responseData || []) 
    }
    catch(error){}
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    populateTableData();
  }, [populateTableData]);

  const handleChange = (fieldName, value) => {
    setFormData(prev => {
      return {
        ...prev,
        [fieldName]: value
      }
    })
  }

  const handlePageSizeChange = (value) => {
    setTablePageSize(value);
    setCurrentTablePage(1); // Reset to first page when page size changes
  };

  const handleRowClick = (id) => {
    navigate('/welding/newWeldInspection', { state: {id}})
  };

  const handleClick = () => {
    navigate('/sms/welding/home')
  };

  const columns = [
    {
      title: "Date of Inspection",
      dataIndex: "date",
      key: "date",
      align: "center",
      filterable: true
    },
    {
      title: "Shift",
      dataIndex: "shift",
      key: "shift",
      align: "center",
      filterable: true
    },
    {
      title: "Panel ID",
      dataIndex: "panelId",
      key: "panelID",
      align: "center",
      filterable: true
    },
    {
      title: "Rail ID1",
      dataIndex: "railId1",
      key: "railID1",
      align: "center",
      filterable: true
    },
    {
      title: "Rail ID2",
      dataIndex: "railId2",
      key: "railID2",
      align: "center",
      filterable: true
    },
    {
      title: "Status",
      dataIndex: "panelDecision",
      key: "panelDecision",
      align: "center",
      filterable: true
    },
    {
      title: "Edit",
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <IconBtn
          icon={EditOutlined}
          onClick={() => handleRowClick(record.inspectionMasterId)}
        />
      ),
    },
  ];

  const handleWeldEndChange = (_, value) => {
    const date = moment(value, 'DD/MM/YYYY', true);
    if (!date.isValid()) {
      throw new Error('Invalid date format. Please use DD/MM/YYYY.');
    }
    const oneMonthBefore = date.subtract(1, 'months');
    const formattedValue = oneMonthBefore.format('DD/MM/YYYY');
    setWeldStartDate(formattedValue)
    setWeldEndDate(value)
  }

  return (
    <FormContainer>
      <SubHeader title="Held or Rejected Weld Panel Inspection" link="/welding/home" />
      <GeneralInfo data={weldingGeneralInfo}/>

      <FormBody initialValues={formData}>
        {/* <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <div className='flex items-center gap-x-2'>
            <FilterFilled />
            <FormDropdownItem label='Rail Grade' name='railGrade' dropdownArray={railGradeDropdownList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
          </div>

          <div className='flex items-center gap-x-2'>
            <FilterFilled />         
            <FormDropdownItem label ='Rail Section' name='railSection' dropdownArray={railSectionList} valueField='key' visibleField='value' onChange = {handleChange} className='w-full' />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <div className='flex items-center gap-x-2'>
            <Checkbox.Group
              options={checkBoxItems.map(item => ({key: item.key, label: item.value, value: item.key }))}
              value={checkedValues}
              onChange={(checkedValues) => setCheckedValues(checkedValues)}
            />
          </div>

          <div className='mt-6 sm:mt-2'>
            <Search placeholder='Search by Panel ID or Joint no.' className='w-full' />
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-x-2 mt-6'>
          <h1 className='font-semibold sm:mt-4'>Weld Joint Inspection Date: </h1>
          <CustomDatePicker label='From' name='weldStartDate' value={weldStartDate} onChange={handleWeldEndChange} />
          <CustomDatePicker label='To' name='weldEndDate' value={weldEndDate} />
        </div> */}

        <TableComponent
          columns={columns}
          dataSource={tableData}
          hideExport
          hideManageColumns
        />
      </FormBody>

      <div className='flex justify-center'>
        <Btn onClick={handleClick}>OK</Btn>
      </div>
    </FormContainer>
  )
}

export default HeldRejectedPanel