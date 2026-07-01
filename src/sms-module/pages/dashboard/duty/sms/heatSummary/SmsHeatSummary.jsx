/* eslint-disable */
// import React, { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Checkbox, Form, message, Modal, Table } from "antd";
// import { EditOutlined, PlusOutlined } from "@ant-design/icons";
// import SubHeader from "../../../../../components/DKG_SubHeader";
// import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
// import IconBtn from "../../../../../components/DKG_IconBtn";
// import FormInputItem from "../../../../../components/DKG_FormInputItem";
// import Btn from "../../../../../components/DKG_Btn";
// import FormContainer from "../../../../../components/DKG_FormContainer";
// import { apiCall, checkAndConvertToFLoat, handleChange } from "../../../../../utils/CommonFunctions";
// import { useSelector } from "react-redux";
// import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";

// const wvDropDown = [
//   {
//     key: "Witnessed",
//     value: "Witnessed",
//   },
//   {
//     key: "Verified",
//     value: "Verified",
//   },
// ];

// const SmsHeatSummary = () => {
//   const [newHeat, setNewHeat] = useState({
//     heatNo: "",
//     turnDownTemp: "",
//     turnDownTempWv: "",
//   });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [currentTablePage, setCurrentTablePage] = useState(1);
//   const [tablePageSize, setTablePageSize] = useState(5);

//   const smsGeneralInfo = useSelector((state) => state.smsDuty);
//   const { token } = useSelector((state) => state.auth);


//   console.log("NEW HEATL : ", newHeat)

//   const [form] = Form.useForm();

//   const navigate = useNavigate();

//   const [formData, setFormData] = useState({
//     heatDtlList: [
//       // {
//       //   heatNo: "H12345",
//       //   sequenceNo: null,
//       //   heatRemark: null,
//       //   isDiverted: false,
//       //   hydris: null,
//       //   heatStage: "Converter"
//       // }
//     ],
//     hydrisClb: null,
//     lecoClbList: null,
//     makeOfCastingPowder: null,
//     makeOfHydrisProbe: null,
//     amlcFunctioning: false,
//     emsFunctioning: false,
//     hydrogenMeasurementAutomatic: false,
//     ladleToTundishUsed: false,
//     slagDetectorFunctioning: false,
//     tundishToMouldUsed: false,
//   });

//   const populateTableData = useCallback(async () => {
//     try {
//       const { data } = await apiCall(
//         "GET",
//         `/sms/getShiftSummaryDtls?dutyId=${smsGeneralInfo.dutyId}`,
//         token
//       );
//       const { responseData } = data;

//       setFormData({
//         hydrisClb: responseData?.hydrisClb,
//         lecoClbList: responseData?.lecoClbList,
//         makeOfCastingPowder: responseData?.makeOfCastingPowder,
//         makeOfHydrisProbe: responseData?.makeOfHydrisProbe,
//         amlcFunctioning: responseData?.amlcFunctioning,
//         emsFunctioning: responseData?.emsFunctioning,
//         hydrogenMeasurementAutomatic:
//           responseData?.hydrogenMeasurementAutomatic,
//         ladleToTundishUsed: responseData?.ladleToTundishUsed,
//         slagDetectorFunctioning: responseData?.slagDetectorFunctioning,
//         tundishToMouldUsed: responseData?.tundishToMouldUsed,
//         heatDtlList: responseData?.heatDtlList,
//       });
//     } catch (error) {}
//   }, [smsGeneralInfo.dutyId, token]);

//   const columns = [
//     {
//       title: "S/No",
//       dataIndex: "sNo",
//       key: "sNo",
//       render: (_, __, index) => index + 1, // Adding 1 to the index to start from 1
//     },
//     {
//       title: "Heat No.",
//       dataIndex: "heatNo",
//       key: "heatNo",
//       fixed: "left",
//     },
//     {
//       title: "Sequence No.",
//       dataIndex: "sequenceNo",
//       key: "sequenceNo",
//     },
//     {
//       title: "H2",
//       dataIndex: "hydris",
//       key: "h2",
//     },
//     {
//       title: "Stage",
//       dataIndex: "heatStage",
//       key: "stage",
//     },
//     {
//       title: "Heat Remark",
//       dataIndex: "heatRemark",
//       key: "heatRemark",
//     },
//     {
//       title: "Actions",
//       fixed: "right",
//       render: (_, record) => (
//         <IconBtn
//           icon={EditOutlined}
//           onClick={() => navigate("/sms/heatDtl", {state: {heatNo: record.heatNo}})}
//         />
//       ),
//     },
//   ];

//   const addNewHeat = async () => {
//     const checkFloatObj = checkAndConvertToFLoat(newHeat.turnDownTemp);
//     if(!checkFloatObj.isFloat){
//       return;
//     }
//       const payload = {
//         heatNo: newHeat.heatNo,
//         turnDownTemp: checkFloatObj.number,
//         turnDownTempWv: newHeat.turnDownTempWv,
//         dutyId: smsGeneralInfo.dutyId
//       }

//       try{
//         await apiCall("POST", "/sms/addNewHeat", token, payload);
//         setIsModalOpen(false);
//         message.success("New heat added successfully.")
//         setNewHeat({
//           heatNo: "",
//           turnDownTemp: "",
//           turnDownTempWv: ""
//         })
//         populateTableData();
//       }
//       catch(error){

//       }
//   };

//   const [heatRule, setHeatRule] = useState([]);
//   const [tempRule, setTempRule] = useState([]);

//   const handleNewHeatValChange = (fieldName, value) => {
//     if (fieldName === "heatNo") {
//       const isValid = /^0\d{5}$/.test(value);

//       if (!isValid) {
//         setHeatRule([
//           {
//             validator: (_, value) =>
//               Promise.reject(
//                 new Error(
//                   "Heat Number must start with 0, be 6 digits, and contain only numbers."
//                 )
//               ),
//           },
//         ]);
//       } else {
//         setHeatRule([]); // Clear the rule on valid input
//       }
//     }

//     if(fieldName === "turnDownTemp"){
//       const isValid = /^\d+$/.test(value);

//       if(!isValid){
//         setTempRule([
//           {
//             validator: (_, value) =>
//               Promise.reject(
//                 new Error(
//                   "Temperature must not contain decimal values."
//                 )
//               ),
//           },
//         ]);
//       }
//       else if(isValid && parseInt(value) < 1630){
//         setTempRule([
//           {
//             validator: (_, value) =>
//               Promise.reject(
//                 new Error(
//                   "Temperature must be greater than or equal to 1630."
//                 )
//               ),
//           },
//         ]);
//       }
//       else{
//         setTempRule([])
//       }

//     }
//     setNewHeat((prev) => {
//       return {
//         ...prev,
//         [fieldName]: value,
//       };
//     });
//   };

//   const handlePageSizeChange = (value) => {
//     setTablePageSize(value);
//     setCurrentTablePage(1); // Reset to first page when page size changes
//   };

//   const onFinish = async () => {
//     const payload = {
//       makeOfCastingPowder: formData.makeOfCastingPowder,
//       makeOfHydrisProbe: formData.makeOfHydrisProbe,
//       amlcFunctioning: formData.amlcFunctioning,
//       emsFunctioning: formData.emsFunctioning,
//       hydrogenMeasurementAutomatic: formData.hydrogenMeasurementAutomatic,
//       ladleToTundishUsed: formData.ladleToTundishUsed,
//       slagDetectorFunctioning: formData.slagDetectorFunctioning,
//       tundishToMouldUsed: formData.tundishToMouldUsed,
//       dutyId: smsGeneralInfo.dutyId,
//     };

//     try {
//       await apiCall("POST", "/sms/saveShiftSummaryDtls", token, payload);
//       message.success("SMS Shift Summary Data saved succesfully.");
//       navigate("/sms/sms/dutyEnd");
//     } catch (error) {}
//   };

//   useEffect(() => {
//     populateTableData();
//   }, [populateTableData]);

//   useEffect(() => {
//     form.setFieldsValue(formData);
//   }, [formData, form]);

//   return (
//     <FormContainer className="flex flex-col gap-4 md:gap-8">
//       <SubHeader title="SMS - Shift Summary" link="/sms/dutyEnd" />
//       <GeneralInfo data={smsGeneralInfo} />
//       <section>
//         <div className="grid grid-cols-1 gap-2 md:gap-4 border p-1 border-[#d9d9d9] shadow-md rounded-sm relative">
//           <div>
//             <h3 className="font-semibold">Hydris Calibration Details</h3>
//             <div className="grid grid-cols-2">
//               {formData.hydrisClb &&
//                 Object.keys(formData.hydrisClb).map((key) => {
//                   return (
//                     <h3 key={key}>
//                       {key}: {formData.hydrisClb[key]}
//                     </h3>
//                   );
//                 })}
//             </div>
//           </div>
//           <div>
//             <h3 className="font-semibold">Leco Calibration Details</h3>
//             <div className="grid grid-cols-2">
//               {formData.lecoClbList &&
//                 formData.lecoClbList.map((record) => {
//                   return (
//                     <h3 key={record.key}>
//                       {record.key}: {record.value}
//                     </h3>
//                   );
//                 })}
//             </div>
//           </div>
//         </div>
//       </section>

//       <section>
//         <div className="relative">
//           <Table
//             columns={columns}
//             dataSource={formData.heatDtlList}
//             scroll={{ x: true }}
//             bordered
//             pagination={{
//               current: currentTablePage,
//               pageSize: tablePageSize,
//               showSizeChanger: true,
//               pageSizeOptions: ["5", "10", "20"],
//               onChange: (page) => setCurrentTablePage(page),
//               onShowSizeChange: (current, size) => handlePageSizeChange(size),
//             }}
//           />
//           <IconBtn
//             icon={PlusOutlined}
//             text="add new heat"
//             className="absolute left-0 bottom-4"
//             onClick={() => setIsModalOpen(true)}
//           />

//           {/* <IconBtn
//             icon={PlusOutlined}
//             text="add existing heat"
//             className="absolute left-40 bottom-4"
//             onClick={() => navigate("/sms/sms/heatDtl")}
//           /> */}
//         </div>
//       </section>

//       <section>
//         <Form
//           form={form}
//           layout="vertical"
//           initialValues={formData}
//           onFinish={onFinish}
//         >
//           <div className="flex flex-col gap-2 mb-6">
//             <Checkbox
//               checked={formData.emsFunctioning}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   emsFunctioning: e.target.checked,
//                 }))
//               }
//             >
//               Is Ems Functioning?
//             </Checkbox>
//             <Checkbox
//               checked={formData.slagDetectorFunctioning}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   slagDetectorFunctioning: e.target.checked,
//                 }))
//               }
//             >
//               Is Slag Detector cum Slag Arrester Functioning ?
//             </Checkbox>
//             <Checkbox
//               checked={formData.amlcFunctioning}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   amlcFunctioning: e.target.checked,
//                 }))
//               }
//             >
//               Is AMLC Functioning ?
//             </Checkbox>
//             <Checkbox
//               checked={formData.hydrogenMeasurementAutomatic}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   hydrogenMeasurementAutomatic: e.target.checked,
//                 }))
//               }
//             >
//               Is Hydrogen Measurement Automatic ?
//             </Checkbox>
//             <Checkbox
//               checked={formData.ladleToTundishUsed}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   ladleToTundishUsed: e.target.checked,
//                 }))
//               }
//             >
//               Is Shroud (Ladle to Tundish) Used ?
//             </Checkbox>
//             <Checkbox
//               checked={formData.tundishToMouldUsed}
//               onChange={(e) =>
//                 setFormData((prev) => ({
//                   ...prev,
//                   tundishToMouldUsed: e.target.checked,
//                 }))
//               }
//             >
//               Is Shroud (Tundish to Mould) Used ?
//             </Checkbox>
//           </div>

//           <FormInputItem
//             label="Make of Casting Powder Used"
//             name="makeOfCastingPowder"
//             onChange={(fieldName, value) =>
//               handleChange(fieldName, value, setFormData)}
//           />
//           <FormInputItem
//             label="Make of Hydris Probe used"
//             name="makeOfHydrisProbe"
//             onChange={(fieldName, value) =>
//               handleChange(fieldName, value, setFormData)
//             }
//           />
//           <div className="text-center">
//             <Btn htmlType="submit">Save</Btn>
//           </div>
//         </Form>
//       </section>

//       <Modal
//         title="Add new heat"
//         open={isModalOpen}
//         onCancel={() => setIsModalOpen(false)}
//         footer={null}
//       >

//         <Form layout="vertical" onFinish={addNewHeat}>

//         <FormInputItem
//           label="Enter Heat Number"
//           placeholder="012345"
//           name="heatNo"
//           rules={heatRule}
//           // minLength={6}
//           // maxLength={6}
//           onChange={handleNewHeatValChange}
//           required
//           />
//         <FormInputItem
//           label="Turn Down Temperature"
//           placeholder="1630"
//           // minLength={6}
//           // maxLength={6}
//           name="turnDownTemp"
//           onChange={handleNewHeatValChange}
//           rules={tempRule}
//           />

//           <FormDropdownItem
//             label="Witnessed / Verified"
//             name="turnDownTempWv"
//             formField="turnDownTempWv"
//             dropdownArray={wvDropDown}
//             visibleField="value"
//             valueField="key"
//             onChange={handleNewHeatValChange}

//             />
//         <Btn htmlType="submit">Add</Btn>
//           </Form>
//       </Modal>
//     </FormContainer>
//   );
// };

// export default SmsHeatSummary;

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox, Form, message, Modal, Popconfirm, Table } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import IconBtn from "../../../../../components/DKG_IconBtn";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import FormContainer from "../../../../../components/DKG_FormContainer";
import { apiCall, checkAndConvertToFLoat, handleChange } from "../../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { Button } from "antd";

const wvDropDown = [
  { key: "Witnessed", value: "Witnessed" },
  { key: "Verified", value: "Verified" },
];

const SmsHeatSummary = () => {
  const [newHeat, setNewHeat] = useState({
    heatNo: "",
    turnDownTemp: "",
    turnDownTempWv: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(5);

  const smsGeneralInfo = useSelector((state) => state.smsDuty);
  const { token } = useSelector((state) => state.auth);

  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [showCalibrationDetails, setShowCalibrationDetails] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    heatDtlList: [],
    hydrisClb: null,
    lecoClbList: null,
    makeOfCastingPowder: null,
    makeOfHydrisProbe: null,
    amlcFunctioning: false,
    emsFunctioning: false,
    hydrogenMeasurementAutomatic: false,
    ladleToTundishUsed: false,
    slagDetectorFunctioning: false,
    tundishToMouldUsed: false,
  });

  const populateTableData = useCallback(async () => {
    try {
      const { data } = await apiCall(
        "GET",
        `/sms/getShiftSummaryDtls?dutyId=${smsGeneralInfo.dutyId}`,
        token
      );
      const { responseData } = data;

      setFormData({
        hydrisClb: responseData?.hydrisClb,
        lecoClbList: responseData?.lecoClbList,
        makeOfCastingPowder: responseData?.makeOfCastingPowder,
        makeOfHydrisProbe: responseData?.makeOfHydrisProbe,
        amlcFunctioning: responseData?.amlcFunctioning,
        emsFunctioning: responseData?.emsFunctioning,
        hydrogenMeasurementAutomatic: responseData?.hydrogenMeasurementAutomatic,
        ladleToTundishUsed: responseData?.ladleToTundishUsed,
        slagDetectorFunctioning: responseData?.slagDetectorFunctioning,
        tundishToMouldUsed: responseData?.tundishToMouldUsed,
        heatDtlList: responseData?.heatDtlList,
      });
    } catch (error) {}
  }, [smsGeneralInfo.dutyId, token]);

  const deleteHeat = async (heatNo) => {
    try {
      await apiCall("POST", "/sms/deleteHeat", token, { heatNo, sms: smsGeneralInfo.sms });
      message.success(`Heat ${heatNo} deleted successfully.`);
      populateTableData();
    } catch (error) {}
  };

  const columns = [
    {
      title: "S/No",
      dataIndex: "sNo",
      key: "sNo",
      render: (_, __, index) => index + 1,
    },
    { title: "Heat No.", dataIndex: "heatNo", key: "heatNo", fixed: "left" },
    {
      title: "Sequence No.",
      dataIndex: "sequenceNo",
      key: "sequenceNo",
      render: (text, record, index) => {
        const globalIndex = (currentTablePage - 1) * tablePageSize + index;
        const prevRecord = globalIndex > 0 ? formData.heatDtlList[globalIndex - 1] : null;

        let backgroundColor = "transparent";
        const currentSeq = typeof text === "string" ? text : null;
        const prevSeq = prevRecord && typeof prevRecord.sequenceNo === "string" ? prevRecord.sequenceNo : null;

        if (!currentSeq || !prevSeq) {
          return <span>{text || "N/A"}</span>;
        }

        const currentParts = currentSeq.split("/");
        const prevParts = prevSeq.split("/");

        if (currentParts.length !== 2 || prevParts.length !== 2) {
          return <span>{text || "N/A"}</span>;
        }

        const [firstPart, secondPart] = currentParts.map(Number);
        const [prevFirstPart, prevSecondPart] = prevParts.map(Number);

        const validFirstPart = !isNaN(firstPart) && !isNaN(prevFirstPart);
        const validSecondPart = !isNaN(secondPart) && !isNaN(prevSecondPart);

        if (validFirstPart && firstPart !== prevFirstPart) {
          backgroundColor = "#0079ffcf";
        } else if (validSecondPart && Math.abs(secondPart - prevSecondPart) > 1) {
          backgroundColor = "yellow";
        }

        return (
          <span style={{ backgroundColor, color: "black", padding: "1rem" }}>
            {text || ""}
          </span>
        );
      },
    },
    { title: "H2", dataIndex: "hydris", key: "h2" },
    { title: "Stage", dataIndex: "heatStage", key: "stage" },
    {
      title: "Heat Remark",
      dataIndex: "heatRemark",
      key: "heatRemark",
      render: (text, record) => {
        // Show "Diverted" if heat is marked as diverted
        if (record.isDiverted) {
          return <span className="text-red-600 font-semibold">Diverted</span>;
        }

        // Show rejection-related remarks in red
        if (text && (
          text.toLowerCase().includes('reject') ||
          text.toLowerCase().includes('diverted') ||
          text.toLowerCase().includes('nitrogen') ||
          text.toLowerCase().includes('oxygen') ||
          text.toLowerCase().includes('hydrogen')
        )) {
          return <span className="text-red-600 font-semibold">{text}</span>;
        }

        return text || "-";
      }
    },
    {
      title: "Actions",
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2">
          <IconBtn
            icon={EditOutlined}
            onClick={() => navigate("/sms/sms/heatDtl", { state: { heatNo: record.heatNo } })}
          />
          <Popconfirm
            description="Are you sure to delete this heat?"
            onConfirm={() => deleteHeat(record.heatNo)}
            okText="Yes"
            cancelText="No"
          >
            <IconBtn danger icon={DeleteOutlined} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const addNewHeat = async () => {
    const payload = {
      heatNo: String(newHeat.heatNo).padStart(6, "0"),
      turnDownTemp: newHeat.turnDownTemp,
      turnDownTempWv: newHeat?.turnDownTempWv,
      dutyId: smsGeneralInfo.dutyId,
    };

    try {
      await apiCall("POST", "/sms/addNewHeat", token, payload);
      message.success("New heat added successfully.");
      setNewHeat({
        heatNo: "",
        turnDownTemp: "",
        turnDownTempWv: "",
      });
      modalForm.resetFields();
      setIsModalOpen(false);
      populateTableData();
    } catch (error) {
      // message.error("Failed to add new heat.");
    }
  };

  const [heatRule, setHeatRule] = useState([]);
  const [tempRule, setTempRule] = useState([]);

  const handleNewHeatValChange = (fieldName, value) => {
    if (fieldName === "heatNo") {
      const isValid = /^\d+$/.test(value);
      if (!isValid) {
        setHeatRule([
          {
            validator: (_, val) =>
              Promise.reject(new Error("Heat No. must not contain decimal values or string values.")),
          },
        ]);
      } else if (isValid && parseInt(value.length) > 6) {
        setHeatRule([
          {
            validator: (_, val) =>
              Promise.reject(new Error("Heat Number must 6 digits or smaller.")),
          },
        ]);
      } else {
        setHeatRule([]);
      }
    }

    if (fieldName === "turnDownTemp") {
      const isValid = /^\d+$/.test(value);
      if (!isValid) {
        setTempRule([
          {
            validator: (_, val) =>
              Promise.reject(new Error("Temperature must not contain decimal values.")),
          },
        ]);
      } else if (isValid && parseInt(value) < 1630) {
        setTempRule([
          {
            validator: (_, val) =>
              Promise.reject(new Error("Temperature must be greater than or equal to 1630.")),
          },
        ]);
      } else {
        setTempRule([]);
      }
    }

    setNewHeat((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handlePageSizeChange = (value) => {
    setTablePageSize(value);
    setCurrentTablePage(1);
  };

  const onFinish = async () => {
    const payload = {
      makeOfCastingPowder: formData.makeOfCastingPowder,
      makeOfHydrisProbe: formData.makeOfHydrisProbe,
      amlcFunctioning: formData.amlcFunctioning,
      emsFunctioning: formData.emsFunctioning,
      hydrogenMeasurementAutomatic: formData.hydrogenMeasurementAutomatic,
      ladleToTundishUsed: formData.ladleToTundishUsed,
      slagDetectorFunctioning: formData.slagDetectorFunctioning,
      tundishToMouldUsed: formData.tundishToMouldUsed,
      dutyId: smsGeneralInfo.dutyId,
    };

    try {
      await apiCall("POST", "/sms/saveShiftSummaryDtls", token, payload);
      message.success("SMS Shift Summary Data saved successfully.");
      navigate("/sms/sms/dutyEnd");
    } catch (error) {}
  };

  useEffect(() => {
    populateTableData();
  }, [populateTableData]);

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData]);

  return (
    <FormContainer className="flex flex-col gap-4 md:gap-8">
      <SubHeader title="SMS - Shift Summary" link="/sms/sms/dutyEnd" />
      <GeneralInfo data={smsGeneralInfo} />

      <div className="flex items-center mb-2">
        <Button
          type="primary"
          onClick={() => setShowCalibrationDetails(!showCalibrationDetails)}
          className="mr-4"
        >
          {showCalibrationDetails ? "Hide Calibration Details" : "Show Calibration Details"}
        </Button>
      </div>

      {showCalibrationDetails && (
        <section className="border p-3 rounded bg-lightGray">
          <div>
            <h3 className="font-semibold">Hydris Calibration Details</h3>
            <div className="grid grid-cols-2">
              {formData.hydrisClb &&
                Object.keys(formData.hydrisClb).map((key) => (
                  <h3 key={key}>
                    {key}: {formData.hydrisClb[key]}
                  </h3>
                ))}
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-semibold">Leco Calibration Details</h3>
            <div className="grid grid-cols-2">
              {formData.lecoClbList &&
                formData.lecoClbList.map((record) => (
                  <h3 key={record.key}>
                    {record.key}: {record.value}
                  </h3>
                ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="relative">
          <Table
            columns={columns}
            dataSource={formData.heatDtlList}
            scroll={{ x: true }}
            bordered
            pagination={{
              current: currentTablePage,
              pageSize: tablePageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              onChange: (page) => setCurrentTablePage(page),
              onShowSizeChange: (current, size) => handlePageSizeChange(size),
            }}
          />
          <IconBtn
            icon={PlusOutlined}
            text="add new heat"
            className="absolute left-0 bottom-4"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center mb-2">
          <Button
            type="primary"
            onClick={() => setShowCheckboxes(!showCheckboxes)}
            className="mr-4"
          >
            {showCheckboxes ? "Hide Checkboxes" : "Show Checkboxes"}
          </Button>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {showCheckboxes && (
            <div className="flex flex-col gap-2 mb-6">
              <Checkbox
                checked={formData.emsFunctioning}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, emsFunctioning: e.target.checked }))
                }
              >
                Is Ems Functioning?
              </Checkbox>
              <Checkbox
                checked={formData.slagDetectorFunctioning}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slagDetectorFunctioning: e.target.checked,
                  }))
                }
              >
                Is Slag Detector cum Slag Arrester Functioning ?
              </Checkbox>
              <Checkbox
                checked={formData.amlcFunctioning}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amlcFunctioning: e.target.checked }))
                }
              >
                Is AMLC Functioning ?
              </Checkbox>
              <Checkbox
                checked={formData.hydrogenMeasurementAutomatic}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hydrogenMeasurementAutomatic: e.target.checked,
                  }))
                }
              >
                Is Hydrogen Measurement Automatic ?
              </Checkbox>
              <Checkbox
                checked={formData.ladleToTundishUsed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ladleToTundishUsed: e.target.checked,
                  }))
                }
              >
                Is Shroud (Ladle to Tundish) Used ?
              </Checkbox>
              <Checkbox
                checked={formData.tundishToMouldUsed}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tundishToMouldUsed: e.target.checked,
                  }))
                }
              >
                Is Shroud (Tundish to Mould) Used ?
              </Checkbox>
            </div>
          )}

          <FormInputItem
            label="Make of Casting Powder Used"
            name="makeOfCastingPowder"
            onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
          />
          <FormInputItem
            label="Make of Hydris Probe used"
            name="makeOfHydrisProbe"
            onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
          />
          <div className="text-center">
            <Btn htmlType="submit">Save</Btn>
          </div>
        </Form>
      </section>

      <Modal
        title="Add new heat"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={addNewHeat}
          initialValues={newHeat}
        >
          <FormInputItem
            label="Enter Heat Number"
            placeholder="012345"
            name="heatNo"
            rules={heatRule}
            value={newHeat.heatNo}
            onChange={(_, value) => handleNewHeatValChange("heatNo", value)}
            required
          />
          <FormInputItem
            label="Turn Down Temperature"
            placeholder="1630"
            name="turnDownTemp"
            value={newHeat.turnDownTemp}
            onChange={(_, value) => handleNewHeatValChange("turnDownTemp", value)}
          />
          <FormDropdownItem
            label="Witnessed / Verified"
            name="turnDownTempWv"
            formField="turnDownTempWv"
            dropdownArray={wvDropDown}
            visibleField="value"
            valueField="key"
            value={newHeat.turnDownTempWv}
            onChange={(_, value) => handleNewHeatValChange("turnDownTempWv", value)}
          />
          <Btn htmlType="submit">Add</Btn>
        </Form>
      </Modal>
    </FormContainer>
  );
};

export default SmsHeatSummary;
