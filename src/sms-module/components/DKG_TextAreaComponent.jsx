/* eslint-disable */
import React from "react";
import { Form, Input } from "antd";
const { TextArea } = Input;

const TextAreaComponent = ({
  label,
  name,
  value,
  rows,
  onChange,
  required,
  disabled,
  className
}) => {
  const handleChange = (e) => {
    if (onChange) onChange(name, e.target.value);
  };

  return (
    <Form.Item label={label} name={name} required className={`${className}`}>
      <TextArea rows={rows} onChange={handleChange} value={value} autoSize={{ minRows: 1, maxRows: 16 }} disabled={disabled} />
    </Form.Item>
  );
};
export default TextAreaComponent;