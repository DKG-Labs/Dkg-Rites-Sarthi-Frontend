/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
import FormBody from "../../../../../components/DKG_FormBody";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../components/DKG_Btn";
import { message } from "antd";
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
const SmsDutyStartForm = () => {
  const dispatch = useDispatch();
  const { dutyId } = useSelector((state) => state.smsDuty);
  const [formData, setFormData] = useState({
    startDate: currentDate.format(dateFormat),
    shift: "",
    sms: "",
    railGrade: "",
  });
  const [shiftList, setShiftList] = useState([]);
  const [smsList, setSmsList] = useState([]);

  const navigate = useNavigate();

  const populateShiftSmsList = useCallback(() => {
    setShiftList([...data.shiftList]);
    setSmsList([...data.smsList]);
  }, []);

  useEffect(() => {
    populateShiftSmsList();
  }, [populateShiftSmsList]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const handleFormSubmit = async () => {
    await dispatch(startSmsDuty(formData)).unwrap();
    navigate("/sms/sms/dutyEnd");
  };

  if (dutyId) {
    // message.error("Duty already in progress. Cannot start new duty.");
    return <Navigate to="/sms/sms/dutyEnd" />;
  }

  return (
    <FormContainer>
      <SubHeader title="SMS - Duty Start" link="/" />
      <FormBody initialValues={formData} onFinish={handleFormSubmit}>
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
          label="SMS"
          name="sms"
          formField="sms"
          dropdownArray={smsList}
          visibleField="value"
          valueField="key"
          onChange={handleChange}
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
