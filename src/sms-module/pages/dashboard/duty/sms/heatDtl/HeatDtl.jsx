/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Form, message, Divider, Button, Checkbox, Modal } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import FormContainer from "../../../../../components/DKG_FormContainer";
import FormSearchItem from "../../../../../components/DKG_FormSearchItem";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem"; // ✅ Import dropdown component
import { apiCall, handleChange } from "../../../../../utils/CommonFunctions";
import IconBtn from "../../../../../components/DKG_IconBtn";
import { regexMatch } from "../../../../../utils/Constants";
import Btn from "../../../../../components/DKG_Btn";
import { ArrowLeftOutlined } from "@ant-design/icons";


const casterNoDropDownSms2 = [
  {
    key: "M/c IV",
    value: "M/c IV",
  },
  {
    key: "M/c V",
    value: "M/c V",
  },
];
const casterNoDropDownSms3 = [
  {
    key: "CV1",
    value: "CV1",
  },
  {
    key: "CV2",
    value: "CV2",
  },
];


// Witnessed / Verified dropdown options ✅
const wvDropDown = [
  { key: "", value: "Select Input" },
  { key: "Witnessed", value: "Witnessed" },
  { key: "Verified", value: "Verified" },
];

const ladleChemDropDown = [
  {
    key: "Send To Lab",
    value: "Send To Lab",
  },
  {
    key: "Pass",
    value: "Pass",
  },
  {
    key: "Reject",
    value: "Reject",
  },
];

const HeatDtl = () => {
  const { token } = useSelector((state) => state.auth);
  const { dutyId, sms } = useSelector((state) => state.smsDuty);
  const navigate = useNavigate();
  const { state } = useLocation();
  const heatNo = state?.heatNo || null;

  const [divertedHeat, setDivertedHeat] = useState(false);

  const [degVacRule, setDegVacRule] = useState([]);

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  const [currentStage, setCurrentStage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to track out-of-range fields for red highlighting
  const [outOfRangeFields, setOutOfRangeFields] = useState({});
  const [editableStage, setEditableStage] = useState({
    heatProcurementStageCode: null,
    heatSurrenderStageCode: null,
  });

  // Helper function to get CSS class for out-of-range fields
  const getFieldClassName = (fieldName) => {
    return outOfRangeFields[fieldName] ? "out-of-tolerance" : "";
  };

  // Helper function to build heat remark based on latest stage priority
  const buildHeatRemark = (currentData, newFieldValue, fieldName) => {
    const data = { ...currentData, [fieldName]: newFieldValue };

    // Priority order: Latest entered field takes precedence
    // If latest field is out of tolerance, show its rejection
    // If latest field is within tolerance, check other fields in stage order

    // Check the field that was just updated first (latest stage priority)
    if (fieldName === 'oxygen' && data.oxygen && parseFloat(data.oxygen) > 20 && !divertedHeat) {
      return "Rejected for oxygen";
    }

    if (fieldName === 'nitrogen' && data.nitrogen && parseFloat(data.nitrogen) > 0.009 && !divertedHeat) {
      return "Rejected for nitrogen";
    }

    if (fieldName === 'hydris' && data.hydris && parseFloat(data.hydris) > 1.6 && !divertedHeat) {
      return "Rejected for hydrogen";
    }

    // If the latest field is within tolerance, check other fields in reverse stage order
    // (Stage 4 chemicals: nitrogen, oxygen; Stage 3: hydris)

    // Check oxygen first (Stage 4)
    if (data.oxygen && parseFloat(data.oxygen) > 20 && !divertedHeat) {
      return "Rejected for oxygen";
    }

    // Check nitrogen (Stage 4)
    if (data.nitrogen && parseFloat(data.nitrogen) > 0.009 && !divertedHeat) {
      return "Rejected for nitrogen";
    }

    // Check hydrogen/hydris (Stage 3)
    if (data.hydris && parseFloat(data.hydris) > 1.6 && !divertedHeat) {
      return "Rejected for hydrogen";
    }

    // If all chemical values are within acceptable range and we have chemical data, return current remark or empty string
    // This preserves existing heat remark when values are acceptable
    return currentData.heatRemark || "";
  };

  // Helper function to normalize sequence numbers by removing leading zeros
  const normalizeSequenceNumber = (value) => {
    if (!value || typeof value !== 'string') return value;

    // Remove leading zeros but keep at least one digit
    const normalized = value.replace(/^0+/, '') || '0';

    console.log(`Normalizing sequence number: "${value}" → "${normalized}"`);
    return normalized;
  };

  // Custom handler for sequence number fields with normalization
  const handleSequenceNumberChange = (fieldName, value) => {
    const normalizedValue = normalizeSequenceNumber(value);
    handleChange(fieldName, normalizedValue, setFormData);
  };

  // Function to validate all tolerance fields when data is loaded
  const validateAllToleranceFields = (data, isDiverted = divertedHeat) => {
    const newOutOfRangeFields = {};
    let hasOutOfRangeValues = false;

    // Validate Turn Down Temperature (≥ 1630°C)
    // Show red color for ALL heats (including diverted), but only enforce business logic for non-diverted
    if (data.turnDownTemp) {
      const value = parseFloat(data.turnDownTemp);
      if (value < 1630) {
        newOutOfRangeFields.turnDownTemp = true;
        if (!isDiverted) hasOutOfRangeValues = true; // Only count for business logic if not diverted
      }
    }

    // Validate Degassing Duration (≥ 10.0 minutes)
    if (data.degassingDuration) {
      const value = parseFloat(data.degassingDuration);
      if (value < 10) {
        newOutOfRangeFields.degassingDuration = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Degassing Vacuum (< 3.0 mbar)
    if (data.degassingVacuum) {
      const value = parseFloat(data.degassingVacuum);
      if (value > 3) {
        newOutOfRangeFields.degassingVacuum = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Casting Temperature 1 (≥ 1480°C)
    if (data.castingTemp) {
      const value = parseFloat(data.castingTemp);
      if (value < 1480) {
        newOutOfRangeFields.castingTemp = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Casting Temperature 2 (≥ 1480°C)
    if (data.castingTemp2) {
      const value = parseFloat(data.castingTemp2);
      if (value < 1480) {
        newOutOfRangeFields.castingTemp2 = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Hydris (≤ 1.6)
    if (data.hydris) {
      const value = parseFloat(data.hydris);
      if (value > 1.6) {
        newOutOfRangeFields.hydris = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Nitrogen (< 0.009%)
    if (data.nitrogen) {
      const value = parseFloat(data.nitrogen);
      if (value > 0.009) {
        newOutOfRangeFields.nitrogen = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    // Validate Oxygen (≤ 20.0 ppm)
    if (data.oxygen) {
      const value = parseFloat(data.oxygen);
      if (value > 20) {
        newOutOfRangeFields.oxygen = true;
        if (!isDiverted) hasOutOfRangeValues = true;
      }
    }

    setOutOfRangeFields(newOutOfRangeFields);
    setIsOutOfRange(hasOutOfRangeValues);

    console.log("Tolerance validation on data load:", {
      isDiverted: isDiverted,
      outOfRangeFields: newOutOfRangeFields,
      hasOutOfRangeValues,
      loadedData: data
    });
  };

  const stageValidationRules = useMemo(() => ({
    1: ["turnDownTemp", "turnDownTempWv"],
    2: ["degassingVacuum", "degassingVacuumWv", "degassingDuration", "degassingDurationWv"],
    3: ["castingTemp", "castingTemp2", "casterNo", "sequenceNo1", "sequenceNo2", "hydris"],
    4: ["nitrogen", "sentToLadle"],
    5: ["weightOfPrimeBlooms", "weightOfCoBlooms", "weightOfRejectedBlooms", "totalCastWt"],
  }), []);

  // Fetch Procurement & Surrender Stages from /sms/getStageDtl
  const populateEditableStage = useCallback(async () => {
    try {
      const { data } = await apiCall("POST", "/sms/getStageDtl", token, { dutyId, heatNo: heatNo || null });

      setEditableStage({
        heatProcurementStageCode: data?.responseData?.procurementStageCode ?? null,
        heatSurrenderStageCode: data?.responseData?.surrenderStageCode ?? null,
      });
    } catch (error) {
      message.error("Error fetching editable stages.");
    }
  }, [token, heatNo, dutyId]);

  console.log("formDta: ", formData)

  // Determine if a stage should be disabled
  const isFieldDisabled = (stage) => {
    if(divertedHeat) return false;
    if (currentStage > stage) return true;
    const { heatProcurementStageCode, heatSurrenderStageCode } = editableStage;

    if (heatProcurementStageCode === null || heatSurrenderStageCode === null) {
      // If both are null, allow only the current stage to be edited
      return stage !== currentStage;
    }

    return !(stage >= heatProcurementStageCode && stage <= heatSurrenderStageCode);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    const payload = {
      ...formData,
      dutyId,
      // sequenceNo: `${formData.sequenceNo1 || ""}/${formData.sequenceNo2 || ""}`,
      sequenceNo: `${formData.sequenceNo1?.trim() || ""}/${formData.sequenceNo2?.trim() || ""}`,
    };

    // try {
    //   const isStageValid = stageValidationRules[currentStage].every(
    //     (field) => formData[field] !== undefined && formData[field] !== null && formData[field].toString().trim() !== ""
    //   );

    //   if (isStageValid && currentStage < 5) {
    //     await apiCall("POST", "/sms/updateHeatDtls", token, payload);
    //     message.success(`Stage ${currentStage} data saved successfully.`);
    //     // setCurrentStage(currentStage + 1);
    //     setCurrentStage((prev) => prev + 1);
    //   }
    //   else {
    //     message.error(`Please fill all the data for stage ${currentStage}`)
    //   }

    // } catch (error) {
    //   message.error("Failed to save stage data.");
    // }
    try {
        // ✅ DIVERTED HEAT LOGIC: If heat is marked as diverted, allow saving without stage completion validation
        const isDivertedHeat = formData.isDiverted || divertedHeat;

        let isStageValid = true;

        if (!isDivertedHeat) {
            // Normal heat: Validate all required fields for current stage
            isStageValid = stageValidationRules[currentStage].every((field) => {
                const value = formData[field];
                if(formData?.heatRemark === "Reject for hydrogen.") return true
                if(formData?.heatRemark === "Reject for nitrogen.") return true
                if(formData?.heatRemark === "Reject for oxygen.") return true
                if(formData?.heatRemark === "Rejected for chemistry") return true
                if(currentStage === 4 && field === "oxygen") return true
                if(currentStage === 4 && field === "nitrogen") return true
                return  value !== undefined && value !== null && (typeof value === "number" || value.toString().trim() !== "");
            });
        } else {
            // Diverted heat: Allow saving with partial data - no stage validation required
            console.log("Heat is diverted - skipping stage validation, allowing save with partial data");
            isStageValid = true;
        }

        if (isStageValid && currentStage <= 5) {
            await apiCall("POST", "/sms/updateHeatDtls", token, payload);

            if (isDivertedHeat) {
                message.success(`Diverted heat data saved successfully at stage ${currentStage}.`);
            } else {
                message.success(`Stage ${currentStage} data saved successfully.`);
                setCurrentStage((prev) => prev + 1);
            }
            navigate("/sms/sms/heatSummary")
        } else {
            message.error(`Please fill all the data for stage ${currentStage}`);
        }
    } catch (error) {
        message.error("Failed to save stage data.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const [degDurRule, setDegDurRule] = useState([])

  const handleDegDurChange = (fieldName, value) => {
    const isFloat = regexMatch.floatRegex.test(value)

    if (!isFloat) {
      setDegDurRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be numeric.")),

        },
      ]);
    }
    else {
      setDegDurRule([]);
      if (parseFloat(value) < 10 && !divertedHeat) {
        // Use debounced message to prevent spam
        showValidationMessage('degassingDuration', () => {
          message.warning("Value must be greater than or equal to 10.0", 5);
        });

        setFormData((prev) => ({
          ...prev,
          degassingDuration: value,
        }));
        setHeatRemarkDisabled(true);
        setIsOutOfRange(true);
        // Mark field as out of range for red highlighting
        setOutOfRangeFields(prev => ({ ...prev, degassingDuration: true }));
      }
      else {
        // Clear any pending message for this field
        if (validationTimeouts.current['degassingDuration']) {
          clearTimeout(validationTimeouts.current['degassingDuration']);
        }

        setHeatRemarkDisabled(false);
        setFormData((prev) => ({
          ...prev,
          degassingDuration: value,
        }));
        setIsOutOfRange(false);
        // Remove field from out of range highlighting
        setOutOfRangeFields(prev => ({ ...prev, degassingDuration: false }));
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  const [turDowTempRule, setTurDowTempRule] = useState([])

  const handleTurDowTempChange = (fieldName, value) => {
    const isInteger = regexMatch.intRegex.test(value);

    if (!isInteger) {
      setTurDowTempRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be integer.")),

        },
      ]);
    }
    else {
      setTurDowTempRule([]);
      if (parseFloat(value) < 1630 && !divertedHeat) {
        // Use debounced message to prevent spam
        showValidationMessage('turnDownTemp', () => {
          message.warning("Value must be greater than or equal to 1630", 5);
        });

        setFormData((prev) => ({
          ...prev,
          turnDownTemp: value,
        }));
        setIsOutOfRange(true);
        // Mark field as out of range for red highlighting
        setOutOfRangeFields(prev => ({ ...prev, turnDownTemp: true }));
      }
      else {
        // Clear any pending message for this field
        if (validationTimeouts.current['turnDownTemp']) {
          clearTimeout(validationTimeouts.current['turnDownTemp']);
        }

        setFormData((prev) => ({
          ...prev,
          turnDownTemp: value,
        }));

        // Remove field from out of range highlighting
        setOutOfRangeFields(prev => {
          const updated = { ...prev, turnDownTemp: false };
          // Only set isOutOfRange to false if NO fields are out of range
          const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
          setIsOutOfRange(hasAnyOutOfRange);
          return updated;
        });
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  const [hydrisRuleObj, setHydrisRuleObj] = useState([]);

  const [heatRemarkDisabled, setHeatRemarkDisabled] = useState(false);

  const [isOutOfRange, setIsOutOfRange] = useState(false);

  const handleHydrisChange = (fieldName, value) => {
    const isFloat = regexMatch.floatRegex.test(value);

    if (!isFloat) {
      setHydrisRuleObj([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be numeric.")),
        },
      ]);
      // Only update the hydris value for invalid input
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    } else {
      setHydrisRuleObj([]);

      // Build comprehensive heat remark considering all chemical values
      const newHeatRemark = buildHeatRemark(formData, value, fieldName);
      const isHydrisOutOfRange = parseFloat(value) > 1.6 && !divertedHeat;

      if (isHydrisOutOfRange) {
        console.log("Hydris out of range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Use debounced message to prevent spam
        showValidationMessage('hydris', () => {
          message.warning("Value must be smaller or equal to 1.6", 5);
        });
      } else {
        console.log("Hydris within range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Clear any pending message for this field
        if (validationTimeouts.current['hydris']) {
          clearTimeout(validationTimeouts.current['hydris']);
        }
      }

      // Update form data with comprehensive heat remark
      setFormData((prev) => ({
        ...prev,
        heatRemark: newHeatRemark,
        hydris: value,
      }));

      // Set heat remark disabled state based on any rejection
      setHeatRemarkDisabled(!!newHeatRemark);

      // Update out of range fields
      setOutOfRangeFields(prev => {
        const updated = { ...prev, hydris: isHydrisOutOfRange };
        // Check if any field is out of range
        const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
        setIsOutOfRange(hasAnyOutOfRange);
        return updated;
      });
    }
  };

  const [nitrogenRule, setNitrogenRule] = useState([]);

  const handleNitrogenChange = (fieldName, value) => {
    const isFloat = regexMatch.floatRegex.test(value);

    if (!isFloat) {
      setNitrogenRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be numeric.")),
        },
      ]);
      // Only update the nitrogen value for invalid input
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    }
    else {
      setNitrogenRule([]);

      // Build comprehensive heat remark considering all chemical values
      const newHeatRemark = buildHeatRemark(formData, value, fieldName);
      const isNitrogenOutOfRange = parseFloat(value) > 0.009 && !divertedHeat;

      if (isNitrogenOutOfRange) {
        console.log("Nitrogen out of range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Use debounced message to prevent spam
        showValidationMessage('nitrogen', () => {
          message.warning("Value must be less than 0.009", 5);
        });
      } else {
        console.log("Nitrogen within range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Clear any pending message for this field
        if (validationTimeouts.current['nitrogen']) {
          clearTimeout(validationTimeouts.current['nitrogen']);
        }
      }

      // Update form data with comprehensive heat remark
      setFormData((prev) => ({
        ...prev,
        heatRemark: newHeatRemark,
        nitrogen: value,
      }));

      // Set heat remark disabled state based on any rejection
      setHeatRemarkDisabled(!!newHeatRemark);

      // Update out of range fields
      setOutOfRangeFields(prev => {
        const updated = { ...prev, nitrogen: isNitrogenOutOfRange };
        // Check if any field is out of range
        const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
        setIsOutOfRange(hasAnyOutOfRange);
        return updated;
      });
    }
  }

  const [oxygenRule, setOxygenRule] = useState([]);

  const csVal =
  sms === "SMS 3" && (formData.casterNo === "CV1" || formData.casterNo === "CV2")
    ? 0.1005
    : sms === "SMS 2" && formData.casterNo === "M/c IV"
      ? 0.1088
      : sms === "SMS 2" && formData.casterNo === "M/c V"
        ? 0.102
        : null;

  const handleOxygenChange = (fieldName, value) => {
    // Treat empty input as null (oxygen is optional)
    if (value === null || (typeof value === 'string' && value.trim() === '')) {
      setOxygenRule([]);

      // Clear any pending message for this field
      if (validationTimeouts.current['oxygen']) {
        clearTimeout(validationTimeouts.current['oxygen']);
      }

      const newHeatRemark = buildHeatRemark(formData, null, fieldName);

      setFormData((prev) => ({
        ...prev,
        heatRemark: newHeatRemark,
        [fieldName]: null,
      }));

      setHeatRemarkDisabled(!!newHeatRemark);

      setOutOfRangeFields(prev => {
        const updated = { ...prev, oxygen: false };
        const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
        setIsOutOfRange(hasAnyOutOfRange);
        return updated;
      });
      return;
    }

    const isFloat = regexMatch.floatRegex.test(value)

    if (!isFloat) {
      setOxygenRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be numeric.")),
        },
      ]);
      // Only update the oxygen value for invalid input
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
    }
    else {
      setOxygenRule([]);

      // Build comprehensive heat remark considering all chemical values
      const newHeatRemark = buildHeatRemark(formData, value, fieldName);
      const isOxygenOutOfRange = parseFloat(value) > 20 && !divertedHeat;

      if (isOxygenOutOfRange) {
        console.log("Oxygen out of range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Use debounced message to prevent spam
        showValidationMessage('oxygen', () => {
          message.warning("Value must be less than or equal to 20.0", 5);
        });
      } else {
        console.log("Oxygen within range:", value, "building comprehensive heat remark:", newHeatRemark);

        // Clear any pending message for this field
        if (validationTimeouts.current['oxygen']) {
          clearTimeout(validationTimeouts.current['oxygen']);
        }
      }

      // Update form data with comprehensive heat remark
      setFormData((prev) => ({
        ...prev,
        heatRemark: newHeatRemark,
        oxygen: value,
      }));

      // Set heat remark disabled state based on any rejection
      setHeatRemarkDisabled(!!newHeatRemark);

      // Update out of range fields
      setOutOfRangeFields(prev => {
        const updated = { ...prev, oxygen: isOxygenOutOfRange };
        // Check if any field is out of range
        const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
        setIsOutOfRange(hasAnyOutOfRange);
        return updated;
      });
    }
  }

  const handleHeatNoSearch = useCallback(async (heatNo = null) => {
    try {
      const { data } = await apiCall(
        "GET",
        `/sms/getHeatDtls?heatNo=${heatNo || formData.heatNo}&dutyId=${dutyId}`,
        token
      );

      const loadedData = {
        ...data.responseData,
        heatNo: heatNo,
        sequenceNo1: data?.responseData?.sequenceNo?.split("/")?.[0] || null,
        sequenceNo2: data?.responseData?.sequenceNo?.split("/")?.[1] || null,
      } || {};

      setFormData(loadedData);
      setDivertedHeat(data?.responseData?.isDiverted);

      // Validate tolerance fields for loaded data (pass diverted status directly)
      validateAllToleranceFields(loadedData, data?.responseData?.isDiverted);

      // Fetch Procurement & Surrender Stages
      await populateEditableStage();

      // ✅ Fix: Correctly determine last saved stage
      let lastSavedStage = 1;
      for (let stage = 1; stage <= 5; stage++) {
        const isStageComplete = stageValidationRules[stage].every(
          (field) => {
            if (field !== "sequenceNo1" && field !== "sequenceNo2") {
              return data.responseData?.[field]
            }
            return data?.responseData?.sequenceNo?.split("/").length === 2;
          } // ✅ Ensures all fields are filled
        );

        if (isStageComplete) {
          lastSavedStage = stage + 1; // Move to next stage
        } else {
          break; // Stop at the first incomplete stage
        }

      }

      // ✅ DIVERTED HEAT LOGIC: If heat is diverted, don't show stages beyond the current stage
      if (data?.responseData?.isDiverted) {
        // Find the highest stage that has complete data (this is where heat was diverted)
        let divertedAtStage = 1;
        for (let stage = 1; stage <= 5; stage++) {
          const isStageComplete = stageValidationRules[stage].every(
            (field) => {
              if (field !== "sequenceNo1" && field !== "sequenceNo2") {
                return data.responseData?.[field] !== null && data.responseData?.[field] !== undefined;
              }
              return data?.responseData?.sequenceNo?.split("/").length === 2;
            }
          );
          if (isStageComplete) {
            divertedAtStage = stage;
          } else {
            // If stage is not complete, check if it has any data (partially filled)
            const hasPartialData = stageValidationRules[stage].some(
              (field) => {
                if (field !== "sequenceNo1" && field !== "sequenceNo2") {
                  return data.responseData?.[field] !== null && data.responseData?.[field] !== undefined;
                }
                return data?.responseData?.sequenceNo?.split("/").length === 2;
              }
            );
            if (hasPartialData) {
              divertedAtStage = stage; // Heat was diverted while filling this stage
            }
            break; // Stop at first incomplete stage
          }
        }

        // Limit currentStage to the diverted stage (allow editing the diverted stage)
        lastSavedStage = divertedAtStage;
        console.log(`Heat is diverted at stage ${divertedAtStage}, limiting currentStage to ${lastSavedStage}`);
      }

      // ✅ Prevent opening non-existent stage
      setCurrentStage(lastSavedStage > 5 ? 5 : lastSavedStage);
    } catch (error) {
      message.error("Error fetching heat details.");
    }
  }, [token, formData.heatNo, dutyId, stageValidationRules, populateEditableStage]);

  const [castTempRule, setCastTempRule] = useState([])

  const handleCastTempChange = (fieldName, value) => {
    const isInteger = regexMatch.intRegex.test(value);

    if (!isInteger) {
      setCastTempRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be integer.")),

        },
      ]);
    }
    else {
      setCastTempRule([]);
      if (parseFloat(value) < 1480 && !divertedHeat) {
        console.log("castingTemp out of range:", value, "setting isOutOfRange to true");
        // Use debounced message to prevent spam
        showValidationMessage('castingTemp', () => {
          message.warning("Value must be greater than or equal to 1480", 5);
        });

        setFormData((prev) => ({
          ...prev,
          castingTemp: value,
        }));
        setIsOutOfRange(true);
        // Mark field as out of range for red highlighting
        setOutOfRangeFields(prev => ({ ...prev, castingTemp: true }));
      }
      else {
        // Clear any pending message for this field
        if (validationTimeouts.current['castingTemp']) {
          clearTimeout(validationTimeouts.current['castingTemp']);
        }

        setFormData((prev) => ({
          ...prev,
          castingTemp: value,
        }));

        // Remove field from out of range highlighting
        setOutOfRangeFields(prev => {
          const updated = { ...prev, castingTemp: false };
          // Only set isOutOfRange to false if NO fields are out of range
          const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
          setIsOutOfRange(hasAnyOutOfRange);
          return updated;
        });
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  const [castTemp2Rule, setCastTemp2Rule] = useState([])

  const handleCastTemp2Change = (fieldName, value) => {
    const isInteger = regexMatch.intRegex.test(value);

    if (!isInteger) {
      setCastTemp2Rule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be integer.")),

        },
      ]);
    }
    else {
      setCastTemp2Rule([]);
      if (parseFloat(value) < 1480 && !divertedHeat) {
        // Use debounced message to prevent spam
        showValidationMessage('castingTemp2', () => {
          message.warning("Value must be greater than or equal to 1480", 5);
        });

        setFormData((prev) => ({
          ...prev,
          castingTemp2: value,
        }));
        setIsOutOfRange(true);
        // Mark field as out of range for red highlighting
        setOutOfRangeFields(prev => ({ ...prev, castingTemp2: true }));
      }
      else {
        // Clear any pending message for this field
        if (validationTimeouts.current['castingTemp2']) {
          clearTimeout(validationTimeouts.current['castingTemp2']);
        }

        setFormData((prev) => ({
          ...prev,
          castingTemp2: value,
        }));

        // Remove field from out of range highlighting
        setOutOfRangeFields(prev => {
          const updated = { ...prev, castingTemp2: false };
          // Only set isOutOfRange to false if NO fields are out of range
          const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
          setIsOutOfRange(hasAnyOutOfRange);
          return updated;
        });
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  const onFinish = () => {
    console.log("onFinish called - isOutOfRange:", isOutOfRange);
    console.log("onFinish called - outOfRangeFields:", outOfRangeFields);
    console.log("onFinish called - heatRemark:", formData.heatRemark);

    if(formData.heatRemark === "Reject for hydrogen." ||
       formData.heatRemark === "Reject for nitrogen." ||
       formData.heatRemark === "Reject for oxygen." ||
       formData.heatRemark === "Rejected for chemistry"){
      handleSave()
    }
    else if (isOutOfRange) {
      Modal.confirm({
        title: "Warning",
        content: "You are saving some values outside the range, are you sure to continue?",
        onOk: handleSave
      });
    }
    else {
      handleSave()
    }
  }

  const [showLabCheckbox, setShowLabCheckbox] = useState(false);

  const handleChemChange = (fieldName, value) => {
    console.log("Ladle Chemistry changed:", fieldName, "=", value);

    if (value === "Send To Lab") {
      setShowLabCheckbox(true);
    } else {
      setShowLabCheckbox(false);
    }

    // ✅ CHEMISTRY LOGIC: Handle heat remark based on Ladle Chemistry value
    let newHeatRemark = formData.heatRemark;
    let shouldDisableHeatRemark = false;

    if (value === "Reject" && !divertedHeat) {
      newHeatRemark = "Rejected for chemistry";
      shouldDisableHeatRemark = true;
      console.log("Ladle Chemistry rejected - setting heat remark to 'Rejected for chemistry'");
    } else if (value === "Pass") {
      // When chemistry passes, check if there are other chemical rejections
      const hasOxygenRejection = formData.oxygen && parseFloat(formData.oxygen) > 20 && !divertedHeat;
      const hasNitrogenRejection = formData.nitrogen && parseFloat(formData.nitrogen) > 0.009 && !divertedHeat;
      const hasHydrisRejection = formData.hydris && parseFloat(formData.hydris) > 1.6 && !divertedHeat;

      if (hasOxygenRejection) {
        newHeatRemark = "Rejected for oxygen";
        shouldDisableHeatRemark = true;
      } else if (hasNitrogenRejection) {
        newHeatRemark = "Rejected for nitrogen";
        shouldDisableHeatRemark = true;
      } else if (hasHydrisRejection) {
        newHeatRemark = "Rejected for hydrogen";
        shouldDisableHeatRemark = true;
      } else {
        // All chemistry values are acceptable
        // Clear chemistry rejection remarks but keep other remarks
        if (formData.heatRemark === "Rejected for chemistry") {
          newHeatRemark = ""; // Clear chemistry rejection
        } else {
          newHeatRemark = formData.heatRemark; // Keep existing non-chemistry remark
        }
        shouldDisableHeatRemark = false;
      }
      console.log("Ladle Chemistry passed - heat remark:", newHeatRemark);
    } else if (value === "Send To Lab") {
      // When sent to lab, keep existing remark unless it's a chemistry rejection
      if (formData.heatRemark === "Rejected for chemistry") {
        newHeatRemark = ""; // Clear chemistry rejection when sent to lab
      } else {
        newHeatRemark = formData.heatRemark; // Keep existing remark
      }
      shouldDisableHeatRemark = false;
      console.log("Ladle Chemistry sent to lab - heat remark:", newHeatRemark);
    }

    setHeatRemarkDisabled(shouldDisableHeatRemark);

    // Update form data with new chemistry value and heat remark
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
      heatRemark: newHeatRemark,
    }));

    console.log("Updated formData with heatRemark:", newHeatRemark);
  };


  const [primeBloomsFieldState, setPrimeBloomsFieldState] = useState({
    noOfPrimeBlooms: false,
    primeBloomsLength: false,
    primeBloomsTotalLength: false,
  });

  const [coBloomsFieldState, setCoBloomsFieldState] = useState({
    noOfCoBlooms: false,
    coBloomsLength: false,
    coBloomsTotalLength: false,
  });

  const [rejectedBloomsFieldState, setRejectedBloomsFieldState] = useState({
    noOfRejectedBlooms: false,
    rejectedBloomsLength: false,
    rejectedBloomsTotalLength: false,
  });

  const handlePrimeBloomDtlChange = (fieldName, value) => {
    let primeBloomWt = 0;

    const { noOfPrimeBlooms, primeBloomsLength } = formData;

    if (fieldName === "noOfPrimeBlooms" || fieldName === "primeBloomsLength") {
      const isOtherFieldEmpty =
        (fieldName === "noOfPrimeBlooms" && !primeBloomsLength) ||
        (fieldName === "primeBloomsLength" && !noOfPrimeBlooms);

      if (!value && isOtherFieldEmpty) {
        setPrimeBloomsFieldState({
          noOfPrimeBlooms: false,
          primeBloomsLength: false,
          primeBloomsTotalLength: false,
        });
      } else {
        setPrimeBloomsFieldState({
          noOfPrimeBlooms: false,
          primeBloomsLength: false,
          primeBloomsTotalLength: true,
        });
      }
      primeBloomWt =
        (fieldName === "noOfPrimeBlooms" ? value : noOfPrimeBlooms) *
        (fieldName === "primeBloomsLength" ? value : primeBloomsLength) *
        csVal * 7.85;
    } else if (fieldName === "primeBloomsTotalLength") {
      if (!value) {
        setPrimeBloomsFieldState({
          noOfPrimeBlooms: false,
          primeBloomsLength: false,
          primeBloomsTotalLength: false,
        });
      } else {
        setPrimeBloomsFieldState({
          noOfPrimeBlooms: true,
          primeBloomsLength: true,
          primeBloomsTotalLength: false,
        });
      }
      primeBloomWt = value * csVal * 7.85;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
      weightOfPrimeBlooms: primeBloomWt,
      totalCastWt:
        primeBloomWt + prev.weightOfCoBlooms + prev.weightOfRejectedBlooms,
    }));
  };

  const handleCoBloomDtlChange = (fieldName, value) => {
    let coBloomWt = 0;

    const { noOfCoBlooms, coBloomsLength } = formData;

    if (fieldName === "noOfCoBlooms" || fieldName === "coBloomsLength") {
      const isOtherFieldEmpty =
        (fieldName === "noOfCoBlooms" && !coBloomsLength) ||
        (fieldName === "coBloomsLength" && !noOfCoBlooms);

      if (!value && isOtherFieldEmpty) {
        setCoBloomsFieldState({
          noOfCoBlooms: false,
          coBloomsLength: false,
          coBloomsTotalLength: false,
        });
      } else {
        setCoBloomsFieldState({
          noOfCoBlooms: false,
          coBloomsLength: false,
          coBloomsTotalLength: true,
        });
      }
      coBloomWt =
        (fieldName === "noOfCoBlooms" ? value : noOfCoBlooms) *
        (fieldName === "coBloomsLength" ? value : coBloomsLength) *
        csVal * 7.85;
    } else if (fieldName === "coBloomsTotalLength") {
      if (!value) {
        setCoBloomsFieldState({
          noOfCoBlooms: false,
          coBloomsLength: false,
          coBloomsTotalLength: false,
        });
      } else {
        setCoBloomsFieldState({
          noOfCoBlooms: true,
          coBloomsLength: true,
          coBloomsTotalLength: false,
        });
      }
      coBloomWt = value * csVal * 7.85;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
      weightOfCoBlooms: coBloomWt,
      totalCastWt:
        coBloomWt + prev.weightOfPrimeBlooms + prev.weightOfRejectedBlooms,
    }));
  };

  const handleRejectedBloomDtlChange = (fieldName, value) => {
    let rejectedBloomWt = 0;

    const { noOfRejectedBlooms, rejectedBloomsLength } = formData;

    if (
      fieldName === "noOfRejectedBlooms" ||
      fieldName === "rejectedBloomsLength"
    ) {
      const isOtherFieldEmpty =
        (fieldName === "noOfRejectedBlooms" && !rejectedBloomsLength) ||
        (fieldName === "rejectedBloomsLength" && !noOfRejectedBlooms);

      if (!value && isOtherFieldEmpty) {
        setRejectedBloomsFieldState({
          noOfRejectedBlooms: false,
          rejectedBloomsLength: false,
          rejectedBloomsTotalLength: false,
        });
      } else {
        setRejectedBloomsFieldState({
          noOfRejectedBlooms: false,
          rejectedBloomsLength: false,
          rejectedBloomsTotalLength: true,
        });
      }
      rejectedBloomWt =
        (fieldName === "noOfRejectedBlooms" ? value : noOfRejectedBlooms) *
        (fieldName === "rejectedBloomsLength" ? value : rejectedBloomsLength) *
        csVal * 7.85;
    } else if (fieldName === "rejectedBloomsTotalLength") {
      if (!value) {
        setRejectedBloomsFieldState({
          noOfRejectedBlooms: false,
          rejectedBloomsLength: false,
          rejectedBloomsTotalLength: false,
        });
      } else {
        setRejectedBloomsFieldState({
          noOfRejectedBlooms: true,
          rejectedBloomsLength: true,
          rejectedBloomsTotalLength: false,
        });
      }
      rejectedBloomWt = value * csVal * 7.85;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
      weightOfRejectedBlooms: rejectedBloomWt,
      totalCastWt:
        rejectedBloomWt + prev.weightOfCoBlooms + prev.weightOfPrimeBlooms,
    }));
  };

  useEffect(() => {
    form.setFieldsValue(formData);
    console.log("Form fields updated with formData:", formData.heatRemark);
  }, [formData, form]);

  useEffect(() => {
    if (heatNo) handleHeatNoSearch(heatNo);
  }, [handleHeatNoSearch, heatNo]);

  const handleDegVacChange = (fieldName, value) => {
    const isFloat = regexMatch.floatRegex.test(value);

    if (!isFloat) {
      setDegVacRule([
        {
          validator: (_, value) =>
            Promise.reject(new Error("Value must be numeric.")),
        },
      ]);
    }

    else {
      setDegVacRule([]);

      if (parseFloat(value) > 3 && !divertedHeat) {
        // Use debounced message to prevent spam
        showValidationMessage('degassingVacuum', () => {
          message.warning("Value must be smaller than 3.0 ", 5);
        });

        setIsOutOfRange(true);
        // Mark field as out of range for red highlighting
        setOutOfRangeFields(prev => ({ ...prev, degassingVacuum: true }));
      } else {
        // Clear any pending message for this field
        if (validationTimeouts.current['degassingVacuum']) {
          clearTimeout(validationTimeouts.current['degassingVacuum']);
        }

        // Remove field from out of range highlighting
        setOutOfRangeFields(prev => {
          const updated = { ...prev, degassingVacuum: false };
          // Only set isOutOfRange to false if NO fields are out of range
          const hasAnyOutOfRange = Object.values(updated).some(isOut => isOut === true);
          setIsOutOfRange(hasAnyOutOfRange);
          return updated;
        });
      }
    }

    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Debounce refs for validation messages
  const validationTimeouts = useRef({});

  // Debounced validation function to prevent message spam
  const showValidationMessage = (fieldName, message, delay = 1000) => {
    // Clear existing timeout for this field
    if (validationTimeouts.current[fieldName]) {
      clearTimeout(validationTimeouts.current[fieldName]);
    }

    // Set new timeout
    validationTimeouts.current[fieldName] = setTimeout(() => {
      message();
    }, delay);
  };

  console.log("FormData: ", formData)

  // Validate tolerance fields whenever formData changes (for initial load and updates)
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      validateAllToleranceFields(formData);
    }
  }, [formData.turnDownTemp, formData.degassingDuration, formData.degassingVacuum,
      formData.castingTemp, formData.castingTemp2, formData.hydris,
      formData.nitrogen, formData.oxygen, divertedHeat]);

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
      <div className="relative flex items-center justify-center mb-6">
        <IconBtn
          icon={ArrowLeftOutlined}
          onClick={() => navigate("/sms/sms/heatSummary")}
          className="absolute left-0 top-1/2 -translate-y-1/2 shadow-none bg-inherit"
        />
        <h1 className="font-semibold !text-xl text-center mb-0">Heat Detail</h1>
      </div>
      <Form
        layout="vertical"
        initialValues={formData}
        form={form}
        onFinish={onFinish}
      // onValuesChange={handleBloomDtlChange}
      >
        <FormSearchItem
          label="Enter Heat Number"
          name="heatNo"
          onSearch={handleHeatNoSearch}
          onChange={(fieldName, value) =>
            handleChange(fieldName, value, setFormData)
          }
        />

        {
          currentStage >=1 && (
            <>

<Divider />

<h2 className="font-bold mb-3 underline">Stage 1: Converter</h2>

<div className="grid md:grid-cols-2 gap-8">
  <FormInputItem
    label="Turn Down Temp. (&deg;C)"
    name="turnDownTemp"
    rules={turDowTempRule}
    onChange={handleTurDowTempChange}
    // disabled={isFieldDisabled(1)}
    className={`${currentStage >= 1 ? "block" : "hidden"} ${getFieldClassName('turnDownTemp')}`}
  />
  <FormDropdownItem
    label="Witnessed / Verified"
    name="turnDownTempWv"
    formField="turnDownTempWv"
    dropdownArray={wvDropDown}
    visibleField="value"
    valueField="key"
    onChange={(fieldName, value) =>
      handleChange(fieldName, value, setFormData)
    }
    // disabled={isFieldDisabled(1)}
  />
</div>
            </>
          )
        }

       

        {
          currentStage >= 2 && (!divertedHeat || currentStage <= 2) && (
            <>
              <Divider />

              <h3 className="font-bold mb-3 underline">Stage 2: Degassing</h3>
              <div className="grid md:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Degassing Vacuum(m bar)"
                  name="degassingVacuum"
                  placeholder="2.5"
                  rules={degVacRule}
                  onChange={handleDegVacChange}
                  className={getFieldClassName("degassingVacuum")}
                  // disabled={isFieldDisabled(2)}
                />
                <FormDropdownItem
                  label=""
                  name="degassingVacuumWv"
                  className="mt-14 sm:mt-8"
                  formField="degassingVacuumWv"
                  dropdownArray={wvDropDown}
                  visibleField="value"
                  valueField="key"
                  onChange={(fieldName, value) =>
                    handleChange(fieldName, value, setFormData)
                  }
                  // disabled={isFieldDisabled(2)}
                />
                <FormInputItem
                  label="Degassing Duration(min)"
                  name="degassingDuration"
                  placeholder="10.0"
                  rules={degDurRule}
                  onChange={handleDegDurChange}
                  className={getFieldClassName("degassingDuration")}
                  // disabled={isFieldDisabled(2)}

                />
                <FormDropdownItem
                  label=""
                  name="degassingDurationWv"
                  className="mt-14 sm:mt-8"
                  formField="degassingDurationWv"
                  dropdownArray={wvDropDown}
                  visibleField="value"
                  valueField="key"
                  onChange={(fieldName, value) =>
                    handleChange(fieldName, value, setFormData)
                  }
                  // disabled={isFieldDisabled(2)}
                />
              </div>
            </>
          )
        }


        {
          currentStage >= 3 && (!divertedHeat || currentStage <= 3) && (
            <>
              <Divider />

        <h3 className="font-bold mb-3 underline">Stage 3: Casting</h3>
        <div className="grid md:grid-cols-2 gap-x-4">
          <FormInputItem
            label="1st Casting Temp (&deg;C)"
            name="castingTemp"
            onChange={handleCastTempChange}
            rules={castTempRule}
            className={getFieldClassName("castingTemp")}
            // disabled={isFieldDisabled(3)}
          />
          <FormInputItem
            label="2nd Casting Temp(&deg;C)"
            name="castingTemp2"
            onChange={handleCastTemp2Change}
            rules={castTemp2Rule}
            className={getFieldClassName("castingTemp2")}
            // disabled={isFieldDisabled(3)}
          />
          {/* <FormInputItem
            label="Caster Number "
            name="casterNo"
            onChange={(fieldName, value) =>
              handleChange(fieldName, value, setFormData)
            }
            disabled={isFieldDisabled(3)}
          /> */}

                <FormDropdownItem
                  label="Caster Number"
                  name="casterNo"
                  formField="casterNo"
                  dropdownArray={
                    sms === "SMS 2" ? casterNoDropDownSms2 : casterNoDropDownSms3
                  }
                  visibleField="value"
                  valueField="key"
                  onChange={(fieldName, value) =>
                    handleChange(fieldName, value, setFormData)
                  }
                  // disabled={isFieldDisabled(3)}
                />

                <div>
                  <div className="font-medium mb-1">
                    Sequence Number
                  </div>
                  <div className="flex gap-2">

                    <FormInputItem
                      // label="Sequence Number 1"
                      name="sequenceNo1"
                      onChange={(fieldName, value) =>
                        handleSequenceNumberChange(fieldName, value)
                      }
                      // disabled={isFieldDisabled(3)}
                    />
                    <div className="text-4xl font-semibold">

                      /
                    </div>
                    <FormInputItem
                      // label="Sequence Number 2"
                      name="sequenceNo2"
                      onChange={(fieldName, value) =>
                        handleSequenceNumberChange(fieldName, value)
                      }
                      // disabled={isFieldDisabled(3)}
                    />
                  </div>

                </div>
                <FormInputItem
                  label="Hydris"
                  name="hydris"
                  rules={hydrisRuleObj}
                  onChange={handleHydrisChange}
                  className={getFieldClassName("hydris")}
                  // disabled={isFieldDisabled(3)}
                />
              </div>

            </>
          )
        }

        <Divider />

        <Checkbox
          checked={formData.isProbeDipped}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              isProbeDipped: e.target.checked,
            }))
          }
        >
          Is probe dipped below 300mm from slag - metal surface
        </Checkbox>
        <Divider />
        <Checkbox
          checked={formData.isHydrogenBw80And100}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              isHydrogenBw80And100: e.target.checked,
            }))
          }
        >
          Is measurement of hydrogen between 80-100m of Casting
        </Checkbox>


        {
          currentStage >= 4 && (!divertedHeat || currentStage <= 4) && (
            <>
              <Divider />
              <h3 className="font-bold mb-3 underline">Stage 4: Chemical Analysis</h3>
              <div className="grid md:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Nitrogen (%)"
                  name="nitrogen"
                  rules={nitrogenRule}
                  onChange={handleNitrogenChange}
                  className={getFieldClassName("nitrogen")}
                  // disabled={isFieldDisabled(4)}
                />
                <FormInputItem
                  label="Oxygen (ppm)"
                  name="oxygen"
                  rules={oxygenRule}
                  onChange={handleOxygenChange}
                  className={getFieldClassName("oxygen")}
                  // disabled={isFieldDisabled(4)}
                />

                <FormDropdownItem
                  label="Ladle Chemistry"
                  name="sentToLadle"
                  formField="sentToLadle"
                  dropdownArray={ladleChemDropDown}
                  visibleField="value"
                  valueField="key"
                  onChange={handleChemChange}
                  // disabled={isFieldDisabled(4)}
                />

                {showLabCheckbox && (
                  <div className="flex flex-col">
                    <Checkbox className="">Chemical</Checkbox>
                    <Checkbox className="">Nitrogen</Checkbox>
                    <Checkbox className="">Oxygen</Checkbox>
                  </div>
                )}
              </div>

            </>
          )
        }


        {
          currentStage >= 5 && (!divertedHeat || currentStage <= 5) && (
            <>
              <Divider />

              <h3 className="font-bold mb-3 underline">Stage 5: Bloom Details</h3>
              <div className="border grid grid-cols-5 divide-x divide-y divide-gray-300">
                <div></div>
                <h3 className="p-2">Number</h3>
                <h3 className="p-2">Length (m)</h3>
                <h3 className="p-2">Tot. Len. (m)</h3>
                <h3 className="p-2">Weight (MT)</h3>

                <h3 className="text-center p-2">Prime</h3>
                <FormInputItem
                  className="no-border"
                  name="noOfPrimeBlooms"
                  onChange={handlePrimeBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) || primeBloomsFieldState.noOfPrimeBlooms
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="primeBloomsLength"
                  onChange={handlePrimeBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) || primeBloomsFieldState.primeBloomsLength
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="primeBloomsTotalLength"
                  onChange={handlePrimeBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) || primeBloomsFieldState.primeBloomsTotalLength
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="weightOfPrimeBlooms"
                  disabled
                />

                <h3 className="text-center p-2">CO</h3>
                <FormInputItem
                  className="no-border"
                  name="noOfCoBlooms"
                  onChange={handleCoBloomDtlChange}
                  disabled={isFieldDisabled(5) || coBloomsFieldState.noOfCoBlooms}
                />
                <FormInputItem
                  className="no-border"
                  name="coBloomsLength"
                  onChange={handleCoBloomDtlChange}
                  disabled={isFieldDisabled(5) || coBloomsFieldState.coBloomsLength}
                />
                <FormInputItem
                  className="no-border"
                  name="coBloomsTotalLength"
                  onChange={handleCoBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) || coBloomsFieldState.coBloomsTotalLength
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="weightOfCoBlooms"
                  disabled
                />

                <h3 className="text-center p-2">Rejected</h3>
                <FormInputItem
                  className="no-border"
                  name="noOfRejectedBlooms"
                  onChange={handleRejectedBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) || rejectedBloomsFieldState.noOfRejectedBlooms
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="rejectedBloomsLength"
                  onChange={handleRejectedBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) ||
                    rejectedBloomsFieldState.rejectedBloomsLength
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="rejectedBloomsTotalLength"
                  onChange={handleRejectedBloomDtlChange}
                  disabled={
                    isFieldDisabled(5) ||
                    rejectedBloomsFieldState.rejectedBloomsTotalLength
                  }
                />
                <FormInputItem
                  className="no-border"
                  name="weightOfRejectedBlooms"
                  disabled
                />

                <h3 className="text-center p-2 col-span-4">Total Cast Weight (MT)</h3>
                <FormInputItem className="no-border" name="totalCastWt" disabled />
              </div>

            </>
          )
        }

        <Checkbox
          className="my-4"
          checked={formData.isDiverted}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              isDiverted: e.target.checked,
              heatRemark: e.target.checked ? "Diverted" : null,
            }))
          }
        >
          Mark as diverted heat.
        </Checkbox>

        {divertedHeat && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  <strong>Heat is marked as diverted.</strong> Remaining stages are hidden.
                  Uncheck "Mark as diverted heat" to access remaining stages.
                </p>
              </div>
            </div>
          </div>
        )}

        <FormInputItem
          name="heatRemark"
          placeholder="Heat Remark"
          disabled={heatRemarkDisabled}
          value={formData.heatRemark}
          onChange={(name, value) => handleChange(name, value, setFormData)}
        />
        <FormInputItem
          name="otherRemark"
          placeholder="Other Remark"
          // disabled={heatRemarkDisabled}
          onChange={(name, value) => handleChange(name, value, setFormData)}
        />
        <Btn htmlType="submit" className="flex mx-auto" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Btn>
      </Form>
    </FormContainer>
  )
}
export default HeatDtl