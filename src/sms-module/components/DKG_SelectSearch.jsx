/* eslint-disable */
import React from 'react';
import { Form, Select } from 'antd';

const DKG_SelectSearch = ({ label, name, value, onChange, required, placeholder, className }) => (
    <Form.Item label={label} name={name} rules={[{ required: required ? true : false, message: 'Required!' }]}>
        <Select showSearch value={value} placeholder={placeholder} className={className} required
            filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
                { value: '1', label: 'Jack' },
                { value: '2', label: 'Lucy' },
                { value: '3', label: 'Tom' },
            ]}
        />
    </Form.Item>
);
export default DKG_SelectSearch;