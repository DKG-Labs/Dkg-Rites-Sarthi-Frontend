/* eslint-disable */
import React from 'react'
import { Form } from "antd";

const FormBody = ({children, onFinish, initialValues, layout, className, form}) => {
  const [internalForm] = Form.useForm();
  const activeForm = form || internalForm;
  return (
    <Form
      form={activeForm}
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
