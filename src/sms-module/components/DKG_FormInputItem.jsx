/* eslint-disable */
import React from 'react'
import {Form, Input, InputNumber} from "antd"

const FormInputItem = ({label, name, value, onChange, readOnly, disabled, className, placeholder, required, min, max, type, rules=[], inputStyle}) => {
  const handleChange = (e) => {
    if(onChange) {
      // Handle InputNumber case (value passed directly) vs Input case (event object)
      const value = e && e.target ? e.target.value : e;

      if(typeof name === 'string')
        onChange(name, value)
      else
        onChange(name[2], value)
    }
  }
  return (
    <Form.Item label={label} name={name}
      // rules = {rules}
      rules={[{ required: required ? true : false, message: 'Please input a value!' }, ...rules]}
      // className={`!mb-4 flex flex-col sm:flex-row items-center ${className}`}
      className={className}
    >
      {
        type === 'number' ? 
        <InputNumber
        step={1}          // Increment/decrement step
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
        style={{ width: '100%' }} // Adjust width as needed
      />
      :
        <Input value={value} onChange={handleChange} readOnly={readOnly} disabled={disabled} placeholder={placeholder} style={inputStyle || {}}/>
      }
    </Form.Item>
  )
}

export default FormInputItem