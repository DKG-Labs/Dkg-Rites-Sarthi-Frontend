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
import { Form, message, Modal, Pagination, Table, Button, Radio } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import IconBtn from "../../../../../components/DKG_IconBtn";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../components/DKG_Btn";
import FormContainer from "../../../../../components/DKG_FormContainer";
import { apiCall, checkAndConvertToFLoat, handleChange } from "../../../../../utils/CommonFunctions";

const wvDropDown = [
  { key: "", value: "Select" },
  { key: "Witnessed", value: "Witnessed" },
  { key: "Verified", value: "Verified" },
];

const booleanQuestions = [
  { key: "emsFunctioning", label: "Is EMS Functioning?" },
  { key: "slagDetectorFunctioning", label: "Is Slag Detector cum Slag Arrester Functioning?" },
  { key: "amlcFunctioning", label: "Is AMLC Functioning?" },
  { key: "hydrogenMeasurementAutomatic", label: "Is Hydrogen Measurement Automatic?" },
  { key: "ladleToTundishUsed", label: "Is Shroud (Ladle to Tundish) Used?" },
  { key: "tundishToMouldUsed", label: "Is Shroud (Tundish to Mould) Used?" },
];

const SmsHeatSummary = () => {
  const [newHeat, setNewHeat] = useState({
    heatNo: "",
    turnDownTemp: "",
    turnDownTempWv: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addHeatLoading, setAddHeatLoading] = useState(false);
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(5);

  const smsGeneralInfo = useSelector((state) => state.smsDuty);
  const { token } = useSelector((state) => state.auth);

  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [showCalibrationDetails, setShowCalibrationDetails] = useState(false);

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
      await apiCall("POST", "/sms/deleteHeat", token, { 
        heatNo, 
        sms: smsGeneralInfo?.sms,
        dutyId: smsGeneralInfo?.dutyId
      });
      message.success(`Heat ${heatNo} deleted successfully.`);
      populateTableData();
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete heat.");
    }
  };

  const showDeleteConfirm = (heatNo) => {
    Modal.confirm({
      title: "Delete Heat",
      content: `Are you sure you want to delete heat ${heatNo}?`,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      centered: true,
      onOk: () => deleteHeat(heatNo),
    });
  };

  const columns = [
    {
      title: "S/No",
      dataIndex: "sNo",
      key: "sNo",
      width: 65,
      align: "center",
      render: (_, __, index) => (currentTablePage - 1) * tablePageSize + index + 1,
    },
    { 
      title: "Heat No.", 
      dataIndex: "heatNo", 
      key: "heatNo", 
      fixed: "left",
      width: 110,
    },
    {
      title: "Sequence No.",
      dataIndex: "sequenceNo",
      key: "sequenceNo",
      width: 130,
      render: (text, record, index) => {
        const globalIndex = (currentTablePage - 1) * tablePageSize + index;
        const prevRecord = globalIndex > 0 ? formData.heatDtlList[globalIndex - 1] : null;

        let backgroundColor = "transparent";
        const currentSeq = typeof text === "string" ? text : null;
        const prevSeq = prevRecord && typeof prevRecord.sequenceNo === "string" ? prevRecord.sequenceNo : null;

        if (currentSeq && prevSeq) {
          const currentPrefix = currentSeq.split("/")[0];
          const prevPrefix = prevSeq.split("/")[0];

          if (currentPrefix !== prevPrefix) {
            backgroundColor = "#3899ff";
          }
        }

        return (
          <div
            style={{
              backgroundColor: backgroundColor,
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: backgroundColor !== "transparent" ? "bold" : "normal",
              color: backgroundColor !== "transparent" ? "#fff" : "inherit",
              textAlign: "center",
            }}
          >
            {text || "N/A"}
          </div>
        );
      },
    },
    {
      title: "H2",
      dataIndex: "hydris",
      key: "hydris",
      width: 80,
      align: "center",
      render: (text) => {
        const num = parseFloat(text);

        if (!isNaN(num) && num > 1.6) {
          return <span className="text-red-600 font-semibold">{text}</span>;
        }

        return text != null && text !== "" ? text : "-";
      },
    },
    { 
      title: "Stage", 
      dataIndex: "heatStage", 
      key: "heatStage",
      width: 140,
    },
    {
      title: "Heat Remark",
      dataIndex: "heatRemark",
      key: "heatRemark",
      width: 160,
      render: (text) => {
        if (text && typeof text === 'string' && (
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
      width: 110,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1.5">
          <IconBtn
            icon={EditOutlined}
            tooltipTitle="Edit Heat"
            onClick={() => navigate("/sms/sms/heatDtl", { state: { heatNo: record.heatNo } })}
          />
          <IconBtn
            danger
            icon={DeleteOutlined}
            tooltipTitle="Delete Heat"
            onClick={() => showDeleteConfirm(record.heatNo)}
          />
        </div>
      ),
    },
  ];

  const addNewHeat = async () => {
    if (addHeatLoading) return;
    setAddHeatLoading(true);
    const payload = {
      heatNo: String(newHeat.heatNo).padStart(6, "0"),
      turnDownTemp: newHeat.turnDownTemp,
      turnDownTempWv: newHeat?.turnDownTempWv,
      dutyId: smsGeneralInfo?.dutyId,
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
      message.error(error?.response?.data?.message || "Failed to add new heat.");
    } finally {
      setAddHeatLoading(false);
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

  const paginatedHeats = (formData?.heatDtlList || []).slice(
    (currentTablePage - 1) * tablePageSize,
    currentTablePage * tablePageSize
  );

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
        {/* Desktop / Tablet: Full Table View */}
        <div className="hidden sm:flex flex-col gap-3">
          <Table
            columns={columns}
            dataSource={formData.heatDtlList}
            bordered
            size="middle"
            pagination={{
              current: currentTablePage,
              pageSize: tablePageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20"],
              onChange: (page) => setCurrentTablePage(page),
              onShowSizeChange: (current, size) => handlePageSizeChange(size),
            }}
          />
          <div className="flex justify-start -mt-2 mb-2">
            <IconBtn
              icon={PlusOutlined}
              text="add new heat"
              onClick={() => setIsModalOpen(true)}
            />
          </div>
        </div>

        {/* Mobile: Clean Non-Scrollable Responsive Card View */}
        <div className="flex sm:hidden flex-col gap-3">
          {paginatedHeats.length > 0 ? (
            paginatedHeats.map((record, index) => {
              const globalIndex = (currentTablePage - 1) * tablePageSize + index;
              const prevRecord = globalIndex > 0 ? formData.heatDtlList[globalIndex - 1] : null;

              let isSequenceChanged = false;
              if (record.sequenceNo && prevRecord?.sequenceNo) {
                const currentPrefix = String(record.sequenceNo).split("/")[0];
                const prevPrefix = String(prevRecord.sequenceNo).split("/")[0];
                if (currentPrefix !== prevPrefix) {
                  isSequenceChanged = true;
                }
              }

              const h2Num = parseFloat(record.hydris);
              const isHighH2 = !isNaN(h2Num) && h2Num > 1.6;

              const isRejectedRemark = record.heatRemark && typeof record.heatRemark === 'string' && (
                record.heatRemark.toLowerCase().includes('nitrogen') ||
                record.heatRemark.toLowerCase().includes('oxygen') ||
                record.heatRemark.toLowerCase().includes('hydrogen')
              );

              return (
                <div
                  key={record.heatNo || index}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5 transition-all"
                  style={{ borderLeft: '4px solid #21808d' }}
                >
                  {/* Header: S/No, Heat No, Stage & Actions */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{globalIndex + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        Heat {record.heatNo}
                      </span>
                      {record.heatStage && (
                        <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                          {record.heatStage}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <IconBtn
                        icon={EditOutlined}
                        tooltipTitle="Edit Heat"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => navigate("/sms/sms/heatDtl", { state: { heatNo: record.heatNo } })}
                      />
                      <IconBtn
                        danger
                        icon={DeleteOutlined}
                        tooltipTitle="Delete Heat"
                        style={{ width: '32px', height: '32px' }}
                        onClick={() => showDeleteConfirm(record.heatNo)}
                      />
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-500 font-medium text-[11px]">Sequence No</span>
                      <span
                        className={`font-semibold mt-0.5 ${
                          isSequenceChanged ? 'text-blue-600 font-bold' : 'text-slate-800'
                        }`}
                      >
                        {record.sequenceNo || 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-col bg-slate-50 p-2 rounded-lg">
                      <span className="text-gray-500 font-medium text-[11px]">H2 (Hydris)</span>
                      <span className={`font-semibold mt-0.5 ${isHighH2 ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                        {record.hydris != null && record.hydris !== "" ? record.hydris : '-'}
                      </span>
                    </div>
                  </div>

                  {record.heatRemark && (
                    <div className="text-xs bg-slate-50 p-2 rounded-lg flex items-center justify-between gap-2">
                      <span className="text-gray-500 font-medium text-[11px]">Remark:</span>
                      <span className={`font-semibold ${isRejectedRemark ? 'text-red-600' : 'text-slate-700'}`}>
                        {record.heatRemark}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No heats available
            </div>
          )}

          {/* Mobile Footer & Pagination */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <IconBtn
              icon={PlusOutlined}
              text="add new heat"
              onClick={() => setIsModalOpen(true)}
            />
            <Pagination
              size="small"
              current={currentTablePage}
              pageSize={tablePageSize}
              total={formData?.heatDtlList?.length || 0}
              showSizeChanger={false}
              onChange={(page) => setCurrentTablePage(page)}
            />
          </div>
        </div>
      </section>

      <section className="mt-2">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-5 mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3.5 pb-2 border-b border-slate-200 flex items-center justify-between">
              <span>Equipment & Process Checklist</span>
              <span className="text-[11px] font-normal lowercase text-slate-400">select yes / no</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {booleanQuestions.map(({ key, label }) => {
                const isChecked = formData[key] === true;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isChecked
                        ? "bg-teal-50/40 border-teal-200 shadow-sm"
                        : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug flex-1 pr-2">
                      {label}
                    </span>
                    <div className="flex-shrink-0">
                      <Radio.Group
                        value={formData[key] ?? false}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                      >
                        <Radio.Button
                          value={true}
                          className="!px-3 !font-bold !text-xs !rounded-l-lg"
                        >
                          Yes
                        </Radio.Button>
                        <Radio.Button
                          value={false}
                          className="!px-3 !font-bold !text-xs !rounded-r-lg"
                        >
                          No
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <FormInputItem
              label="Make of Casting Powder Used"
              name="makeOfCastingPowder"
              value={formData.makeOfCastingPowder}
              onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
            />
            <FormInputItem
              label="Make of Hydris Probe used"
              name="makeOfHydrisProbe"
              value={formData.makeOfHydrisProbe}
              onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)}
            />
          </div>

          <div className="text-center mt-2">
            <Btn htmlType="submit">Save</Btn>
          </div>
        </Form>
      </section>

      <Modal
        title="Add new heat"
        open={isModalOpen}
        centered
        onCancel={() => {
          if (!addHeatLoading) {
            setIsModalOpen(false);
          }
        }}
        footer={null}
        destroyOnClose
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
            disabled={addHeatLoading}
          />
          <FormInputItem
            label="Turn Down Temperature"
            placeholder="1630"
            name="turnDownTemp"
            value={newHeat.turnDownTemp}
            onChange={(_, value) => handleNewHeatValChange("turnDownTemp", value)}
            disabled={addHeatLoading}
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
            disabled={addHeatLoading}
          />
          <div className="flex justify-end items-center gap-3 mt-6">
            <Button
              onClick={() => setIsModalOpen(false)}
              disabled={addHeatLoading}
              className="!h-10 !rounded-lg !px-6 flex items-center justify-center font-medium"
            >
              Cancel
            </Button>
            <Btn
              htmlType="submit"
              loading={addHeatLoading}
              disabled={addHeatLoading}
              className="!h-10 !rounded-lg !px-6 flex items-center justify-center font-medium"
            >
              {addHeatLoading ? "Adding..." : "Add"}
            </Btn>
          </div>
        </Form>
      </Modal>
    </FormContainer>
  );
};

export default SmsHeatSummary;
