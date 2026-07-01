/* eslint-disable */
import React from "react";
import { Form, Input } from "antd";
const { TextArea } = Input;
const FormInputItem = ({
  label,
  name,
  value,
  onChange,
  readOnly,
  disabled,
  className,
  placeholder,
  required,
}) => {
  const handleChange = (e) => {
    if (onChange) onChange(name, e.target.value);
  };
  return (
    <Form.Item
      label={label}
      name={name}
      className={className}
      rules={[{ required: required ? true : false, message: 'Please input value!' }]}
    >
      <TextArea
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
      />
    </Form.Item>
  );
};

export default FormInputItem;
