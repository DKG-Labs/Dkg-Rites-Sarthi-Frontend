/* eslint-disable */
import { Button, Form, message } from 'antd';
import React from 'react';
import { useSaving } from '../utils/saveActivity';

/**
 * DKG_Btn — Primary action button, styled with Sleeper Vendor design.
 * Preserves all original props: text, children, onClick, htmlType, className, disabled
 *
 * Submit buttons also give feedback:
 *  - spinner + blocked while a save request is running
 *  - "Please fill all required fields" + scroll to the first one when the form has errors
 */
const Btn = ({ text, children, onClick, htmlType, className, disabled, loading, ...rest }) => {
  const isSubmit = htmlType === 'submit';
  const form = Form.useFormInstance();
  const saving = useSaving();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!isSubmit || !form?.validateFields) return;
    // runs after antd's own submit validation; only reports, never submits
    setTimeout(() => {
      form.validateFields().catch((err) => {
        const first = err?.errorFields?.[0];
        if (!first) return;
        message.warning('Please fill all required fields');
        try { form.scrollToField(first.name, { behavior: 'smooth', block: 'center' }); } catch (_) { /* field not mounted */ }
      });
    }, 0);
  };

  return (
    <Button
      disabled={disabled}
      loading={loading || (isSubmit && saving)}
      htmlType={htmlType || 'button'}
      onClick={handleClick}
      type="primary"
      className={className}
      {...rest}
    >
      {text ? text : children}
    </Button>
  );
};

export default Btn;
