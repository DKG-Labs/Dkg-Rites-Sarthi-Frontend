/* eslint-disable */
import React from 'react'
import { Form } from "antd";

const FormBody = ({children, onFinish, initialValues, layout, className}) => {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout={layout ? layout : 'vertical'}
      className={`py-4 w-full mx-auto ${
        layout === 'horizontal' ? 'horizontal-form' : ''
      } ${className}`}
      initialValues={initialValues}
      onFinish={onFinish}
    >
        {children}
    </Form>
  )
}

export default FormBody
