/* eslint-disable */
import { Checkbox, Form, message, Tooltip } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import FormDropdownItem from "../../../../../../components/DKG_FormDropdownItem";
import FormInputItem from "../../../../../../components/DKG_FormInputItem";
import { useSelector } from "react-redux";
import { apiCall } from "../../../../../../utils/CommonFunctions";
import Btn from "../../../../../../components/DKG_Btn";
import { useNavigate } from "react-router-dom";
import {
  RG_1080HH,
  RG_880,
  RG_880NC,
  RG_R260,
  RG_R350HT,
} from "../../../../../../utils/Constants";

const AcceptanceTestSample = ({ railGrade, dutyId, retest, editMode, editData, generalInfo }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  console.log("AcceptanceTestSample - railGrade prop:", railGrade);
  console.log("AcceptanceTestSample - editMode:", editMode);
  console.log("AcceptanceTestSample - editData:", editData);

  const [formData, setFormData] = useState({
    railGrade: editMode && editData ? editData.railGrade : railGrade,
    sampleType: editMode && editData ? editData.sampleType : null,
    sampleId: editMode && editData ? (editData.sampleId || "N/A") : null,
    heatNo: editMode && editData ? editData.heatNo : null,
    strand: editMode && editData ? editData.strand : null,
    sampleLot: editMode && editData ? editData.sampleLot : null,
    chemical: editMode && editData ? editData.chemical : false,
    n2: editMode && editData ? editData.n2 : false,
    fwtSt: editMode && editData ? editData.fwtSt : false,
    mechanical: editMode && editData ? editData.mechanical : false,
    sp: editMode && editData ? editData.sp : false,
    ir: editMode && editData ? editData.ir : false,
    o2: editMode && editData ? editData.o2 : false,
    fwtHs: editMode && editData ? editData.fwtHs : false,
    fwtStSr: editMode && editData ? editData.fwtStSr : false,
    tensileFoot: editMode && editData ? editData.tensileFoot : false,
    micro: editMode && editData ? editData.micro : false,
    decarb: editMode && editData ? editData.decarb : false,
    rsh: editMode && editData ? editData.rsh : false,
    tensile: editMode && editData ? editData.tensile : false,
    ph: editMode && editData ? editData.ph : false
  });

  // Update formData when editData changes
  useEffect(() => {
    console.log("AcceptanceTestSample - railGrade prop:", railGrade);
    console.log("AcceptanceTestSample - editMode:", editMode);
    console.log("AcceptanceTestSample - editData:", editData);

    if (editMode && editData) {
      setFormData({
        railGrade: editData.railGrade || railGrade,
        sampleType: editData.sampleType || null,
        sampleId: editData.sampleId || "N/A",
        heatNo: editData.heatNo || null,
        strand: editData.strand || null,
        sampleLot: editData.sampleLot || null,
        chemical: editData.chemical || false,
        n2: editData.n2 || false,
        fwtSt: editData.fwtSt || false,
        mechanical: editData.mechanical || false,
        sp: editData.sp || false,
        ir: editData.ir || false,
        o2: editData.o2 || false,
        fwtHs: editData.fwtHs || false,
        fwtStSr: editData.fwtStSr || false,
        tensileFoot: editData.tensileFoot || false,
        micro: editData.micro || false,
        decarb: editData.decarb || false,
        rsh: editData.rsh || false,
        tensile: editData.tensile || false,
        ph: editData.ph || false
      });
    }
  }, [editMode, editData, railGrade]);

  // Track railGrade prop changes
  useEffect(() => {
    console.log("railGrade prop changed to:", railGrade);
    if (!editMode && railGrade) {
      console.log("Updating formData.railGrade to:", railGrade);
      setFormData(prev => ({
        ...prev,
        railGrade: railGrade
      }));
    }
  }, [railGrade, editMode]);

  // Check if at least one checkbox is selected
  const isAtLeastOneCheckboxSelected = () => {
    const checkboxFields = [
      'chemical', 'n2', 'fwtSt', 'mechanical', 'sp', 'ir', 'o2',
      'fwtHs', 'fwtStSr', 'tensileFoot', 'micro', 'decarb', 'rsh', 'tensile', 'ph'
    ];

    return checkboxFields.some(field => formData[field] === true);
  };

  const onFinish = async () => {
    if(retest){
      message.error("Table retest_rsm03. doesnt exist.")
      return;
    }

    // Debug logging
    console.log("=== VALIDATION DEBUG ===");
    console.log("formData.railGrade:", formData.railGrade);
    console.log("railGrade prop:", railGrade);
    console.log("formData:", formData);

    // Validate rail grade - check both formData and prop
    const currentRailGrade = formData.railGrade || railGrade;
    console.log("currentRailGrade:", currentRailGrade);

    if (!currentRailGrade || currentRailGrade === "") {
      console.log("VALIDATION FAILED: Rail grade is empty");
      message.error("Please select a rail grade before submitting.");
      return;
    }

    // Validate at least one checkbox is selected
    if (!isAtLeastOneCheckboxSelected()) {
      message.error("Please select at least one test to mark.");
      return;
    }

    const payload = {
      ...formData,
      railGrade: currentRailGrade, // Use the validated rail grade
      dutyId,
    };

    console.log("Acceptance Test Sample Payload:", payload);
    console.log("formData.railGrade:", formData.railGrade);
    console.log("railGrade prop:", railGrade);
    console.log("currentRailGrade used:", currentRailGrade);

    try {
      if (editMode) {
        // Update existing test sample
        await apiCall("POST", "rolling/updateTestSample", token, payload);
        message.success("Test sample updated successfully.");
      } else {
        // Create new test sample
        await apiCall("POST", "rolling/saveAcceptanceTestSample", token, payload);
        message.success("Data saved successfully.");
      }

      // Navigate to Test Sample - Declaration page after successful save
      navigate("/stage/testSampleMarkingList", {
        state: {
          module: "stage",
          dutyId: dutyId,
          generalInfo: generalInfo, // Preserve the original general info
          redirectTo: "/stage/home"
        }
      });
    } catch (error) {
      message.error(editMode ? "Failed to update test sample." : "Failed to save test sample.");
    }
  };

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData]);

  const sampleTypeDd = [
    {
      key: "Regular",
      value: "Regular",
    },
    {
      key: "USB",
      value: "USB",
    },
    {
      key: "NA",
      value: "NA",
    },
  ];
  const sampleLotDd = [
    {
      key: "Lot 1",
      value: "Lot 1",
    },
    {
      key: "Lot 2",
      value: "Lot 2",
    },
    {
      key: "NA",
      value: "NA",
    },
  ];

  const strandDd = [
    {
      key: 1,
      value: 1,
    },
    {
      key: 2,
      value: 2,
    },
    {
      key: 3,
      value: 3,
    },
    {
      key: 4,
      value: 4,
    },
    {
      key: 5,
      value: 5,
    },
    {
      key: 6,
      value: 6,
    },
  ];

  const { token } = useSelector((state) => state.auth);

  const [sampleIdRule, setSampleIdRule] = useState([]);

  const handleChange = (fieldName, value) => {
    if(fieldName === "sampleId"){
      if((value !== "" || value !== null) && !value.startsWith("H")){
        setSampleIdRule([
          {
            validator: (_, value) =>
              Promise.reject(
                new Error("Sampe ID should start with H.")
              ),
          },
        ]);
      }
      else{
        setSampleIdRule([]);
      }
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const populateDtl = useCallback(
    async (payload) => {
      try {
        const { data } = await apiCall(
          "POST",
          "/rolling/getHeatAcptTestDtls",
          token,
          payload
        );
        // if (data.responseData?.heatNo) {
        //   message.success("Test data present for provided details.");
        console.log("RSH: ", data?.responseData?.rsh)
          setFormData(prev => {
            return {
              chemical: data?.responseData?.chemical,
              n2: data?.responseData?.n2,
              fwtSt: data?.responseData?.fwtSt,
              mechanical: data?.responseData?.mechanical,
              sp: data?.responseData?.sp,
              ir: data?.responseData?.ir,
              o2: data?.responseData?.o2,
              fwtHs: data?.responseData?.fwtHs,
              fwtStSr: data?.responseData?.fwtStSr,
              tensileFoot: data?.responseData?.tensileFoot,
              micro: data?.responseData?.micro,
              decarb: data?.responseData?.decarb,
              rsh: data?.responseData?.rsh,
              ph: data?.responseData?.ph,
              tensile: data?.responseData?.tensile,
              heatNo: prev.heatNo,
              strand: prev.strand,
              sampleLot: prev.sampleLot,
              sampleId: prev.sampleId,
              sampleType: prev.sampleType
            }
          });
        // } else {
          // message.error("Test data not present for provided details.");
        // }
      } catch (error) {}
    },
    [token]
  );

  useEffect(() => {
    if (
      formData.heatNo &&
      formData.sampleLot &&
      formData.sampleType &&
      formData.strand
    ) {
      const payload = {
        heatNo: formData.heatNo,
        sampleLot: formData.sampleLot,
        sampleType: formData.sampleType,
        strand: formData.strand,
      };
      if (railGrade === RG_880 || railGrade === RG_R260) {
        payload.sampleId = null;
        setFormData((prev) => ({ ...prev, sampleId: null }));
        populateDtl(payload);
      } else {
        if (formData.sampleId) {
          payload.sampleId = formData.sampleId;
          populateDtl(payload);
        }
      }
    }
  }, [
    formData.heatNo,
    formData.sampleId,
    formData.sampleLot,
    formData.sampleType,
    formData.strand,
    railGrade,
    populateDtl,
  ]);

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData]);

  // Set initial form values when in edit mode
  useEffect(() => {
    if (editMode && editData) {
      const initialValues = {
        sampleType: editData.sampleType || null,
        sampleId: editData.sampleId || "N/A",
        heatNo: editData.heatNo || null,
        strand: editData.strand || null,
        sampleLot: editData.sampleLot || null,
        // Set all checkbox values from editData
        chemical: editData.chemical || false,
        n2: editData.n2 || false,
        fwtSt: editData.fwtSt || false,
        mechanical: editData.mechanical || false,
        sp: editData.sp || false,
        ir: editData.ir || false,
        o2: editData.o2 || false,
        fwtHs: editData.fwtHs || false,
        fwtStSr: editData.fwtStSr || false,
        tensileFoot: editData.tensileFoot || false,
        micro: editData.micro || false,
        decarb: editData.decarb || false,
        rsh: editData.rsh || false,
        ph: editData.ph || false,
        tensile: editData.tensile || false
      };

      form.setFieldsValue(initialValues);

      // Also update formData state to match
      setFormData(prev => ({
        ...prev,
        ...initialValues
      }));
    }
  }, [editMode, editData, form]);

  return (
    <Form
      form={form}
      initialValues={formData}
      onFinish={onFinish}
      layout="vertical"
      className="bg-offWhite p-2"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-2">
        <FormDropdownItem
          label="Sample Type"
          name="sampleType"
          formField="sampleType"
          dropdownArray={sampleTypeDd}
          valueField="key"
          visibleField="value"
          onChange={handleChange}
          required
        />
        <FormDropdownItem
          label="Sample Lot"
          name="sampleLot"
          formField="sampleLot"
          dropdownArray={sampleLotDd}
          valueField="key"
          visibleField="value"
          onChange={handleChange}
          required
        />
        <FormDropdownItem
          label="Strand"
          name="strand"
          formField="strand"
          dropdownArray={strandDd}
          valueField="key"
          visibleField="value"
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4">
        <FormInputItem
          label="Heat number"
          name="heatNo"
          onChange={handleChange}
        />
        <FormInputItem
          label="Sample ID"
          name="sampleId"
          rules={formData.sampleId === "N/A" ? [] : sampleIdRule}
          onChange={handleChange}
          disabled={railGrade === "880" || railGrade === "R260" || formData.sampleId === "N/A"}
          placeholder={formData.sampleId === "N/A" ? "N/A" : "Enter Sample ID"}
        />
      </div>

      <div className="grid grid-cols-2 gap-y-4">
        <Checkbox
          checked={formData.chemical || false}
          onChange={(e) => handleChange("chemical", e.target.checked)}
        >
          CHEMICAL
        </Checkbox>

        <Checkbox
          checked={formData.o2 || false}
          onChange={(e) => handleChange("o2", e.target.checked)}
        >
          O2
        </Checkbox>

        <Checkbox
          checked={formData.n2 || false}
          onChange={(e) => handleChange("n2", e.target.checked)}
        >
          N2
        </Checkbox>

        <Checkbox
          checked={formData.fwtSt || false}
          onChange={(e) => handleChange("fwtSt", e.target.checked)}
        >
          FWT (ST)
        </Checkbox>

        <Checkbox
          checked={formData.fwtHs || false}
          onChange={(e) => handleChange("fwtHs", e.target.checked)}
        >
          FWT (HS)
        </Checkbox>

        {(railGrade === RG_880 || railGrade === RG_R260) && (
          <Checkbox
            checked={formData.fwtStSr || false}
            onChange={(e) => handleChange("fwtStSr", e.target.checked)}
          >
            FWT (ST) - SR
          </Checkbox>
        )}
      {
        (railGrade === RG_880 || railGrade === RG_R260) &&
        <Checkbox
          checked={formData.mechanical || false}
          onChange={(e) => handleChange("mechanical", e.target.checked)}
        >
          MECHANICAL
        </Checkbox>
      }

        <Checkbox
          checked={formData.tensileFoot || false}
          onChange={(e) => handleChange("tensileFoot", e.target.checked)}
        >
          TENSILE FOOT
        </Checkbox>

        <Checkbox
          checked={formData.sp || false}
          onChange={(e) => handleChange("sp", e.target.checked)}
        >
          SP
        </Checkbox>

        <Checkbox
          checked={formData.micro || false}
          onChange={(e) => handleChange("micro", e.target.checked)}
        >
          MICRO
        </Checkbox>

        <Checkbox
          checked={formData.ir || false}
          onChange={(e) => handleChange("ir", e.target.checked)}
        >
          IR
        </Checkbox>

        <Checkbox
          checked={formData.decarb || false}
          onChange={(e) => handleChange("decarb", e.target.checked)}
        >
          DECARB
        </Checkbox>
        {(railGrade === RG_1080HH || railGrade === RG_R350HT || railGrade === RG_880NC) && (
          <>
            <Checkbox
              checked={formData.rsh || false}
              onChange={(e) => handleChange("rsh", e.target.checked)}
            >
              RSH
            </Checkbox>
            <Checkbox
              checked={formData.tensile || false}
              onChange={(e) => handleChange("tensile", e.target.checked)}
            >
              TENSILE
            </Checkbox>
            <Checkbox
              checked={formData.ph || false}
              onChange={(e) => handleChange("ph", e.target.checked)}
            >
              PH
            </Checkbox>
          </>
        )}
      </div>

      <Tooltip
        title={!isAtLeastOneCheckboxSelected() ? "Please select at least one test checkbox to enable save" : ""}
        placement="top"
      >
        <Btn
          htmlType="submit"
          className="flex mx-auto mt-4"
          disabled={!isAtLeastOneCheckboxSelected()}
        >
          {editMode ? "Update" : "Save"}
        </Btn>
      </Tooltip>
    </Form>
  );
};

export default AcceptanceTestSample;
