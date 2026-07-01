/* eslint-disable */
import React, { useState } from "react";
import FormContainer from "../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/weldingInspection/WeldingInspection.json";
import { Divider, Form, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { useSelector } from "react-redux";
import { MICRO } from "../../../../../utils/Constants";
import { apiCall } from "../../../../../utils/CommonFunctions";

const { weldingTestGeneralInfo, deviationList } = data;

const MicroTestDetails = () => {
  const [form] = Form.useForm();
  const { machineNo, jointNo } = useLocation().state;
  const [formData, setFormData] = useState({
    machineNo,
    jointNo,
    testType: MICRO,
    isMicroFree: null,
    isMicroFreeDesc: null,
    isAstmCoarser: null,
    isAstmCoarserDesc: null,
    remarks: null
  });
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const weldingGeneralInfo = useSelector((state) => state.weldingDuty);

  const handleSelectChange = (value, key) => {
    const updatedData = info.map((row) => {
      if (row.key === key) {
        return { ...row, deviation: value, deviationSec: value };
      }
      return row;
    });
    setInfo(updatedData);
  };

  const [info, setInfo] = useState([
    {
      key: "1",
      testParameter: "Is Microstructure free from Martensite and Bainite",
      deviation: (
        <FormDropdownItem
          name="deviation"
          placeholder="Select deviation"
          dropdownArray={deviationList}
          visibleField="value"
          valueField="key"
          onChange={handleSelectChange}
          required
        />
      ),
    },
    {
      key: "2",
      testParameter: "Is ASTM Grain Size not coarser than 4 at 100 X",
      deviation: (
        <FormDropdownItem
          name="deviationSec"
          placeholder="Select deviation"
          dropdownArray={deviationList}
          visibleField="value"
          valueField="key"
          onChange={handleSelectChange}
          required
        />
      ),
    },
  ]);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev };
      updatedData[fieldName] = value;
      if (fieldName === "isMicroFree" || fieldName === "isAstmCoarser") {
        updatedData[`${fieldName}Desc`] = value ? "Yes" : "No";
      }
      return updatedData;
    });
  };

  const handleFormSubmit = async () => {

    try{
      await apiCall("POST", "/welding/saveMicro", token, {...formData, dutyId: weldingGeneralInfo.dutyId});
      message.success("Data saved successfully.");
      navigate("/sms/welding/testSample");
    }catch(err){}
  };

  return (
    <FormContainer>
      <SubHeader
        title="Weld Period Testing Details - Micro"
        link="/welding/testSample"
      />
      <GeneralInfo data={weldingTestGeneralInfo} />

      <Form
        form={form}
        layout="vertical"
        initialValues={formData}
        onFinish={handleFormSubmit}
      >
        <div className="grid grid-cols-1 gap-x-2">
          <FormInputItem
            label="Machine Number"
            name="machineNo"
            onChange={handleChange}
            disabled
          />
        </div>

        <div className="border grid grid-cols-4 divide-x divide-y divide-gray-300">
          <h3 className="font-semibold p-2 text-center col-span-3">
            Test Parameter
          </h3>
          <h3 className="font-semibold p-2 text-center">Deviation</h3>

          <h3 className="p-2 col-span-3">
            Is Microstructure free from Martensite and Bainite
          </h3>
          <FormDropdownItem
            className="no-border"
            name="isMicroFreeDesc"
            formField="isMicroFree"
            dropdownArray={deviationList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
          />

          <h3 className="p-2 col-span-3">
            Is ASTM Grain Size not coarser than 4 at 100 X
          </h3>
          <FormDropdownItem
            className="no-border"
            name="isAstmCoarserDesc"
            formField="isAstmCoarser"
            dropdownArray={deviationList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
          />
        </div>

        <Divider />

        <FormInputItem
          label="Remarks"
          name="remarks"
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

export default MicroTestDetails;
