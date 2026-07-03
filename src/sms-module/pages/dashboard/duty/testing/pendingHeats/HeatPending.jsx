/* eslint-disable */
import React, { useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import data from '../../../../../utils/frontSharedData/Testing/Testing.json'
import FormBody from '../../../../../components/DKG_FormBody'
import { FilterFilled } from '@ant-design/icons';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem'
import Search from "../../../../../components/DKG_Search"
import { Table } from 'antd';
import { useSelector } from 'react-redux'

const { railGradeList, millList, resultList } = data;

const HeatPending = () => {
  const testingGeneralInfo = useSelector(state => state.testingDuty)
    const [formData, setFormData] = useState({
        mill: '', railGrade: ''
    })

    const handleSelectChange = (value, key) => {
        const updatedData = info.map((row) => {
          if (row.key === key) {
            return { ...row, resultDeclared: value, resultDeclaredSec: value, resultDeclaredTer: value, resultDeclaredTetra: value, resultDeclaredPenta: value };
          }
          return row;
        });
        setInfo(updatedData);
    };

    const [info, setInfo] = useState([
        {
          key: '1',
          heatNumber: '068291',
          mill: 'URM',
          grade: 'R350HT',
          testSample: 'Chemical (L)\nTensile\nSulphur',
          result:
          <>
            <FormDropdownItem name='resultDeclared' placeholder='Result' dropdownArray={resultList} visibleField='value' valueField='key' onChange={handleSelectChange} required/>
          </>
        },
        {
            key: '2',
            heatNumber: '068291',
            mill: 'URM',
            grade: 'R350HT',
            testSample: 'Chemical (L)\nTensile\nSulphur',
            result:
            <>
              <FormDropdownItem name='resultDeclaredSec' placeholder='Result' dropdownArray={resultList} visibleField='value' valueField='key' onChange={handleSelectChange} required/>
            </>
        },
        {
            key: '3',
            heatNumber: '068291',
            mill: 'URM',
            grade: 'R350HT',
            testSample: 'Chemical (L)\nTensile\nSulphur',
            result:
            <>
              <FormDropdownItem name='resultDeclaredTer' placeholder='Result' dropdownArray={resultList} visibleField='value' valueField='key' onChange={handleSelectChange} required/>
            </>
        },
        {
            key: '4',
            heatNumber: '068291',
            mill: 'URM',
            grade: 'R350HT',
            testSample: 'Chemical (L)\nTensile\nSulphur',
            result:
            <>
              <FormDropdownItem name='resultDeclaredTetra' placeholder='Result' dropdownArray={resultList} visibleField='value' valueField='key' onChange={handleSelectChange} required/>
            </>
        },
        {
            key: '5',
            heatNumber: '068291',
            mill: 'URM',
            grade: 'R350HT',
            testSample: 'Chemical (L)\nTensile\nSulphur',
            result:
            <>
              <FormDropdownItem name='resultDeclaredPenta' placeholder='Result' dropdownArray={resultList} visibleField='value' valueField='key' onChange={handleSelectChange} required/>
            </>
        },
    ]);

    const handleChange = (fieldName, value) => {
        setFormData(prev => {
          return {
            ...prev,
            [fieldName]: value
          }
        })
    }

    const pendingHeatColumns = [
        {
            title: 'S.No.',
            dataIndex: 'key',
            key: 'key',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Heat No.',
            dataIndex: 'heatNumber',
            key: 'heatNumber',
            align: 'center',
        },
        {
            title: 'Mill',
            dataIndex: 'mill',
            key: 'mill',
            align: 'center',
        },
        {
            title: 'Grade',
            dataIndex: 'grade',
            key: 'grade',
            align: 'center',
        },
        {
          title: 'Test Sample Pending / Rejected',
          dataIndex: 'testSample',
          key: 'testSample',
          align: 'center'
        },
        {
          title: 'Result',
          dataIndex: 'result',
          key: 'result',
          align: 'center',
        }
    ]

  return (
    <FormContainer>
        <SubHeader title="Pending Heats for Testing" link="/testing/home" />
        <GeneralInfo data={testingGeneralInfo} />

        <FormBody initialValues={formData}>
            <div className='grid grid-cols-1 md:grid-cols-3 sm:grid-cols-3 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Rail Grade' name='railGrade' dropdownArray={railGradeList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Mill' name='mill' dropdownArray={millList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex justify-center items-center mb-6 sm:mb-0'>
                    <Search placeholder='Search by S. No.' />
                </div>
            </div>

            <Table columns={pendingHeatColumns} dataSource={info} bordered pagination={false} />
        </FormBody>
    </FormContainer>
  )
}

export default HeatPending