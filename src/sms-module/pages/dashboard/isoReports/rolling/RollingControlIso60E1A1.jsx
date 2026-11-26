/* eslint-disable */
import { Button, Table } from "antd";
import React, { useRef, useState } from "react";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { dateShift } from "./isoRows";
import Rail60E1A1Sheet from "./Rail60E1A1Sheet";

/* customRsL */

const RollingControlIso60E1A1 = () => {
  const [formData, setFormData] = useState({});
  /* tableData */

  /* railData */
  /* columns */

  const { token } = useSelector((state) => state.auth);
  console.log("Fprmdata: ", formData);

  const mergeHeatDetails = (data, formData) => {
    if (!data || data.length === 0) return { shift: formData.shift, date: formData.date, railGrade: formData.railGrade, heatDtlList: [] };

    // Pick vernierNumber, micrometerNumber, numberOfGauges from the first object
    const { vernierNumber, micrometerNumber, numberOfGauges } = data[0];

    // Merge all heatDtlList arrays
    const heatDtlList = data.flatMap((item) => item.heatDtlList || []);

    return {
      vernierNumber,
      micrometerNumber,
      numberOfGauges,
      heatDtlList,
      shift: formData?.shift,
      date: formData?.date,
      railGrade: formData?.railGrade,
    };
  };

  const onFinish = async (formData) => {
    console.log("ONFINISH: ", formData)
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getRollingControlDtls",
        token,
        { ...formData, railSection: "60E1A1", mill: "RSM" }
      );
      setFormData(mergeHeatDetails(data?.responseData, formData));
    } catch (error) {
      console.log(error);
    }
  };

  const repRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: repRef,   // react-to-print v3
    documentTitle: "rolling_control_60e1a1", // Set custom filename
  });
  return (
    <div>
      {/* <Table dataSource={railData} columns={columns} pagination={false} bordered  title={() => (
        <strong style={{ fontSize: "16px", textAlign: "center", display: "block" }}>
          IRS T-12-2009 के अनुसार निर्दिष्ट आयाम | Specified dimension as per IRS T-12-2009
        </strong>
      )}/>; */}

      <SearchFilter
        showDate
        showShift
        showRailGrade
        // showSms
        // showRailSection
        // customRsL = {customRsL}
        onFinish={onFinish}
      />
      <div className="a4-container" ref={repRef}>
        <Rail60E1A1Sheet
          dateShiftText={dateShift(formData?.date, formData?.shift)}
          micrometerNo={formData?.micrometerNumber}
          vernierNo={formData?.vernierNumber}
          gauges={formData?.numberOfGauges}
          rows={formData?.heatDtlList || []}
        />
      </div>
      <Button
        onClick={handlePrint}
        className="my-8 w-full mx-auto bg-darkBlueHover text-white"
      >
        Print
      </Button>
    </div>
  );
};

export default RollingControlIso60E1A1;
