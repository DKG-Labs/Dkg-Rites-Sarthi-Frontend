/* eslint-disable */
import React, { useEffect, useState } from "react";
import FormContainer from "../../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../../components/DKG_SubHeader";
import data from "../../../../../../utils/frontSharedData/testSampleDec/testSampleDec.json";
import GeneralInfo from "../../../../../../components/DKG_GeneralInfo";
import FormBody from "../../../../../../components/DKG_FormBody";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { message, Form } from "antd";
import FormDropdownItem from "../../../../../../components/DKG_FormDropdownItem";
import AcceptanceTestSample from "../acceptanceTestSample.jsx/AcceptanceTestSample";
import RetestSample from "../RetestSample";

const {
  testDropdownList,
  railGradeDropdownList,
  testSampleDecGeneralInfo,
  strandDropdownList,
  sampleLotDropdownList,
  sampleDropdownList,
  checkBoxItems,
  retestNameSecDropdownList,
  retestNameDropdownList,
} = data;

const NewTestSampleDeclaration = () => {
  const location = useLocation();
  const {state} = location;
  const module = state?.module || null;
  const dutyId = state?.dutyId || null;
  const generalInfo = state?.generalInfo || null;
  const editMode = state?.editMode || false;
  const editData = state?.editData || null;


  const navigate = useNavigate();



  const [formData, setFormData] = useState({
    test: editMode && editData ? (editData.type === "acceptance" ? "Acceptance Test" : "Retest Samples") : "",
    railGrade: editMode && editData ? editData.railGrade : "",
  });

  // Initialize form data with edit data when in edit mode
  useEffect(() => {
    if (editMode && editData) {
      console.log("Edit data received:", editData); // Debug log
      setFormData({
        test: editData.type === "acceptance" ? "Acceptance Test" : "Retest Samples",
        railGrade: editData.railGrade || "",
      });
    }
  }, [editMode, editData]);

  // Debug log for formData changes
  useEffect(() => {
    console.log("FormData updated:", formData);
  }, [formData]);

  // Get current duty details for display
  const getCurrentDutyInfo = () => {
    if (generalInfo) {
      return {
        date: generalInfo.date || "N/A",
        startTime: generalInfo.startTime || "N/A",
        shift: generalInfo.shift || "N/A",
        railGrade: generalInfo.railGrade || "N/A",
        railSection: generalInfo.railSection || "N/A",
        mill: generalInfo.mill || "N/A",
        dutyId: dutyId || "N/A"
      };
    }
    return {
      date: "N/A",
      startTime: "N/A",
      shift: "N/A",
      railGrade: "N/A",
      railSection: "N/A",
      mill: "N/A",
      dutyId: dutyId || "N/A"
    };
  };

  const handleChange = (fieldName, value) => {
    console.log("=== PARENT COMPONENT handleChange ===");
    console.log("handleChange called with:", fieldName, value);
    setFormData((prev) => {
      const newData = {
        ...prev,
        [fieldName]: value,
      };
      console.log("Form data updated:", newData);
      if (fieldName === 'railGrade') {
        console.log("Rail grade changed to:", value);
        console.log("Will pass to AcceptanceTestSample:", value);
      }
      return newData;
    });
  };

  const handleFormSubmit = () => {
    // Navigate back to Test Sample List after form submission
    navigate("/stage/testSampleMarkingList", {
      state: {
        module: module,
        dutyId: dutyId,
        generalInfo: generalInfo,
        redirectTo: "/stage/home"
      }
    });
  };

  useEffect(() => {
    if(!module || !dutyId){
      message.error("Reach the page from an ongoing duty in a module.")
      navigate(-1);
  
    }
  }, [module, dutyId, navigate])

  return (
    <FormContainer>
      <SubHeader
        title={editMode ? "Edit Test Sample - Declaration" : "New Test Sample - Declaration"}
        link="/stage/home"
      />
      <GeneralInfo data={getCurrentDutyInfo()} />

      <FormBody
        key={editMode ? `edit-${JSON.stringify(formData)}` : 'new'}
        initialValues={formData}
        onFinish={handleFormSubmit}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-x-4">
          <FormDropdownItem
            label="Test"
            name="test"
            formField="test"
            dropdownArray={testDropdownList}
            onChange={handleChange}
            valueField="key"
            visibleField="value"
            value={formData.test}
            required
          />
          <FormDropdownItem
            label="Rail Grade"
            name="railGrade"
            formField="railGrade"
            dropdownArray={railGradeDropdownList}
            onChange={handleChange}
            valueField="key"
            visibleField="value"
            value={formData.railGrade}
            required
          />
        </div>

        </FormBody>

        {
          formData.test === "Acceptance Test" && (
            <>
              {console.log("=== RENDERING AcceptanceTestSample ===", {
                railGrade: formData.railGrade,
                formData: formData,
                editMode: editMode,
                editData: editData
              })}
              <AcceptanceTestSample
                railGrade={formData.railGrade}
                dutyId={dutyId}
                editMode={editMode}
                editData={editData}
                generalInfo={generalInfo}
              />
            </>
          )
        }
        {
          formData.test === "Retest Samples" && <RetestSample
            railGrade={formData.railGrade}
            dutyId={dutyId}
            editMode={editMode}
            editData={editData}
            generalInfo={generalInfo}
          />
        }
      
    </FormContainer>
  );
};

export default NewTestSampleDeclaration;
