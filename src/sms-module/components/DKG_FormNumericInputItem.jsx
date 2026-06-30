/* eslint-disable */
import React, { useState } from 'react';
import { Form, Input, Tooltip } from 'antd';

const formatNumber = (value) => new Intl.NumberFormat().format(value);

const NumericInput = (props) => {
  const { value, onChange, label, name, required, placeholder, maxLength, minLength, max, min, ref, onBlur, onPressEnter } = props;
  const handleChange = (e) => {
    const { value: inputValue } = e.target;
    const reg = /^\d*\.?\d*$/;
    if (reg.test(inputValue) || inputValue === '' || inputValue === '-') {
      onChange(inputValue);
    }
  };

  // '.' at the end or only '-' in the input box.
  const handleBlur = () => {
    let valueTemp = value;
    if (value.charAt(value.length - 1) === '.' || value === '-') {
      valueTemp = value.slice(0, -1);
    }
    // onChange(valueTemp.replace(/0*(\d+)/, '$1'));
  };
  const title = value ? (
    <span className="numeric-input-title">{value !== '-' ? formatNumber(Number(value)) : '-'}</span>
  ) : (
    'Input a number'
  );
  return (
    <Form.Item label={label} name={name} rules={[{ required: required ? true : false, message: 'Please input your value!' }]}
    >
        <Tooltip trigger={['focus']} title={title} placement="topLeft" overlayClassName="numeric-input">
            <Input
                {...props}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                maxLength={maxLength}
                minLength={minLength}
                max={max}
                min={min}
                ref={ref}
                onPressEnter={onPressEnter}
            />
        </Tooltip>
    </Form.Item>
  );
};

export  default NumericInput;