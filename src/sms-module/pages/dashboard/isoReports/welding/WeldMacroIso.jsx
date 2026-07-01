/* eslint-disable */
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { apiCall } from "../../../../utils/CommonFunctions";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { Button, message } from "antd";

const WeldMacroIso = () => {
  const [formData, setFormData] = useState({
    date: "",
    jointNumber: "",
    railSection: "",
    machineNumber: "",
    loadApplied: "",
    isBroken: "",
  });

  const { token } = useSelector((state) => state.auth);

  const repRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => repRef.current,
    documentTitle: "welding_macro_iso", // Set custom filename
  });

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getWeldMacroDtls",
        token,
        formData
      );
      console.log("WeldMacroIso API Response:", data);
      if (data?.responseData) {
        setFormData({ ...data.responseData, jointNumber: formData.jointNo });
      } else {
        message.warning("No macro data found for the specified joint number.");
        setFormData({jointNumber: formData.jointNo});
      }
    } catch (error) {
      console.error("WeldMacroIso API Error:", error);
      message.error(`Failed to fetch macro data: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <>
      <SearchFilter showJn onFinish={onFinish} />
      <div className="a4-container" ref={repRef}>
        <IsoHeader
          hinTitle="वेल्ड किए गए जोड़ों की मैक्रो परीक्षण के लिए प्रारूप"
          engTitle="FORMAT FOR MICRO EXAMINATION OF WELDED JOINTS  <br /> Clause No. 8.5 of ISO:9001:2015"
          col3AdtnlLine="APPROVED DIVIONAL HEAD"
        />
        <Subheading formatNo=" F/CR-BSP/7.5/20/0" />
        <div style={{ overflowX: "auto" }} className="iso-table">
          <table
            className="iso-table"
            border="1"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              textAlign: "center",
            }}
          >
            <thead>
              {/* Table Title Row */}
              <tr>
                <th colSpan={6} className="cell-style">
                  वेल्डेड जोड़ों (जॉइंट) का मैक्रो परीक्षण / MACRO EXAMINATION
                  OF WELDED JOINTS
                </th>
              </tr>

              {/* Header Row */}
              <tr>
                <th className="cell-style">
                  क्र. सं. <br /> S. No
                </th>
                <th className="cell-style" colSpan={2}>
                  विवरण <br /> Description
                </th>
                <th className="cell-style" colSpan={2}>
                  पर्यवेक्षण <br /> Observation
                </th>
                <th className="cell-style">
                  टिप्पणियाँ <br /> Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="cell-style text-left">01.</td>
                <td className="cell-style text-left" colSpan={2}>
                  तिथि, माह और वर्ष / Date, Month and Year
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {formData.date}
                </td>
                <td className="cell-style text-left"></td>
              </tr>

              <tr>
                <td className="cell-style text-left">02.</td>
                <td className="cell-style text-left" colSpan={2}>
                  जोड़ (जॉइंट)संख्या / Joint No.
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {formData.jointNumber}
                </td>
                <td className="cell-style text-left"></td>
              </tr>

              <tr>
                <td className="cell-style text-left">03.</td>
                <td className="cell-style text-left" colSpan={2}>
                  रेल सेक्शन और यू.टी.एस./ Rail Section & UTS
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {formData.railSection}
                </td>
                <td className="cell-style text-left"></td>
              </tr>

              <tr>
                <td className="cell-style text-left">04.</td>
                <td className="cell-style text-left" colSpan={2}>
                  मशीन जिस पर वेल्ड किया गया / Machine on which Welded
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {formData.machineNumber}
                </td>
                <td className="cell-style text-left"></td>
              </tr>

              {/* Single Serial Number 05 for both instances */}
              <tr>
                <td className="cell-style text-left" rowSpan={6}>
                  05.
                </td>
                <td className="cell-style text-left" rowSpan={4}>
                  हीट अफेक्टेड ज़ोन की सीमा (मि.मी.) <br />
                  Extent of Heat Affected Zone (mm)
                </td>
                <td className="cell-style text-left"></td>{" "}
                {/* Empty cell above Web */}
                <td className="cell-style text-left">Left</td>{" "}
                {/* Left under Observation */}
                <td className="cell-style text-left">Right</td>{" "}
                {/* Right under Observation */}
                <td className="cell-style text-left"></td>
              </tr>
              <tr>
                <td className="cell-style text-left">Web</td>
                <td className="cell-style text-left">{formData.webL}</td>{" "}
                {/* Empty beside Web */}
                <td className="cell-style text-left">{formData.webL}</td>{" "}
                {/* Empty beside Web */}
                <td className="cell-style text-left"></td>
              </tr>
              <tr>
                <td className="cell-style text-left">Head</td>
                <td className="cell-style text-left">{formData.headL}</td>{" "}
                {/* Empty beside Head */}
                <td className="cell-style text-left">{formData.headR}</td>{" "}
                {/* Empty beside Head */}
                <td className="cell-style text-left"></td>
              </tr>
              <tr>
                <td className="cell-style text-left">Foot</td>
                <td className="cell-style text-left">{formData.footL}</td>{" "}
                {/* Empty beside Foot */}
                <td className="cell-style text-left">{formData.footR}</td>{" "}
                {/* Empty beside Foot */}
                <td className="cell-style text-left"></td>
              </tr>

              {/* Second instance of Heat Affected Zone under the same S. No 05 */}
              <tr>
                <td className="cell-style text-left" rowSpan={2}>
                  हीट अफेक्टेड ज़ोन की सीमा (मि.मी.) <br />
                  Extent of Heat Affected Zone (mm)
                </td>
                <td className="cell-style text-left">Side-1</td>
                <td className="cell-style text-left"></td>{" "}
                {/* Empty beside Side-1 */}
                <td className="cell-style text-left"></td>{" "}
                {/* Empty beside Side-1 */}
                <td className="cell-style text-left"></td>
              </tr>
              <tr>
                <td className="cell-style text-left">Side-2</td>
                <td className="cell-style text-left"></td>{" "}
                {/* Empty beside Side-2 */}
                <td className="cell-style text-left"></td>{" "}
                {/* Empty beside Side-2 */}
                <td className="cell-style text-left"></td>
              </tr>

              <tr>
                <td className="cell-style text-left">06.</td>
                <td className="cell-style text-left" colSpan={2}>
                  विज़ुअल परीक्षण का परिणाम (इससे मुक्त: क्रैक, संलयन की कमी या
                  कोई समावेशन) <br />
                  Result of Visual Examination (Free from: Crack, Lack of
                  Fusion, or any Inclusion)
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {/* 06. */}
                </td>
                <td className="cell-style text-left">{/* 06. */}</td>
              </tr>
              <tr>
                <td className="cell-style text-left">06.</td>
                <td className="cell-style text-left" colSpan={2}>
                  विज़ुअल परीक्षण का परिणाम (इससे मुक्त: क्रैक, संलयन की कमी या
                  कोई समावेशन) <br />
                  Result of Visual Examination (Free from: Crack, Lack of
                  Fusion, or any Inclusion)
                </td>
                <td className="cell-style text-left" colSpan={2}>
                  {formData.remark}
                </td>
                <td className="cell-style text-left">{/* 06. */}</td>
              </tr>
              <tr>
                <td className="cell-style text-left">07.</td>
                <td className="cell-style text-left" colSpan={2}>
                  टिप्पणियाँ / Remarks
                </td>
                <td className="cell-style text-left" colSpan={2}></td>
                <td className="cell-style text-left">{/* 06. */}</td>
              </tr>
              <tr>
                <td className="cell-style text-left">08.</td>
                <td className="cell-style text-left" colSpan={2}>
                  हस्ताक्षर / Signature
                </td>
                <td className="cell-style text-left" colSpan={2}></td>
                <td className="cell-style text-left">{/* 06. */}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Button
          onClick={handlePrint}
          className="my-8 w-full mx-auto bg-darkBlueHover text-white"
        >
          Print
        </Button>
      </div>
    </>
  );
};

export default WeldMacroIso;
