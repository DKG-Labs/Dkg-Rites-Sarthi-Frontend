/* eslint-disable */
import React from 'react'
import {Form, Select} from "antd"

const { Option } = Select;

const FormDropdownItem = ({label, formField, placeholder, name, onChange, dropdownArray, valueField, visibleField, required, className, disabled, showSearch}) => {
  return (
    <Form.Item label={label} name={name} required={required} rules={[{ required: required ? true : false, message: 'Please select a value!' }]} className={className} >
      <Select placeholder={placeholder} style={{ width: "100%" }} onChange={(value)=>onChange(formField, value)} disabled={disabled} showSearch={showSearch}>
        {
            dropdownArray.map((item, key)=>(
                <Option key={key} value={item[valueField]}> {item[visibleField]} </Option>
            ))
        }
      </Select>
    </Form.Item>
  )
}

export default FormDropdownItem
