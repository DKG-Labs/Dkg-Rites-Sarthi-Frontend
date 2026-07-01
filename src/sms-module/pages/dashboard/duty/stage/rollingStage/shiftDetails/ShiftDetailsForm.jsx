/* eslint-disable */
import React, { useState } from "react";
import SubHeader from "../../../../../../components/DKG_SubHeader";
import data from "../../../../../../utils/frontSharedData/VisualInspection/VI.json";
import FormBody from "../../../../../../components/DKG_FormBody";
import CustomDatePicker from "../../../../../../components/DKG_CustomDatePicker";
import FormDropdownItem from "../../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../../components/DKG_Btn";
import FormContainer from "../../../../../../components/DKG_FormContainer";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { startRollingDuty } from "../../../../../../store/slice/rollingDutySlice";
import { message } from "antd";
import dayjs from "dayjs";

const currentDate = dayjs();
const dateFormat = "DD/MM/YYYY";

const { millList, shiftList, railGradeList } = data;

const railSectionList = [
  {
    key: "60E1",
    value: "60E1",
  },
  {
    key: "IRS52",
    value: "IRS52",
  },
  {
    key: "UIC60",
    value: "UIC60",
  },
  {
    key: "60E1A1",
    value: "60E1A1",
  },
  {
    key: "136RE",
    value: "136RE",
  },
];

const ShiftDetailsForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { dutyId } = useSelector((state) => state.rollingDuty);

  const [formData, setFormData] = useState({
    startDate: currentDate.format(dateFormat),
    shift: null,
    mill: null,
    railGrade: null,
    railSection: null,
  });

  const handleFormSubmit = async () => {
    await dispatch(startRollingDuty(formData)).unwrap();
    navigate("/sms/stage/home");
  };

  const handleChange = (fieldName, value) => {
    console.log("Fieldname: ", fieldName, value)
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  if (dutyId) {
    // message.error("Rolling duty in progress. Cannot start new duty.");
    return <Navigate to="/sms/stage/home" />;
  }

  return (
    <FormContainer>
      <SubHeader title="Stage - Shift Details" link="/" />

      <FormBody initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-x-2">
          <CustomDatePicker
            label="Date"
            name="startDate"
            defaultValue={formData.startDate}
            onChange={handleChange}
            required
            // disabled
          />
          <FormDropdownItem
            label="Shift"
            name="shift"
            formField="shift"
            dropdownArray={shiftList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-x-2">
          <FormDropdownItem
            label="Mill"
            name="mill"
            formField="mill"
            dropdownArray={millList}
            valueField="key"
            visibleField="value"
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
        </div>

        <div className="grid grid-cols-1 gap-x-2">
          <FormDropdownItem
            label="Rail Section"
            name="railSection"
            formField="railSection"
            dropdownArray={railSectionList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
            required
          />
        </div>

        <Btn htmlType="submit" className="flex justify-center mx-auto">
          Start Duty
        </Btn>
      </FormBody>
    </FormContainer>
  );
};

export default ShiftDetailsForm;