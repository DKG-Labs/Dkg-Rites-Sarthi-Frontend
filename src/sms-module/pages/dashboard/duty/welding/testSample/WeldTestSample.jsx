/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import FormContainer from "../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/weldingInspection/WeldingInspection.json";
import {EditOutlined, PlusOutlined } from "@ant-design/icons";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { Checkbox, Divider, Form, message } from "antd";
import IconBtn from "../../../../../components/DKG_IconBtn";
import { useNavigate } from "react-router-dom";
import Btn from "../../../../../components/DKG_Btn";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import { useSelector } from "react-redux";
import { HARDNESS, MACRO, MICRO, TLT } from "../../../../../utils/Constants";
import TableComponent from "../../../../../components/DKG_Table";
import { apiCall } from "../../../../../utils/CommonFunctions";

const recentTestSummaryColumn = [
  {
    title: "Test",
    dataIndex: "testType",
    key: "testType",
    align: "center",
    // filterable: true,
  },
  {
    title: "Joint Number",
    dataIndex: "jointNo",
    key: "jointNo",
    align: "center",
    // filterable: true,
  },
  {
    title: "Date & Shift",
    dataIndex: "dateShift",
    key: "dateShift",
    align: "center",
    render: (_, record) => record.date + " " + record.shift,
    // filterable: true,
  },
  {
    title: "Counter",
    dataIndex: "counter",
    key: "counter",
    align: "center",
  },
];

const {
  railGradeDropdownList,
  railSectionList,
  weldNumberList,
  samplesDeclaredTableData,
  parameterStatusList,
} = data;

const WeldTestSample = () => {
  const [form] = Form.useForm();
  const [checkedValues, setCheckedValues] = useState([]);
  const options = [TLT, HARDNESS, MACRO, MICRO];
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [recentTestSummary, setRecentTestSummary] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [formData, setFormData] = useState({
    railSection: "",
    railGrade: "",
    plant: "",
    tltJointNo: "",
    hardnessJointNo: "",
    microJointNo: "",
    macroJointNo: "",
    tltStatus: null,
    tltStatusDesc: null,
    hardnessStatus: null,
    hardnessStatusDesc: null,
    microStatus: null,
    microStatusDesc: null,
    macroStatus: null,
    macroStatusDesc: null,
  });

  const weldingGeneralInfo = useSelector((state) => state.weldingDuty);
  const { token } = useSelector((state) => state.auth);

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev };
      updatedData[fieldName] = value;

      if (
        fieldName === "tltStatus" ||
        fieldName === "hardnessStatus" ||
        fieldName === "microStatus" ||
        fieldName === "macroStatus"
      ) {
        updatedData[`${fieldName}Desc`] = value ? "OK" : "NOT OK";
      }
      return updatedData;
    });
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const populateTableData = useCallback(() => {
    setTableData([...samplesDeclaredTableData]);
  }, []);

  useEffect(() => {
    populateTableData();
  }, [populateTableData]);

  const handleRowClick = ({ testType, machineNo, jointNo }) => {
    if (testType === TLT) {
      navigate("/welding/tltTestDetails", { state: { machineNo, jointNo } });
    } else if (testType === HARDNESS) {
      navigate("/welding/hardnessTestDetails", {
        state: { machineNo, jointNo },
      });
    } else if (testType === MICRO) {
      navigate("/welding/microTestDetails", { state: { machineNo, jointNo } });
    } else {
      navigate("/welding/macroTestDetails", { state: { machineNo, jointNo } });
    }
  };

  const handleFormSubmit = async () => {
    const testTypes = [
      { type: TLT, jointKey: "tltJointNo", statusKey: "tltStatus" },
      {
        type: HARDNESS,
        jointKey: "hardnessJointNo",
        statusKey: "hardnessStatus",
      },
      { type: MICRO, jointKey: "microJointNo", statusKey: "microStatus" },
      { type: MACRO, jointKey: "macroJointNo", statusKey: "macroStatus" },
    ];

    const payloadList = testTypes
      .filter(({ type }) => checkedValues.includes(type))
      .map(({ type, jointKey, statusKey }) => ({
        testType: type,
        jointNo: formData[jointKey],
        railGrade: formData.railGrade,
        railSection: formData.railSection,
        plant: formData.plant,
        status: formData[statusKey],
        dutyId: weldingGeneralInfo.dutyId,
      }));

    try {
      await Promise.all(
        payloadList.map((payload) =>
          apiCall("POST", "/welding/saveWeldingTestSample", token, payload)
        )
      );
      message.success("Data saved successfully.");
      setShowForm(false);
      setFormData({
        railSection: "",
        railGrade: "",
        plant: "",
        tltJointNo: "",
        hardnessJointNo: "",
        microJointNo: "",
        macroJointNo: "",
        tltStatus: null,
        tltStatusDesc: null,
        hardnessStatus: null,
        hardnessStatusDesc: null,
        microStatus: null,
        microStatusDesc: null,
        macroStatus: null,
        macroStatusDesc: null,
      });

      populateData();
    } catch (error) {
      console.error("Error submitting payloads:", error);
    }
  };

  const columns = [
    {
      title: "Test",
      dataIndex: "testType",
      key: "testType",
      align: "center",
      filterable: true,
    },
    {
      title: "Joint Number",
      dataIndex: "jointNo",
      key: "jointNo",
      align: "center",
      filterable: true,
    },
    {
      title: "Date & Shift",
      dataIndex: "dateShift",
      key: "dateShift",
      align: "center",
      render: (_, record) => record.date + " " + record.shift,
      filterable: true,
    },
    {
      title: "Testing",
      align: "center",
      render: (_, record) => (
        <IconBtn icon={EditOutlined} onClick={() => handleRowClick(record)} />
      ),
    },
  ];

  const handleClick = () => {
    navigate("/sms/welding/home");
  };

  const populateData = useCallback(async () => {
    try {
      const [testSampleDtlData, recentTestSummaryData] = await Promise.all([apiCall("GET", "/welding/getPendingTestSampleDtl", token), apiCall("GET", "/welding/getRecentTestSummary", token)]);
      setTableData(testSampleDtlData?.data?.responseData || []);
      setRecentTestSummary(recentTestSummaryData?.data?.responseData || []);

    } catch (error) {}
  }, [token]);

  useEffect(() => {
    populateData();
  }, [populateData]);

  return (
    <FormContainer>
      <SubHeader title="Weld Periodic Test Sample" link="/welding/home" />
      <GeneralInfo data={weldingGeneralInfo} />

      {/* <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4">
          <div className="flex items-center gap-x-2">
            <FilterFilled />
            <FormDropdownItem
              label="Rail Grade"
              name="railGrade"
              dropdownArray={railGradeDropdownList}
              valueField="key"
              visibleField="value"
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-x-2">
            <FilterFilled />
            <FormDropdownItem
              label="Rail Section"
              name="railSection"
              dropdownArray={railSectionList}
              valueField="key"
              visibleField="value"
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1">
          <div className="flex items-center gap-x-2">
            <FilterFilled />
            <FormDropdownItem
              label="Weld Machine Number"
              name="weldNumber"
              dropdownArray={weldNumberList}
              valueField="key"
              visibleField="value"
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div> */}

      <Divider className="!m-0">Last Test Details</Divider>
      <TableComponent columns={recentTestSummaryColumn} dataSource={recentTestSummary} hideManageColumns hideExport />

      <Divider className="!m-0">Samples Declared for Testing</Divider>
      <div className="relative">
        <TableComponent
          columns={columns}
          dataSource={tableData}
          hideExport
          hideManageColumns
          //   scroll={{ x: true }}
          //   bordered
          //   pagination={{
          //     current: currentTablePage,
          //     pageSize: tablePageSize,
          //     showSizeChanger: true,
          //     pageSizeOptions: ["10", "15", "20"],
          //     onChange: (page) => setCurrentTablePage(page),
          //     onShowSizeChange: (current, size) => handlePageSizeChange(size),
          //   }}
        />

        <IconBtn
          icon={PlusOutlined}
          text="Declare new Sample for Testing"
          onClick={handleShowForm}
          className="w-fit absolute bottom-4"
        />
      </div>

      {showForm && (
        <Form
          form={form}
          layout="vertical"
          initialValues={formData}
          onFinish={handleFormSubmit}
        >
          <div className="!bg-offWhite opacity-80 flex flex-col border p-2 border-gray-100 rounded-md mb-4 shadow-[4px_4px_4px_4px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-1">
              <Checkbox.Group
                options={options}
                value={checkedValues}
                onChange={(checkedValues) => setCheckedValues(checkedValues)}
                className="mb-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
              <FormDropdownItem
                label="Rail Grade"
                name="railGrade"
                formField="railGrade"
                dropdownArray={railGradeDropdownList}
                valueField="key"
                visibleField="value"
                onChange={handleChange}
                className="w-full"
                required
              />
              <FormDropdownItem
                label="Rail Section"
                name="railSection"
                formField="railSection"
                dropdownArray={railSectionList}
                valueField="key"
                visibleField="value"
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1">
              <FormDropdownItem
                label="Weld Machine Number"
                name="plant"
                formField="plant"
                dropdownArray={weldNumberList}
                valueField="key"
                visibleField="value"
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>

            {checkedValues.includes(TLT) && (
              // <FormBody initialValues={formData}>
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Sample Joint No. (TLT)"
                  name="tltJointNo"
                  onChange={handleChange}
                  required
                />
                <FormDropdownItem
                  label="Parameter Status"
                  name="tltStatusDesc"
                  formField="tltStatus"
                  dropdownArray={parameterStatusList}
                  valueField="key"
                  visibleField="value"
                  onChange={handleChange}
                  required
                />
              </div>
              // </FormBody>
            )}

            {checkedValues.includes(HARDNESS) && (
              // <FormBody initialValues={formData}>
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Sample Joint No. (Hardness)"
                  name="hardnessJointNo"
                  onChange={handleChange}
                  required
                />
                <FormDropdownItem
                  label="Parameter Status"
                  name="hardnessStatusDesc"
                  formField="hardnessStatus"
                  dropdownArray={parameterStatusList}
                  valueField="key"
                  visibleField="value"
                  onChange={handleChange}
                  required
                />
              </div>
              // </FormBody>
            )}

            {checkedValues.includes(MICRO) && (
              // <FormBody initialValues={formData}>
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Sample Joint No. (Micro)"
                  name="microJointNo"
                  onChange={handleChange}
                  required
                />
                <FormDropdownItem
                  label="Parameter Status"
                  name="microStatusDesc"
                  formField="microStatus"
                  dropdownArray={parameterStatusList}
                  valueField="key"
                  visibleField="value"
                  onChange={handleChange}
                  required
                />
              </div>
              // </FormBody>
            )}

            {checkedValues.includes(MACRO) && (
              // <FormBody initialValues={formData}>
              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4">
                <FormInputItem
                  label="Sample Joint No. (Macro)"
                  name="macroJointNo"
                  onChange={handleChange}
                  required
                />
                <FormDropdownItem
                  label="Parameter Status"
                  name="macroStatusDesc"
                  formField="macroStatus"
                  dropdownArray={parameterStatusList}
                  valueField="key"
                  visibleField="value"
                  onChange={handleChange}
                  required
                />
              </div>
              // </FormBody>
            )}

            <div className="flex justify-center">
              <Btn htmlType="submit" className="w-36">
                Save
              </Btn>
            </div>
          </div>
        </Form>
      )}
      <div className="flex justify-center mt-6">
        <Btn onClick={handleClick} className="w-36">
          OK
        </Btn>
      </div>
    </FormContainer>
  );
};

export default WeldTestSample;
