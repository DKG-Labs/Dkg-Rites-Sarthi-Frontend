/* eslint-disable */
import React from 'react';
import { Form, TimePicker } from 'antd';
import dayjs from 'dayjs';

const format = 'HH:mm';

const DKG_CustomTimePicker = ({ label, name, value, onChange, required }) => {
    return (
        <Form.Item
            className='time-component'
            label={label}
            name={name}
            rules={[{ required: required ? true : false, message: 'Please input your value!' }]}
        >
            <TimePicker value={value} onChange={onChange} defaultValue={dayjs('00:00', format)} format={format} rules={[{ required: required ? true : false, message: 'Please input your value!' }]} />
        </Form.Item>
    )
};

export default DKG_CustomTimePicker;