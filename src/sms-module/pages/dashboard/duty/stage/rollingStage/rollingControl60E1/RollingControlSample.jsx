/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";
import FormContainer from "../../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../../components/DKG_GeneralInfo";
import data from "../../../../../../utils/frontSharedData/rollingStage/Stage.json";
import { Divider, Form, message, Modal, TimePicker } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import FormInputItem from "../../../../../../components/DKG_FormInputItem";
import FormDropdownItem from "../../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../../components/DKG_Btn";
import { useSelector } from "react-redux";
import { apiCall } from "../../../../../../utils/CommonFunctions";
import dayjs from "dayjs";
import { regexMatch } from "../../../../../../utils/Constants";

const {
  sampleLocationList,
  headList,
  asyList,
  footToeList,
  crownProfileList,
  fishingHeightList,
  footFlatnessList,
} = data;

const RollingControlSample = () => {
  const location = useLocation();
  const { state } = location;

  const heatNo = state?.heatNo || null;
  const sampleNo = state?.sampleNo || null;

  const [form] = Form.useForm();

  const { token } = useSelector((state) => state.auth);
  const rollingGeneralInfo = useSelector((state) => state.rollingDuty);
  const { railSection } = rollingGeneralInfo;

  const [formData, setFormData] = useState({
    sampleNo: "",
    heatNo: null,
    timing: dayjs().format('HH:mm'),
    sampleLocation: null,
    height: null,
    flange: null,
    weight: null,
    web: null,
    head: null,
    asy: null,
    footToe: null,
    crownProfile: null,
    fishingHeight: null,
    footFlatness: null,
    remark: null,
  });

  const [heightRule, setHeightRule] = useState([]);
  const [flangeRule, setFlangeRule] = useState([]);
  const [weightRule, setWeightRule] = useState([]);
  const [webRule, setWebRule] = useState([]);

  const [warningFields, setWarningFields] = useState([]);

  const handleChange = (fieldName, value) => {
    if (fieldName === "sampleNo"){
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }
    
    if (fieldName === "height") {
      const isFloat = regexMatch.floatRegex.test(value);
      if (!isFloat) {
        setHeightRule(
          [
          {
            validator: (_, value) =>
              Promise.reject(new Error("Value must be numeric.")),
          },
        ]
      );
      } else if (isFloat) {
        let floor = null;
        let ceil = null;
        if (railSection === "IRS52") {
          if (value < 155.6 || value > 156.8) {
            floor = 155.6;
            ceil = 156.8;
          }
        } else if (railSection === "60E1") {
          if (value < 171.4 || value > 172.6) {
            floor = 171.4;
            ceil = 172.6;
          }
        } else if (railSection === "60E1A1") {
          if (value < 133.3 || value > 134.7) {
            floor = 133.3;
            ceil = 134.7;
          }
        } else if (railSection === "UIC60") {
          if (value < 171.6 || value > 172.8) {
            floor = 171.6;
            ceil = 172.8;
          }
        }

        if (ceil && floor) {
          // setHeightRule([
          //   {
          //     validator: (_, value) =>
          //       Promise.reject(
          //         new Error(`Value must be in the range of ${floor} - ${ceil}`)
          //       ),
          //   },
          // ]);

          setHeightRule([])
          message.warning(`Value must be in the range of ${floor} - ${ceil}`)
          setWarningFields(prev => {
            const prevList = prev;
            if (!prevList?.includes(fieldName)) {
              return [...prevList, fieldName];
            }
            return prev;
          })

        }
        else {
          setHeightRule([]);
          setWarningFields(prev => {
            const prevList = prev;
            if (prevList?.includes(fieldName)) {
              return prevList?.filter(item => item !== fieldName);
            }
            return prev
          })
        }
      } 
    } else if (fieldName === "flange") {
      const isFloat = regexMatch.floatRegex.test(value);
      if (!isFloat) {
        setFlangeRule([
          {
            validator: (_, value) =>
              Promise.reject(new Error("Value must be numeric.")),
          },
        ]);
      } else {
        let ceil = null;
        let floor = null;
        if (railSection === "60E1") {
          if (value < 149.0 || value > 151.0) {
            floor = 149.0;
            ceil = 151.0;
          }
        } else if (railSection === "IRS52") {
          if (value < 135.0 || value > 137.0) {
            floor = 135.0;
            ceil = 137.0;
          }
        } else if (railSection === "60E1A1") {
          if (value < 139.0 || value > 141.0) {
            floor = 139.0;
            ceil = 141.0;
          }
        } else if (railSection === "UIC60") {
          if (value < 149.0 || value > 151.2) {
            floor = 149.0;
            ceil = 151.2;
          }
        }

        if (ceil && floor) {
          // setFlangeRule([
          //   {
          //     validator: (_, value) =>
          //       Promise.reject(
          //         new Error(`Value must be in the range of ${floor} - ${ceil}`)
          //       ),
          //   },
          // ]);
          setFlangeRule([]);
          message.warning(`Value must be in the range of ${floor} - ${ceil}`)
          setWarningFields(prev => {
            const prevList = prev;
            if (!prevList?.includes(fieldName)) {
              return [...prevList, fieldName];
            }
            return prev
          })
        } else {
          setFlangeRule([]);
          setWarningFields(prev => {
            const prevList = prev;
            if (prevList?.includes(fieldName)) {
              return prevList.filter(item => item!== fieldName);
            }
            return prev;
          })
        }
      }
    } else if (fieldName === "weight") {
      const isFloat = regexMatch.floatRegex.test(value);
      if (!isFloat) {
        setWeightRule([
          {
            validator: (_, value) =>
              Promise.reject(new Error("Value must be numeric.")),
          },
        ]);
      } else {
        let ceil = null;
        let floor = null;

        if (railSection === "IRS52") {
          if (value < 51.63055 || value > 52.66835) {
            floor = 51.63055;
            ceil = 52.66835;
          }
          // updated the weight according to crio in 601E
        } else if (railSection === "60E1") {
          if (value < 59.90895 || value > 61.11315) {
            floor = 59.90895;
            ceil = 61.11315;
          }
        } else if (railSection === "60E1A1") {
          if (value < 72.60515 || value > 74.06455) {
            floor = 72.60515;
            ceil = 74.06455;
          }
        } else if (railSection === "UIC60") {
          if (value < 60.038 || value > 61.245) {
            floor = 60.038;
            ceil = 61.245;
          }
        }

        if (floor && ceil) {
          // setWeightRule([
          //   {
          //     validator: (_, value) =>
          //       Promise.reject(
          //         new Error(`Value must be in the range of ${floor} - ${ceil}`)
          //       ),
          //   },
          // ]);
          setWeightRule([]);
          message.warning(`Value must be in the range of ${floor} - ${ceil}`)
          setWarningFields(prev => {
            const prevList = prev;
            if (!prevList?.includes(fieldName)) {
              return [...prevList, fieldName];
            }
            return prev
          })
        } else {
          setWeightRule([]);
          setWarningFields(prev => {
            const prevList = prev;
            if (prevList?.includes(fieldName)) {
              return prevList.filter(item => item!== fieldName);
            }
            return prev;
          })
        }
      }
    } else if (fieldName === "web") {
      const isFloat = regexMatch.floatRegex.test(value);
      if(!isFloat){
        setWebRule([
          {
            validator: (_, value) =>
              Promise.reject(new Error("Value must be numeric.")),
          },
        ]);
      }
      else {
        let ceil = null;
        let floor = null;

        if (railSection === "IRS52") {
          if (value < 15.0 || value > 16.5) {
            floor = 15.0;
            ceil = 16.5;
          }
        } else if (railSection === "60E1") {
          if (value < 16.0 || value > 17.5) {
            floor = 16.0;
            ceil = 17.5;
          }
        } else if (railSection === "60E1A1") {
          if (value < 43.3 || value > 44.7) {
            floor = 43.3;
            ceil = 44.7;
          }
        } else if (railSection === "UIC60") {
          if (value < 16.0 || value > 17.5) {
            floor = 16.0;
            ceil = 17.5;
          }
        }

        if (floor && ceil) {
          // setWebRule([
          //   {
          //     validator: (_, value) =>
          //       Promise.reject(
          //         new Error(`Value must be in the range of ${floor} - ${ceil}`)
          //       ),
          //   },
          // ]);

          setWebRule([]);
          message.warning(`Value must be in the range of ${floor} - ${ceil}`)
          setWarningFields(prev => {
            const prevList = prev;
            if (!prevList?.includes(fieldName)) {
              return [...prevList, fieldName];
            }
            return prev
          })
        } else {
          setWebRule([]);
          setWarningFields(prev => {
            const prevList = prev;
            if (prevList?.includes(fieldName)) {
              return prevList.filter(item => item!== fieldName);
            }
            return prev;
          })
        }
      }
    }
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleFormSubmitUtil = () => {
    if(warningFields?.length){
      setIsOpen(true)
      return
    }

    handleFormSubmit();
  }

  const handleFormSubmit = async () => {
    try {
      const payload = {
        ...formData,
        heatNo: String(formData.heatNo).padStart(6, "0"),
        dutyId: rollingGeneralInfo.dutyId,
      };

      // Check if this is an edit operation (heatNo and sampleNo exist in navigation state)
      const isEditMode = state?.heatNo && state?.sampleNo;

      if (isEditMode) {
        // For edit mode: delete the existing record first, then create new one
        console.log("Edit mode detected - updating existing record");

        // Delete existing record
        await apiCall("POST", "/rolling/deleteControlHeat", token, {
          heatNo: String(state.heatNo).padStart(6, "0"),
          sampleNo: state.sampleNo,
        });

        // Create new record with updated data
        await apiCall("POST", "/rolling/saveControlHeat", token, payload);
        message.success("Data updated successfully");
      } else {
        // For create mode: directly save new record
        console.log("Create mode - saving new record");
        await apiCall("POST", "/rolling/saveControlHeat", token, payload);
        message.success("Data saved successfully");
      }

      localStorage.setItem("lastSampleNo", formData.sampleNo);
      navigate("/sms/stage/rollingControl");
    } catch (error) {}
  };

  useEffect(() => {
    const lastSampleNo = localStorage.getItem("lastSampleNo");
    if (!sampleNo) {
      if (lastSampleNo) {
        setFormData((prev) => ({
          ...prev,
          sampleNo: parseInt(lastSampleNo, 10) + 1,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          sampleNo: 1,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // console.log("Height rule: ", heightRule);
  // console.log("Flange rule: ", flangeRule);

  // Function to get tolerance range for height based on rail section
  const getHeightTolerance = () => {
    if (railSection === "IRS52") {
      return { floor: 155.6, ceil: 156.8 };
    } else if (railSection === "60E1") {
      return { floor: 171.4, ceil: 172.6 };
    } else if (railSection === "60E1A1") {
      return { floor: 133.3, ceil: 134.7 };
    } else if (railSection === "UIC60") {
      return { floor: 171.6, ceil: 172.8 };
    }
    return null;
  };

  // Function to get tolerance range for flange based on rail section
  const getFlangeTolerance = () => {
    if (railSection === "60E1") {
      return { floor: 149.0, ceil: 151.0 };
    } else if (railSection === "IRS52") {
      return { floor: 135.0, ceil: 137.0 };
    } else if (railSection === "60E1A1") {
      return { floor: 139.0, ceil: 141.0 };
    } else if (railSection === "UIC60") {
      return { floor: 149.0, ceil: 151.2 };
    }
    return null;
  };

  // Function to get tolerance range for weight based on rail section
  const getWeightTolerance = () => {
    if (railSection === "IRS52") {
      return { floor: 51.63055, ceil: 52.66835 };
    } else if (railSection === "60E1") {
      return { floor: 59.90895, ceil: 61.11315 };
    } else if (railSection === "60E1A1") {
      return { floor: 72.60515, ceil: 74.06455 };
    } else if (railSection === "UIC60") {
      return { floor: 60.038, ceil: 61.245 };
    }
    return null;
  };

  // Function to get tolerance range for web based on rail section
  const getWebTolerance = () => {
    if (railSection === "IRS52") {
      return { floor: 15.0, ceil: 16.5 };
    } else if (railSection === "60E1") {
      return { floor: 16.0, ceil: 17.5 };
    } else if (railSection === "60E1A1") {
      return { floor: 43.3, ceil: 44.7 };
    } else if (railSection === "UIC60") {
      return { floor: 16.0, ceil: 17.5 };
    }
    return null;
  };



  // Function to validate tolerance for a specific field
  const validateToleranceForField = (value, toleranceData) => {
    if (!value || !toleranceData) return false;

    const isFloat = regexMatch.floatRegex.test(value);
    if (!isFloat) return false;

    const numValue = parseFloat(value);
    const floor = parseFloat(toleranceData.floor);
    const ceil = parseFloat(toleranceData.ceil);

    return numValue < floor || numValue > ceil;
  };

  // Function to validate all tolerance fields and update warningFields
  const validateAllToleranceFields = (data) => {
    const newWarningFields = [];

    // Validate Height
    const heightTolerance = getHeightTolerance();
    if (data.height && heightTolerance) {
      if (validateToleranceForField(data.height, heightTolerance)) {
        newWarningFields.push('height');
      }
    }

    // Validate Flange
    const flangeTolerance = getFlangeTolerance();
    if (data.flange && flangeTolerance) {
      if (validateToleranceForField(data.flange, flangeTolerance)) {
        newWarningFields.push('flange');
      }
    }

    // Validate Weight
    const weightTolerance = getWeightTolerance();
    if (data.weight && weightTolerance) {
      if (validateToleranceForField(data.weight, weightTolerance)) {
        newWarningFields.push('weight');
      }
    }

    // Validate Web
    const webTolerance = getWebTolerance();
    if (data.web && webTolerance) {
      if (validateToleranceForField(data.web, webTolerance)) {
        newWarningFields.push('web');
      }
    }

    setWarningFields(newWarningFields);
    console.log("Tolerance validation on load - Warning fields:", newWarningFields);
  };

  const handleDtlSearch = useCallback(
    async (heatNo, sampleNo) => {
      try {
        const { data } = await apiCall(
          "POST",
          "/rolling/getControlSampleDtls",
          token,
          { heatNo, sampleNo }
        );

        const { responseData } = data;

        const formDataToSet = {
          sampleNo: responseData?.sampleNo,
          heatNo: responseData?.heatNo,
          timing: responseData?.timing,
          sampleLocation: responseData?.sampleLocation,
          height: responseData?.height,
          flange: responseData?.flange,
          weight: responseData?.weight,
          web: responseData?.web,
          head: responseData?.head,
          asy: responseData?.asy,
          footToe: responseData?.footToe,
          crownProfile: responseData?.crownProfile,
          fishingHeight: responseData?.fishingHeight,
          footFlatness: responseData?.footFlatness,
          remark: responseData?.remark,
        };

        setFormData(formDataToSet);

        // Validate tolerance fields after loading data (with a small delay to ensure tolerance data is loaded)
        setTimeout(() => {
          validateAllToleranceFields(formDataToSet);
        }, 200);
      } catch (error) {}
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, railSection]
  );

  const handleTimingChange = (time, timeString) => {
    if (time) {
      // Directly use timeString because it's already in the correct format
      setFormData((prev) => ({ ...prev, timing: timeString }));
    } else {
      // Handle cleared picker
      setFormData((prev) => ({ ...prev, timing: null }));
    }
  };

  const timingDayJs = formData.timing
    ? dayjs(formData.timing, "HH:mm")
    : null;

  useEffect(() => {
    form.setFieldsValue({ ...formData, timingDayJs });
  }, [formData, form, timingDayJs]);

  useEffect(() => {
    if (heatNo && sampleNo) {
      handleDtlSearch(heatNo, sampleNo);
    }
  }, [heatNo, sampleNo, handleDtlSearch]);

  return (
    <FormContainer>
      <style>
        {`
          .out-of-tolerance .ant-input {
            color: #ff4d4f !important;
            border-color: #ff4d4f !important;
          }
          .out-of-tolerance .ant-input:focus {
            border-color: #ff4d4f !important;
            box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
          }
          .out-of-tolerance .ant-input:hover {
            border-color: #ff4d4f !important;
          }
          .out-of-tolerance .ant-form-item-label > label {
            color: #ff4d4f !important;
          }
        `}
      </style>
      <SubHeader
        title={`Rolling Control Sample Dimensions - ${railSection}`}
        link="/stage/rollingControl"
      />
      <GeneralInfo data={rollingGeneralInfo} />

      <Form
        initialValues={{ ...formData, timingDayJs }}
        onFinish={handleFormSubmitUtil}
        form={form}
        layout="vertical"
      >
        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem
            label="Sample No."
            name="sampleNo"
            value={formData.sampleNo}
            onChange={handleChange}
          />
          <FormInputItem
            label="Heat No."
            name="heatNo"
            value={formData.heatNumber}
            onChange={handleChange}
            required
          />

          <Form.Item
            label="Select Time"
            name="timingDayJs"
            rules={[{ required: true, message: "Please select a time!" }]}
          >
            <TimePicker
              onChange={handleTimingChange}
              format="HH:mm"
              placeholder="Select Time"
              className="w-full"
            />
          </Form.Item>
          <FormDropdownItem
            label="Sample Location"
            name="sampleLocation"
            formField="sampleLocation"
            dropdownArray={sampleLocationList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
            required
          />
        </div>

        <Divider className="mt-0 mb-4" />

        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem
            label="Height"
            name="height"
            rules={heightRule}
            onChange={handleChange}
            required
            className={warningFields.includes('height') ? 'out-of-tolerance' : ''}
          />
          <FormInputItem
            label="Flange"
            name="flange"
            rules={flangeRule}
            onChange={handleChange}
            required
            className={warningFields.includes('flange') ? 'out-of-tolerance' : ''}
          />

          <FormInputItem
            label="Weight"
            name="weight"
            onChange={handleChange}
            rules={weightRule}
            className={warningFields.includes('weight') ? 'out-of-tolerance' : ''}
          />
          <FormInputItem
            label="Web (mm)"
            name="web"
            rules={webRule}
            onChange={handleChange}
            required
            className={warningFields.includes('web') ? 'out-of-tolerance' : ''}
          />
          <FormDropdownItem
            label="Head"
            name="head"
            formField="head"
            dropdownArray={headList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
            required
          />

          {railSection !== "60E1A1" && (
            <FormDropdownItem
              label="Asy"
              name="asy"
              formField="asy"
              dropdownArray={asyList}
              visibleField="value"
              valueField="key"
              onChange={handleChange}
              required
            />
          )}

          {railSection === "60E1" && (
            <FormDropdownItem
              label="Foot Toe"
              name="footToe"
              formField="footToe"
              dropdownArray={footToeList}
              visibleField="value"
              valueField="key"
              onChange={handleChange}
              required
            />
          )}

          {(railSection !== "IRS52" && railSection !== "UIC60") && (
            <>
              <FormDropdownItem
                label="Fishing Height"
                name="fishingHeight"
                formField="fishingHeight"
                dropdownArray={fishingHeightList}
                visibleField="value"
                valueField="key"
                onChange={handleChange}
                required
              />
              <FormDropdownItem
                label="Crown Profile"
                name="crownProfile"
                formField="crownProfile"
                dropdownArray={crownProfileList}
                visibleField="value"
                valueField="key"
                onChange={handleChange}
                required
              />
            </>
          )}
          <FormDropdownItem
            label="Foot Flatness"
            name="footFlatness"
            formField="footFlatness"
            dropdownArray={footFlatnessList}
            visibleField="value"
            valueField="key"
            onChange={handleChange}
            required
          />
        </div>

        <Divider className="mb-4 mt-0" />

        <FormInputItem
          label="Remarks"
          name="remark"
          onChange={handleChange}
          required
        />

        <Btn htmlType="submit" className="flex justify-center mx-auto">
          Save
        </Btn>
      </Form>

      <Modal
        title="Warning"
        open={isOpen}
        onOk={() => {
          setIsOpen(false);
          handleFormSubmit()
        }}
        onCancel={() => setIsOpen(false)}
        > 

      {warningFields?.length > 0 && (
        <p>
          {warningFields.join(', ')} dont have values in the range. Do you wish to continue?
        </p>
      )}
        
        </Modal>
    </FormContainer>
  );
};

export default RollingControlSample;
