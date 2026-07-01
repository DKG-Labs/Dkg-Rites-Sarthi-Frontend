/* eslint-disable */
import React, { useRef, useState } from 'react'
import IsoHeader from '../../../../components/DKG_IsoHeader'
import Subheading from '../sms/Subheading'
import SearchFilter from '../sms/SearchFilter'
import { useSelector } from 'react-redux'
import { useReactToPrint } from 'react-to-print'
import { apiCall } from '../../../../utils/CommonFunctions'
import { Button, message } from 'antd'

const WeldMicroIso = () => {
  const [formData, setFormData] = useState({})
  const { token } = useSelector((state) => state.auth);

  const repRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => repRef.current,
    documentTitle: "welding_micro_iso", // Set custom filename
  });

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getWeldMicroDtls",
        token,
        formData
      );
      console.log("WeldMicroIso API Response:", data);
      if (data?.responseData) {
        setFormData({...data.responseData, jointNumber: formData.jointNo});
      } else {
        message.warning("No micro data found for the specified joint number.");
        setFormData({jointNumber: formData.jointNo});
      }
    } catch (error) {
      console.error("WeldMicroIso API Error:", error);
      message.error(`Failed to fetch micro data: ${error.response?.data?.message || error.message}`);
    }
  };
  return (
    <>
    <SearchFilter showJn onFinish={onFinish} />
    <div className="a4-container">
    <IsoHeader
          hinTitle="वेल्ड किए गए जोड़ों की माइक्रो परीक्षण के लिए प्रारूप"
          engTitle="FORMAT FOR MICRO EXAMINATION OF WELDED JOINTS <br /> Clause No. 8.5 of ISO:9001:2015"
          col3AdtnlLine="APPROVED DIVIONAL HEAD"
        />
        <Subheading formatNo=" F/CR-BSP/7.5/20/0" />
      <table
      className="iso-table"
      border="1"
      style={{
        borderCollapse: "collapse",
        width: "100%",
        // textAlign: "center",
      }}
    >
      <thead>
        {/* Table Title Row */}
        <tr>
          <th colSpan={4} className='cell-style'>
            वेल्डेड जोड़ों (जॉइंट) का माइक्रो परीक्षण / MICRO EXAMINATION OF WELDED JOINTS
          </th>
        </tr>

        {/* Header Row */}
        <tr>
          <th className='cell-style' style={{ width: "10%" }}>क्र.सं/ S. No.</th>
          <th className='cell-style' style={{ width: "40%" }}>विवरण / Description</th>
          <th className='cell-style' style={{ width: "30%" }}>पर्यवेक्षण / Observation</th>
          <th className='cell-style' style={{ width: "20%" }}>टिप्पणियाँ / Remarks</th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="cell-style">01</td>
          <td className="cell-style">तिथि, माह और वर्ष / Date, Month and Year</td>
          <td className="cell-style">{formData?.date || ""}</td>
          <td className="cell-style"></td>
        </tr>
        <tr>
          <td className="cell-style">02</td>
          <td className="cell-style">जोड़ (जॉइंट)संख्या / Joint No.</td>
          <td className="cell-style">{formData?.jointNumber || ""}</td>
          <td className="cell-style"></td>
        </tr>
        <tr>
          <td className="cell-style">03</td>
          <td className="cell-style">रेल सेक्शन और यू.टी.एस. / Rail Section & UTS</td>
          <td className="cell-style">{formData?.railSection || ""}</td>
          <td className="cell-style"></td>
        </tr>
        <tr>
          <td className="cell-style">04</td>
          <td className="cell-style">परीक्षण की तिथि / Date of Testing</td>
          <td className="cell-style">{formData?.date || ""}</td>
          <td className="cell-style"></td>
        </tr>
        <tr>
          <td className="cell-style">05</td>
          <td className="cell-style">
            ग्रेन के आकार के साथ 100 एक्समाग्निफ़िकेशन मैक्रोस्ट्रक्चर पर टिप्पणी /
            Remarks on Microstructure at 100X magnification with grain size
          </td>
          <td className="cell-style">{formData?.isMicroFree ? "YES" : "NO" || ""}</td>
          <td className="cell-style"></td>
        </tr>
        <tr>
          <td className="cell-style">06</td>
          <td className="cell-style">हस्ताक्षर / Signature</td>
          <td className="cell-style"></td>
          <td className="cell-style"></td>
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
    </>
  )
}

export default WeldMicroIso
