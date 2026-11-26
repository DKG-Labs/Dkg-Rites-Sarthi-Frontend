/* eslint-disable */
import React, { useRef, useState } from "react";
import { Button } from "antd";
import { useReactToPrint } from "react-to-print";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import RailFinishingSheet, { dateShift } from "./RailFinishingSheet";

/** Verification Report (Rail Finishing) - URM, printed form F/CR-BSP/7.5/17/14 */
const FinishingVerification = () => {
  const repRef = useRef();
  const { token } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: repRef, // react-to-print v3
    documentTitle: "rolling_finishing_verification_urm",
  });

  const onFinish = async (values) => {
    setFilters(values);
    try {
      const res = await apiCall("POST", "/iso/getRollingFinishingDtls", token, { ...values, mill: "URM" });
      setData(res?.data?.responseData || null);
    } catch (error) {
      setData(null);
    }
  };

  return (
    <>
      <SearchFilter showDate showShift showRailSection onFinish={onFinish} />
      <div className="a4-container" ref={repRef}>
        <IsoHeader
          engTitle="TITLE: FORMAT FOR VERIFICATION <br /> REPORT (RAIL FINISHING) <br /> Clause No. 8.5 of ISO 9001:2015"
          hinTitle="शीर्षक: सत्यापन रिपोर्ट के लिए प्रारूप <br /> (रेल फिनिशिंग)"
          col3AdtnlLine="APPROVED DIVISIONAL HEAD"
          issueNo="01"
        />
        <Subheading
          formatNo="F/CR-BSP/7.5/17/14"
          page="1 OF 1"
          pageRev="NIL"
          effDate=""
          dsVis
          dsVal={dateShift(filters.date, filters.shift)}
          secVis
          secVal={filters.railSection || ""}
        />
        <h1 className="text-center font-semibold my-2">
          सत्यापन रिपोर्ट - यू आर एम / VERIFICATION REPORT - URM
          <br />
          <span className="text-xs">(रेल फिनिशिंग) / (Rail Finishing)</span>
        </h1>
        <RailFinishingSheet mill="URM" data={data} />
      </div>
      <Button onClick={handlePrint} className="my-8 w-full mx-auto bg-darkBlueHover text-white">Print</Button>
    </>
  );
};

export default FinishingVerification;
