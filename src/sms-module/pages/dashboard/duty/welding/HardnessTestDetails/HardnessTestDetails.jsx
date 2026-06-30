/* eslint-disable */
import React, { useEffect, useState } from "react";
import FormContainer from "../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import { Divider, Form, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import { HARDNESS } from "../../../../../utils/Constants";
import { apiCall } from "../../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";

const HardnessTestDetails = () => {
  const [form] = Form.useForm();
  const { machineNo, jointNo } = useLocation().state;
  const [formData, setFormData] = useState({
    machineNo,
    jointNo,
    testType: HARDNESS,
    remark: null,
    parentHardnessL: null,
    parentHardnessR: null,
    hazHardnessL: null,
    hazHardnessR: null,
    deviationL: null,
    deviationR: null,
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

  const {token} = useSelector(state => state.auth);
  const weldingGeneralInfo = useSelector(state => state.weldingDuty);

  const handleFormSubmit = async () => {
    try{
      await apiCall("POST", "/welding/saveWeldingHardness", token, {...formData, dutyId:weldingGeneralInfo.dutyId})
      message.success("Data saved succesfully.");
      navigate("/sms/welding/testSample");
    }
    catch(error){}
  };

  useEffect(() => {
      form.setFieldsValue(formData);
    }, [form, formData])


  return (
    <FormContainer>
      <SubHeader
        title="Weld Period Testing Details - Hardness"
        link="/welding/testSample"
      />
      <GeneralInfo data={weldingGeneralInfo} />

      <Form form={form} layout="vertical" initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-1 gap-x-2">
          <FormInputItem
            label="Machine Number"
            name="machineNo"
            value={formData.machineNumber}
            onChange={handleChange}
            disabled
          />
        </div>

        {/* <DKG_InteractionTable /> */}

        <div className="border grid grid-cols-4 divide-x divide-y divide-gray-300">
          <h3 className="font-semibold p-2 text-center">Weld Side</h3>
          <h3 className="font-semibold p-2 text-center">Parent Hardness</h3>
          <h3 className="font-semibold p-2 text-center">HAZ Hardness</h3>
          <h3 className="font-semibold p-2 text-center">Deviation</h3>

          <h3 className="font-semibold p-2 text-center">L</h3>
          <FormInputItem className="no-border" name="parentHardnessL" onChange={handleChange} placeholder="0.0" />
          <FormInputItem className="no-border" name="hazHardnessL" onChange={handleChange} placeholder="0.0" />
          <FormInputItem className="no-border" name="deviationL" onChange={handleChange} placeholder="0.0" />

          <h3 className="font-semibold p-2 text-center">R</h3>
          <FormInputItem className="no-border" name="parentHardnessR" onChange={handleChange} placeholder="0.0" />
          <FormInputItem className="no-border" name="hazHardnessR" onChange={handleChange} placeholder="0.0" />
          <FormInputItem className="no-border" name="deviationR" onChange={handleChange} placeholder="0.0" />

        </div>


        <Divider />

        <FormInputItem
          label="Remarks"
          name="remark"
          onChange={handleChange}
          required
        />

        <div className="flex justify-center">
          <Btn htmlType="submit" className="w-36">
            Save
          </Btn>
        </div>
      </Form>
    </FormContainer>
  );
};

export default HardnessTestDetails;
