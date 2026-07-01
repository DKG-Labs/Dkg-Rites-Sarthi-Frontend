/* eslint-disable */
import React, { useState } from 'react';
import { Button, Form, InputNumber } from 'antd';

const DKG_FormNumberInputItem = ({ label, name, min, max, value, onChange, required}) => {
  return (
    <Form.Item label={label} name={name}
      rules={[{ required: required ? true : false, message: 'Please input your value!' }]}
      onChange={onChange}
    >
        <InputNumber min={min} max={max} value={value} onChange={onChange} className='w-full' />
    </Form.Item>
  );
};
export default DKG_FormNumberInputItem;