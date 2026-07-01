/* eslint-disable */
import React, { useEffect, useState } from "react";
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import FormBody from '../../../../../components/DKG_FormBody';
import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
import { Navigate, useNavigate } from "react-router-dom";
import CustomDatePicker from '../../../../../components/DKG_CustomDatePicker';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import Btn from '../../../../../components/DKG_Btn';
import { useDispatch, useSelector } from "react-redux";
import { message } from 'antd';
import dayjs from "dayjs";
import { startQctDuty } from "../../../../../store/slice/qctDutySlice";

const { shiftList } = data;

const currentDate = dayjs();
const dateFormat = "DD/MM/YYYY";

const QctShiftDetailsForm = () => {
  const dispatch = useDispatch();
  const { dutyId } = useSelector((state) => state.qctDuty);
    const [formData, setFormData] = useState({
        startDate: currentDate.format(dateFormat), shift: 'A'
    });
    const navigate = useNavigate();

    const handleChange = (fieldName, value) => {
        setFormData((prev) => {
          return {
            ...prev,
            [fieldName]: value,
          };
        });
    };

    const handleFormSubmit = async () => {
      await dispatch(startQctDuty(formData)).unwrap();
      navigate('/sms/qct/sampleList');
      // message.error("Internal server error. Please contact support.")
    };
    useEffect(() => {
      handleFormSubmit()
    }, [])

    if (dutyId) {
      // message.error("Duty already in progress. Cannot start new duty.");
      return <Navigate to="/sms/qct/sampleList" />;
    }


  return (
    <FormContainer>
      <SubHeader title="QCT - Shift Details" link="/" />
      <FormBody initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-x-2">
          <CustomDatePicker
            label="Date"
            name="startDate"
            defaultValue={formData.startDate}
            onChange={handleChange}
            required
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
        {/* Removed Start Duty button as not required for QCT */}
      </FormBody>
    </FormContainer>
  )
}

export default QctShiftDetailsForm