/* eslint-disable */
// // import React from 'react';
// // import { DatePicker, Form } from 'antd';
// // import moment from 'moment';
// // import 'moment/locale/en-gb'; // To support locale formatting

// // const CustomDatePicker = ({ label, value, onChange, name, disabled, required }) => {
// //   const handleChange = (date, dateString) => {
// //     if (onChange) {
// //       onChange(name, date ? dateString : null);
// //     }
// //   };

// // //   Convert value to moment object or null
// //   const formattedValue = value ? moment(value, 'DD/MM/YYYY', true) : null;
// //   if(formattedValue !== null){
// //     console.log("NAME: ", name, formattedValue.isValid())
// //   }

// //   return (
// //     <Form.Item label={label} 
// //     className='date-component'
// //     // required={required ? true : false}
// //     rules={[{ required: required ? true : false, message: 'Please input your value!' }]}
// //     name={name}
// //     shouldUpdate={(prevValues, currentValues) => {
// //       const update = moment(prevValues[name], 'DD/MM/YYYY', true) !== moment(currentValues[name], 'DD/MM/YYYY', true)
// //       console.log("UPATE OR NO: ",name, update)
// //       return update
// //     }}
// //     >

// //     <DatePicker
// //     // disabled={disabled}
// //     format="DD/MM/YYYY"
// //     value={formattedValue}
// //     onChange={handleChange}
// //     />
// //     </Form.Item>
// //   );
// // };

// import React from "react";
// import { Form, DatePicker } from "antd";
// import dayjs from "dayjs";
// import FormInputItem from "./DKG_FormInputItem";

// const dateFormat = "DD/MM/YYYY";

// const CustomDatePicker = ({
//   label,
//   name,
//   defaultValue,
//   onChange,
//   readOnly,
//   required,
//   placeholder,
//   className,
//   disablePastDate,
//   disableFutureDate,
//   disabled
// }) => {
//   const initialValue = defaultValue ? dayjs(defaultValue, dateFormat) : null;

//   const disablePastDates = (current) => {
//     if(disablePastDate){
//       return current && current < dayjs().startOf("day");
//     }
//     return false;
//   };
//   const disableFutureDates = (current) => {
//     if(disableFutureDate){
//       return current && current > dayjs().startOf("day");
//     }
//     return false;
//   };



//   const handleDateChange = (date) => {
//     if (date) {
//       if (dayjs.isDayjs(date)) {
//         onChange(name, date.format(dateFormat));
//       } else {
//         onChange(name, null);
//       }
//     } else {
//       onChange(name, null);
//     }
//   };

//   if(readOnly){
//     return <FormInputItem label={label} value={defaultValue} name={name} readOnly />
//   }

//   return (
//     <Form.Item
//       label={label}
//       rules={[
//         { required: required ? true : false, message: "Please input value!" },
//       ]}
//       initialValue={initialValue} // Set initial value
//       className={className}
//     >
//       <DatePicker
//       disabledDate={disablePastDates || disableFutureDates}
//       disabled={disabled}
//       placeholder={placeholder}
//         style={{ width: "100%" }}
//         format={dateFormat}
//         onChange={handleDateChange}
//         value={initialValue} // Control the value of DatePicker
//       />
//     </Form.Item>
//   );
// };

// export default CustomDatePicker;


// import React from 'react';
// import { DatePicker, Form } from 'antd';
// import moment from 'moment';
// import 'moment/locale/en-gb'; // To support locale formatting

// const CustomDatePicker = ({ label, value, onChange, name, disabled, required }) => {
//   const handleChange = (date, dateString) => {
//     if (onChange) {
//       onChange(name, date ? dateString : null);
//     }
//   };

// //   Convert value to moment object or null
//   const formattedValue = value ? moment(value, 'DD/MM/YYYY', true) : null;
//   if(formattedValue !== null){
//     console.log("NAME: ", name, formattedValue.isValid())
//   }

//   return (
//     <Form.Item label={label} 
//     className='date-component'
//     // required={required ? true : false}
//     rules={[{ required: required ? true : false, message: 'Please input your value!' }]}
//     name={name}
//     shouldUpdate={(prevValues, currentValues) => {
//       const update = moment(prevValues[name], 'DD/MM/YYYY', true) !== moment(currentValues[name], 'DD/MM/YYYY', true)
//       console.log("UPATE OR NO: ",name, update)
//       return update
//     }}
//     >

//     <DatePicker
//     // disabled={disabled}
//     format="DD/MM/YYYY"
//     value={formattedValue}
//     onChange={handleChange}
//     />
//     </Form.Item>
//   );
// };

import React from "react";
import { Form, DatePicker } from "antd";
import dayjs from "dayjs";

const dateFormat = "DD/MM/YYYY";

const CustomDatePicker = ({
  label,
  name,
  defaultValue,
  onChange,
  readOnly,
  required,
  placeholder,
  disablePastDate,
  disableFutureDate,
  disabled,
}) => {
  const initialValue = defaultValue ? dayjs(defaultValue, dateFormat) : null;

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const today = dayjs().startOf("day");
    const date = dayjs(dateStr, dateFormat).startOf("day");
    return date.isBefore(today);
  };

  const disablePastDates = (current) => {
    if (disablePastDate) {
      return current && current < dayjs().startOf("day");
    }
    return false;
  };

  const disableFutureDates = (current) => {
    if (disableFutureDate) {
      return current && current > dayjs().startOf("day");
    }
    return false;
  };

  const handleDateChange = (date) => {
    if (date) {
      onChange(name, date.format(dateFormat));
    } else {
      onChange(name, null);
    }
  };

  if (readOnly) {
    return (
      <Form.Item label={label}>
        <span>{defaultValue}</span>
      </Form.Item>
    );
  }

  // List of fields where "Expired" should be displayed
  const showExpiredMessageFor = [
    "micrometerValidity",
    "vernierValidity",
    "weighingMachineValidity",
  ];

  return (
    <Form.Item
      label={label}
      required={required}
      rules={[
        { required: required ? true : false, message: "Please input value!" },
      ]}
      className={
        showExpiredMessageFor.includes(name) && isExpired(defaultValue)
          ? "border-red-500 text-red-600"
          : ""
      }
    >
      <DatePicker
        disabledDate={disablePastDates || disableFutureDates}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          borderColor:
            showExpiredMessageFor.includes(name) && isExpired(defaultValue)
              ? "#f56565"
              : undefined,
          color:
            showExpiredMessageFor.includes(name) && isExpired(defaultValue)
              ? "#e53e3e"
              : undefined,
        }}
        format={dateFormat}
        onChange={handleDateChange}
        value={initialValue}
      />
      {showExpiredMessageFor.includes(name) && isExpired(defaultValue) && (
        <span style={{ color: "#f56565", marginTop: "5px", display: "block" }}>
          Expired
        </span>
      )}
    </Form.Item>
  );
};

export default CustomDatePicker;
