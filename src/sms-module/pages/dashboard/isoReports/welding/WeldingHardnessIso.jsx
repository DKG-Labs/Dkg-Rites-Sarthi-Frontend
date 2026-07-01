/* eslint-disable */
import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import { apiCall } from "../../../../utils/CommonFunctions";
import { Button, message } from "antd";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";

const WeldingHardnessIso = () => {
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
    documentTitle: "sms_chemical_analysis", // Set custom filename
  });

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getWeldHardnessDtls",
        token,
        formData
      );
      console.log("WeldingHardnessIso API Response:", data);
      if (data?.responseData) {
        setFormData({...data.responseData, jointNumber: formData.jointNo});
      } else {
        message.warning("No hardness data found for the specified joint number.");
        setFormData({jointNumber: formData.jointNo});
      }
    } catch (error) {
      console.error("WeldingHardnessIso API Error:", error);
      message.error(`Failed to fetch hardness data: ${error.response?.data?.message || error.message}`);
    }
  };
  return (
    <>
    <SearchFilter showJn onFinish={onFinish} />
    <div className="a4-container" ref={repRef}>
    <IsoHeader
          hinTitle=" वेल्ड किए गए जोड़ों के कठोरता (Hardness) परीक्षण के लिए प्रारूप"
          engTitle="FORMAT FOR HARDNESS TESTING OF WELDED JOINTS <br /> Clause No. 8.5 of ISO:9001:2015"
          col3AdtnlLine="APPROVED DIVIONAL HEAD"
        />
        <Subheading formatNo=" F/CR-BSP/7.5/20/04" />
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
            <tr>
              <th colSpan={3} className="cell-style">
                वेल्डेड जोड़ों (जॉइंटस) कठोरता (Hardness) परीक्षण <br />
                HARDNESS TEST OF WELDED JOINTS
              </th>
            </tr>
          </thead>
          <thead>
            <tr>
              <th
                rowSpan="2"
                //   style={{ padding: "5px", border: "1px solid black" }}
                className="cell-style"
              >
                क्र. सं. <br /> S. No
              </th>
              <th
                rowSpan="2"
                //   style={{ padding: "5px", border: "1px solid black" }}
                className="cell-style"
              >
                विवरण <br /> Description
              </th>
              <th
                rowSpan="2"
                //   style={{ padding: "5px", border: "1px solid black" }}
                className="cell-style"
              >
                पर्यवेक्षण <br /> Observation
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="cell-style text-left">01.</td>
              <td className="cell-style text-left">
                तिथि, माह और वर्ष /Date, Month and Year
              </td>
              <td className="cell-style text-left">{formData.date}</td>
              {/* <td className="cell-style text-left"></td> */}
            </tr>
            <tr>
              <td className="cell-style text-left">02.</td>
              <td className="cell-style text-left">
                जोड़ (जॉइंट)संख्या /Joint No.
              </td>
              <td className="cell-style text-left">{formData.jointNumber}</td>
              {/* <td className="cell-style text-left"></td> */}
            </tr>
            <tr>
              <td className="cell-style text-left">03.</td>
              <td className="cell-style text-left">
                रेल सेक्शन और यू.टी.एस./ Rail Section & UTS
              </td>
              <td className="cell-style text-left">{formData.railSection}</td>
              {/* <td className="cell-style text-left"></td> */}
            </tr>
            <tr>
              <td className="cell-style text-left">
                04.
              </td>
              <td className="cell-style text-left">
                <div className="text-left border-b border-black p-1">
                  हाडŊनेस(बी.एच.एन.) /Hardness (BHN)
                </div>
                <div className="text-left border-b border-black p-1">
                  पैरŐट रेल/ Parent Rail
                </div>
                <div className="text-left border-b border-black p-1">
                  हीट प्रभावित क्षेत्र /Heat Affected Zone
                </div>
                <div className="text-left p-1">
                  डिफ्लेक्शन विचलन (20 एच.बी. अधिकतम) / Deviation (20 HB Max.)
                </div>
              </td>
              <td className="cell-style text-left">
                <div className="text-left border-b border-black p-1 font-semibold flex justify-between">
                  <div>
                    बाईं तरफ / <br /> Left Side
                  </div>
                  <div>
                    दाईं तरफ / <br /> Right Side
                  </div>
                </div>
                <div className="text-left border-b border-black p-1 flex justify-between">
                  <div>{formData.parentHardnessL}</div>
                  <div>{formData.parentHardnessR}</div>
                </div>
                <div className="text-left border-b border-black p-1 flex justify-between">
                  <div>{formData.hazHardnessL}</div>
                  <div>{formData.hazHardnessR}</div>
                </div>
                <div className="text-left p-1 flex justify-between">
                  <div>{formData.deviationR}</div>
                  <div>{formData.deviationR}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="cell-style text-left">05.</td>
              <td className="cell-style text-left">टिप्पणियां /Remarks</td>
              <td className="cell-style text-left">{formData.remark}</td>
              {/* <td className="cell-style text-left"></td> */}
            </tr>
            <tr>
              <td className="cell-style text-left">06.</td>
              <td className="cell-style text-left">
                ऑपरेटर हस्ताक्षर /Operator Signature
              </td>
              <td className="cell-style text-left"></td>
              {/* <td className="cell-style text-left"></td> */}
            </tr>
            <tr>
              <td className="cell-style text-left">07.</td>
              <td className="cell-style text-left">हस्ताक्षर / Signature</td>
              {/* <td className="cell-style text-left"></td> */}
              <td className="cell-style text-left"></td>
            </tr>
            <tr>
                <td className="cell-style text-left" colSpan={2}>
                  सारांश (महीने के अंत में)/ SUMMARY (at the end of the Month)
                </td>
                <td className="cell-style text-left"></td>
                {/* <td className="cell-style text-left"></td> */}
              </tr>

              <tr>
                <td className="cell-style text-left" colSpan={2}>
                  माह के दौरान वेल्ड किए गए जोड़ों की संख्या (रेल सेक्शन वार){" "}
                  <br />
                  No. of Joints Welded during the month (Rail Section Wise)
                </td>
                <td className="cell-style text-left"></td>
                {/* <td className="cell-style text-left"></td> */}
              </tr>

              <tr>
                <td className="cell-style text-left" colSpan={2}>
                  परीक्षण किए गए जोड़ों की संख्या (रेल सेक्शनऔर यू.टी.एस.-वार){" "}
                  <br />
                  No. of Joints tested ( Rail Section & UTS - wise)
                </td>
                <td className="cell-style text-left"></td>
                {/* <td className="cell-style text-left"></td> */}
              </tr>

              <tr>
                <td className="cell-style text-left" colSpan={2}>
                  विफल जोड़ों की संख्या (रेल सेक्शनऔर यू.टी.एस.-वार) <br />
                  No. of joints failed (Rail Section & UTS - wise)
                </td>
                <td className="cell-style text-left"></td>
                {/* <td className="cell-style text-left"></td> */}
              </tr>
          </tbody>
        </table>
      </div>

    </div>
      <Button
          onClick={handlePrint}
          className="my-8 w-full mx-auto bg-darkBlueHover text-white"
        >
          Print
        </Button>
    </>
  );
};

export default WeldingHardnessIso;
