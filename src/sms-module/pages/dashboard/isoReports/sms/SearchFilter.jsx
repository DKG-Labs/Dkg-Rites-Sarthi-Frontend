/* eslint-disable */
﻿import { Button, Form } from 'antd'
import React, { useEffect, useState } from 'react'
import CustomDatePicker from '../../../../components/DKG_CustomDatePicker'
import data from '../../../../utils/db.json'
import FormDropdownItem from '../../../../components/DKG_FormDropdownItem'
import FormInputItem from '../../../../components/DKG_FormInputItem'

const SearchFilter = ({showDate, showShift, showRailGrade, showRailSection, showSms, onFinish, showMill, customRsL, showJn}) => {
    const [form] = Form.useForm()

    const [shiftList, setShiftList] = useState([])
    const [railGradeList, setRailGradeList] = useState([])
    const [smsList, setSmsList] = useState([customRsL]);
    const [millList, setMillList] = useState([customRsL]);
    const [railSectionList, setRailSectionList] = useState([customRsL]);
    const [formData, setFormData] = useState({
        date: null,
        shift: null,
        railGrade: null,
        railSection: null,
        jointNo: null
    })

    const handleChange = (fieldName, value) => {
        setFormData({
            ...formData,
            [fieldName]: value
        })
    }

    useEffect(() => {
        setShiftList([...data.shiftList])
        setRailGradeList([...data.railGradeList])
        setSmsList([...data.smsList]);
        setMillList([...data.millList]);
        if(customRsL){
            setRailSectionList([...customRsL])
        }
        else{
            setRailSectionList([...data.railSectionList]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  return (
    <div>
      <Form form={form} layout="vertical" initialValues={formData} className='grid grid-cols-2 gap-x-2 p-4' onFinish={() => onFinish(formData)}> 
        {
            showDate && (
                <CustomDatePicker label='Date' defaultValue={formData.date} name='date' onChange={handleChange} required/>
            )
        }
        {
            showShift && (
                <FormDropdownItem name="shift" formField="shift" label="Shift" dropdownArray={shiftList} onChange={handleChange} visibleField="key"
                valueField="key" required />
            )
        }
        {
            showRailGrade && (
                <FormDropdownItem name="railGrade" formField="railGrade" label="Rail Grade" dropdownArray={railGradeList} onChange={handleChange} visibleField="key"
                valueField="key" required />
            )
        }
        {
            showMill && (
                <FormDropdownItem name="mill" formField="mill" label="Mill" dropdownArray={millList} onChange={handleChange} visibleField="key"
                valueField="key" required />
            )
        }
        {
            showRailSection && (
                <FormDropdownItem name="railSection" formField="railSection" label="Rail Section" dropdownArray={railSectionList} onChange={handleChange} visibleField="key"
                valueField="key" required />
            )
        }
        {
            showSms && (
                <FormDropdownItem
                label="SMS"
                name="sms"
                formField="sms"
                dropdownArray={smsList}
                visibleField="value"
                valueField="key"
                onChange={handleChange}
                required
              />
            )
        }
        {
            showJn && (
                <FormInputItem name="jointNo" label="Joint Number" required onChange={handleChange} />
            )
        }
        <div className="col-span-2 grid grid-cols-2 gap-2">
            <Button htmlType="submit" className='bg-darkBlue text-white'>Search</Button>
            <Button onClick={() => window.location.reload()} className='bg-darkBlue text-white'>Reset</Button>
        </div>

      </Form>

    </div>
  )
}

export default SearchFilter
