/* eslint-disable */
import React, { useState } from 'react'
import { useSelector } from 'react-redux';
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import data from '../../../../../utils/frontSharedData/Testing/Testing.json'
import FormBody from '../../../../../components/DKG_FormBody'
import { useNavigate } from "react-router-dom";
import { FilterFilled } from '@ant-design/icons';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem'
import { Checkbox, Divider, Table } from 'antd'
import Search from "../../../../../components/DKG_Search"
import Btn from '../../../../../components/DKG_Btn'

const { testingReportData: sampleData, railGradeList, millList, testCategoryList, testingReportColumns } = data;

const checkBoxItems = [
    { "key": 1, "value": "Accepting Test" },
    { "key": 2, "value": "Retest" }
]

const TestingReport = () => {
    const navigate = useNavigate()
    const [checkedValues, setCheckedValues] = useState([])
    const [formData, setFormData] = useState({
        mill: '', railGrade: '', testCategory: ''
    })

    const handleChange = (fieldName, value) => {
        setFormData(prev => {
          return {
            ...prev,
            [fieldName]: value
          }
        })
    }

    const handleClick = () => {
        navigate('/sms/testing/home')
    };
 const testingGeneralInfo = useSelector(state => state.testingDuty);
    

  return (
    <FormContainer>
        <SubHeader title="Shift Testing Report" link="/testing/home" />
        <GeneralInfo data={testingGeneralInfo} />

        <FormBody initialValues={formData}>
            <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Rail Grade' name='railGrade' dropdownArray={railGradeList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex items-center gap-x-2'>
                    <Checkbox.Group
                        options={checkBoxItems.map(item => ({key: item.key, label: item.value, value: item.key }))}
                        value={checkedValues}
                        onChange={(checkedValues) => setCheckedValues(checkedValues)}
                        className='mb-6 sm:mb-0'
                    />
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Mill' name='mill' dropdownArray={millList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex justify-center items-center mb-6 sm:mb-0'>
                    <Search placeholder='Search by S. No.' />
                </div>
            </div>

            <Divider className='mt-0 mb-4' />

            <div className='flex justify-center items-center gap-x-2'>
                <FilterFilled />         
                <FormDropdownItem label ='Test Category' name='testCategory' dropdownArray={testCategoryList} valueField='key' visibleField='value' onChange = {handleChange} className='w-[50%]' />
            </div>

            <Table
                dataSource={sampleData}
                columns={testingReportColumns}
                scroll={{ x: true }}
                bordered
                onRow={(record) => {
                return {
                    onClick: () => {
                        // Navigate to the desired path when a row is clicked
                        // navigate(`/user/${record.key}`);
                        navigate(`/welding/home`);
                    },
                    };
                }}
                pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20"],
                }}
            />

            <div className='flex justify-center'>
                <Btn onClick={handleClick}>OK</Btn>
            </div>
        </FormBody>
    </FormContainer>
  )
}

export default TestingReport
