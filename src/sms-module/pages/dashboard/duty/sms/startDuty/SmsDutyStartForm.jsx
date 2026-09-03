/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
import FormBody from "../../../../../components/DKG_FormBody";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../components/DKG_Btn";
import { message, Form } from "antd";
import data from "../../../../../utils/db.json";
import { Navigate, useNavigate } from "react-router-dom";
import FormContainer from "../../../../../components/DKG_FormContainer";
import { useDispatch, useSelector } from "react-redux";
import { startSmsDuty } from "../../../../../store/slice/smsDutySlice";
import dayjs from "dayjs";

const currentDate = dayjs();
const dateFormat = "DD/MM/YYYY";

const railGradeList = [
  {
    key: "R260",
    value: "R260",
  },
  {
    key: "350HT",
    value: "350HT",
  },
  {
    key: "1080HH",
    value: "1080HH",
  },
  {
    key: "880",
    value: "880",
  },
  {
    key: "880NC",
    value: "880NC",
  }
];
const organisationList = [
  {
    key: "BSP",
    value: "BSP",
  },
  {
    key: "JSPL",
    value: "JSPL",
  },
];

const getSmsListForOrg = (org) => {
  if (org === "BSP") {
    return [
      { key: "SMS 2", value: "SMS 2" },
      { key: "SMS 3", value: "SMS 3" },
    ];
  }
  if (org === "JSPL") {
    return [
      { key: "SMS 2", value: "SMS 2" },
    ];
  }
  return [];
};

const SmsDutyStartForm = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { dutyId } = useSelector((state) => state.smsDuty);
  const [formData, setFormData] = useState({
    startDate: currentDate.format(dateFormat),
    shift: "",
    organisation: "",
    sms: "",
    railGrade: "",
  });
  const [shiftList, setShiftList] = useState([]);

  const navigate = useNavigate();

  const populateShiftList = useCallback(() => {
    setShiftList([...data.shiftList]);
  }, []);

  useEffect(() => {
    populateShiftList();
  }, [populateShiftList]);

  const handleChange = (fieldName, value) => {
    form.setFieldsValue({ [fieldName]: value });
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleOrgChange = (fieldName, value) => {
    const autoSms = value === "JSPL" ? "SMS 2" : "";
    form.setFieldsValue({
      organisation: value,
      sms: autoSms || undefined,
    });
    setFormData((prev) => ({
      ...prev,
      organisation: value,
      sms: autoSms,
    }));
  };

  const handleFormSubmit = async () => {
    try {
      await dispatch(startSmsDuty(formData)).unwrap();
      navigate("/sms/sms/dutyEnd");
    } catch (err) {
      console.error("Failed to start SMS duty:", err);
    }
  };

  if (dutyId) {
    // message.error("Duty already in progress. Cannot start new duty.");
    return <Navigate to="/sms/sms/dutyEnd" />;
  }

  const currentSmsList = getSmsListForOrg(formData.organisation);

  return (
    <FormContainer>
      <SubHeader title="SMS - Duty Start" link="/" />
      <FormBody form={form} initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-2">
          {/* <CustomDatePicker label='Date' name='startDate' value={formData?.date} onChange={handleChange} required/> */}
          <CustomDatePicker
            label="Date"
            name="startDate"
            defaultValue={formData.startDate}
            onChange={handleChange}
            // disabled
            required
          />

          <FormDropdownItem
            label="Shift"
            dropdownArray={shiftList}
            formField="shift"
            name="shift"
            onChange={handleChange}
            valueField="key"
            visibleField="value"
            required
          />
        </div>
        <FormDropdownItem
          label="Organisation"
          name="organisation"
          formField="organisation"
          dropdownArray={organisationList}
          visibleField="value"
          valueField="key"
          onChange={handleOrgChange}
          placeholder="Select Organisation"
          required
        />
        <FormDropdownItem
          key={`${formData.organisation}-${formData.sms}`}
          label="SMS"
          name="sms"
          formField="sms"
          dropdownArray={currentSmsList}
          visibleField="value"
          valueField="key"
          onChange={handleChange}
          placeholder={formData.organisation ? "Select SMS" : "Select Organisation first"}
          disabled={!formData.organisation}
          required
        />
        <FormDropdownItem
          label="Rail Grade"
          name="railGrade"
          formField="railGrade"
          dropdownArray={railGradeList}
          visibleField="value"
          valueField="key"
          onChange={handleChange}
          required
        />
        <div className="text-center">
          <Btn htmlType="submit" className="mx-auto">
            Start Duty
          </Btn>
        </div>
      </FormBody>
    </FormContainer>
  );
};

export default SmsDutyStartForm;
