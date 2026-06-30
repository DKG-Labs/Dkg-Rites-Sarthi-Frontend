/* eslint-disable */
import { Form } from "antd";
import Input from "antd/es/input/Input";
import React from "react";
import FormInputItem from "./DKG_FormInputItem";
// import FormInputItem from "./FormInputItem";

const { Search } = Input;
const FormSearchItem = ({
  label,
  name,
  onChange,
  onSearch,
  required,
  readOnly
}) => {
  return (
    <>
    {
      readOnly ? (
        <FormInputItem name={name} readOnly label={label} />
      )
      :
      <Form.Item
      className="search-input"
        label={label}
        name={name}
        rules={[
          { required: required ? true : false, message: "Please input a value!" },
        ]}
      >
        <Search
          onSearch={onSearch}
          onChange={(e) => onChange(name, e.target.value)}
          enterButton
        />
      </Form.Item>
      
    }
    </>
  );
};

export default FormSearchItem;
