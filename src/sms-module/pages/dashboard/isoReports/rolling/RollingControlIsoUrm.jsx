/* eslint-disable */
import React, { useRef, useState } from "react";
import { Button } from "antd";
import { useReactToPrint } from "react-to-print";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";

const RollingControlIsoUrm = () => {
  const [formData, setFormData] = useState([]);
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

  const customRsL = [
    { key: "60E1", value: "60E1" },
    { key: "52E1", value: "52E1" },
  ];

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
    try {
      const { data } = await apiCall("POST", "/iso/getRollingControlDtls", token, { ...formData, mill: "URM" });
      setFormData(mergeHeatDetails(data?.responseData, formData));
    } catch (error) {
      console.log(error);
    }
  };

  const repRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => repRef.current,
    documentTitle: "rolling_control_urm", // Set custom filename
  });

  return (
    <div>
      <SearchFilter
        showDate
        showShift
        showRailGrade
        showRailSection
        customRsL={customRsL}
        onFinish={onFinish}
      />
      <div className="a4-container" ref={repRef}>
        <IsoHeader
          engTitle="FORMAT FOR ROLLING STAGE CONTROL (URM) <br /> (Clause No. 8.5 of ISO 9001:2015)"
          hinTitle="रोलिंग चरण नियंत्रण के लिए प्रारूप (यूआरएम)"
          col3AdtnlLine="APPROVED DIVISIONAL HEAD"
        />
        <Subheading
          formatNo="F/CR-BSP/7.5/17/05"
          page="1 OF 1"
          pageRev="NIL"
          effDate="12/05/2021"
          dsVis
          dsVal={formData.date + " - " + formData.shift}
          grdVis
          grdVal={formData.railGrade}
          stdWtVis
          stdWtVal={formData.heatDtlList?.[0]?.weight}
          mmVis
          mmVal={formData.micrometerNumber}
          vVis
          vVal={formData.vernierNumber}
          ggVis
          ggVal={formData.numberOfGauges}
        />
        <div style={{ overflowX: "auto" }} className="iso-table">
          <table className="table-style iso-table">
            <thead>
              <tr>
                <th className="cell-style" rowSpan="2">
                  नमूना क्र. <br />
                  Sample No.
                </th>
                <th className="cell-style" rowSpan="2">
                  समय <br />
                  Time
                </th>
                <th className="cell-style" rowSpan="2">
                  हीट नंबर <br />
                  Heat No.
                </th>
                <th className="cell-style" colSpan="11">
                  रेल आयाम (मिमी में) <br />
                  Rail Dimensions (in mm)
                </th>
              </tr>
              <tr>
                <th className="cell-style">
                  ऊंचाई <br />
                  Height
                </th>
                <th className="cell-style">
                  हेड चौड़ाई <br />
                  Head Width
                </th>
                <th className="cell-style">
                  फ्लेंज चौड़ाई <br />
                  Flange Width
                </th>
                <th className="cell-style">
                  वेब मोटाई <br />
                  Web Thickness
                </th>
                <th className="cell-style">
                  असमानता <br />
                  Asymmetry
                </th>
                <th className="cell-style">
                  फुट टो मोटाई <br />
                  Foot Toe Thickness
                </th>
                <th className="cell-style">
                  फिशिंग ऊंचाई <br />
                  Fishing Height
                </th>
                <th className="cell-style">
                  वजन लिया गया <br />
                  Weight Taken (kg/m)
                </th>
                <th className="cell-style">
                  क्राउन प्रोफाइल <br />
                  Crown Profile
                </th>
                <th className="cell-style">
                  फुट फ्लैटनेस <br />
                  Foot Flatness
                </th>
                <th className="cell-style">
                  टिप्पणी <br />
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {railData.map((item, index) => (
                <tr key={index}>
                  <td className="cell-style">{item.type}</td>
                  <td className="cell-style">---</td>
                  <td className="cell-style">---</td>
                  <td className="cell-style">{item.height}</td>
                  <td className="cell-style">{item.head}</td>
                  <td className="cell-style">{item.flange}</td>
                  <td className="cell-style">{item.web}</td>
                  <td className="cell-style">{item.asymmetry}</td>
                  <td className="cell-style">{item.footToeThickness}</td>
                  <td className="cell-style">{item.heightFishing}</td>
                  <td className="cell-style">{item.weightTaken}</td>
                  <td className="cell-style">{item.crownProfile}</td>
                  <td className="cell-style">{item.footFlatness}</td>
                  <td className="cell-style">{item.remarks}</td>
                </tr>
              ))}
              {formData?.heatDtlList?.map((item, index) => (
                <tr key={index}>
                  <td className="cell-style">{item.sampleNo}</td>
                  <td className="cell-style">{item.time}</td>
                  <td className="cell-style">{item.heatNo}</td>
                  <td className="cell-style">{item.height}</td>
                  <td className="cell-style">{item.head}</td>
                  <td className="cell-style">{item.flange}</td>
                  <td className="cell-style">{item.web}</td>
                  <td className="cell-style">{item.asymmetry}</td>
                  <td className="cell-style">{item.footToeThickness}</td>
                  <td className="cell-style">{item.heightFishing}</td>
                  <td className="cell-style">{item.weightTaken}</td>
                  <td className="cell-style">{item.crownProfile}</td>
                  <td className="cell-style">{item.footFlatness}</td>
                  <td className="cell-style">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-center mt-4">
        <Button type="primary" onClick={handlePrint}>
          Print Report
        </Button>
      </div>
    </div>
  );
};

export default RollingControlIsoUrm;
