/* eslint-disable */
import React, { useRef, useState } from "react";
import { Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { dateShift } from "./isoRows";
import Rail60E1A1Sheet from "./Rail60E1A1Sheet";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";

const RollingControlIso60E1A1Urm = () => {
  const [formData, setFormData] = useState({});
  /* tableData */

  const railData = [
    {
      key: "1",
      type: "IRS52",
      height: "156 (+0.8/-0.4)",
      head: "67 (± 0.5)",
      flange: "136 (± 1.0)",
      web: "15.5 (+1.0/-0.5)",
      asymmetry: "± 1.2",
      footToeThickness: "---",
      heightFishing: "---",
      weightTaken: "51.89 (+1.5/-0.5)",
      crownProfile: "---",
      footFlatness: "0.4 mm (max.)",
      remarks: "---",
    },
    {
      key: "2",
      type: "60 E1",
      height: "172 (±0.6)",
      head: "72 (±0.5)",
      flange: "150 (±1.0)",
      web: "16.5 (+1.0/-0.5)",
      asymmetry: "± 1.2",
      footToeThickness: "11.5 (+0.75/-0.5)",
      heightFishing: "89.50 (±0.6)",
      weightTaken: "60.21 (+1.5/-0.5)",
      crownProfile: "---",
      footFlatness: "0.3 mm (max.)",
      remarks: "---",
    },
  ];

  /* columns */

  const { token } = useSelector((state) => state.auth);

  const mergeHeatDetails = (heatDtlList, formData) => {
    const mergedData = heatDtlList?.map((heat) => ({
      sampleNo: heat.sampleNumber,
      time: heat.timing,
      heatNo: heat.heatNumber,
      height: heat.height,
      head: heat.head,
      flange: heat.flange,
      web: heat.web,
      asymmetry: heat.asy,
      footToeThickness: heat.footToe,
      heightFishing: heat.fishingHeight,
      weightTaken: heat.weight,
      crownProfile: heat.crownProfile,
      footFlatness: heat.footFlatness,
      remarks: heat.remark,
    }));

    return {
      date: formData.date,
      shift: formData.shift,
      railGrade: formData.railGrade,
      railSection: formData.railSection,
      heatDtlList: mergedData,
      vernierNumber: heatDtlList?.[0]?.vernierNumber,
      micrometerNumber: heatDtlList?.[0]?.micrometerNumber,
      numberOfGauges: heatDtlList?.[0]?.numberOfGauges,
    };
  };

  const onFinish = async (formData) => {
    console.log("ONFINISH: ", formData);
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getRollingControlDtls",
        token,
        { ...formData, railSection: "60E1A1", mill: "URM" }
      );
      setFormData(mergeHeatDetails(data?.responseData, formData));
    } catch (error) {
      console.log(error);
    }
  };

  const repRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: repRef,   // react-to-print v3
    documentTitle: "rolling_control_60e1a1_urm", // Set custom filename
  });

  return (
    <div>
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
      <div className="flex justify-center mt-4">
        <Button type="primary" onClick={handlePrint}>
          Print Report
        </Button>
      </div>
    </div>
  );
};

export default RollingControlIso60E1A1Urm;
