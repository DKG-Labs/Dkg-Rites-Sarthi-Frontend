/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import { Table, Spin, Alert, Button } from "antd";
import SearchFilter from "../sms/SearchFilter";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";

const RollingVerificationIso = () => {
  const [data, setData] = useState([]);
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace with your API URL
    const fetchData = async () => {
      try {
        // const response = await fetch("https://your-api.com/report");
        const result = {};

        setData(result.verificationData || []); // Verification Table Data
        setTemperatureData(result.temperatureData || []); // Temperature Table Data
      } catch (err) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* verificationColumns */

  /* temperatureColumns */

  const { token } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    date: "",
    shift: "",
    railGrade: "",
    railSection: "",
    tempDtlList: [],
    bloomYardDtlList: [],
    verificationChargingDtlList: [],
  });

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getRollingVerificationDtls",
        token,
        {...formData, mill: "RSM"}
      );
      setFormData({
        date: formData.date,
        shift: formData.shift,
        railGrade: formData.railGrade,
        railSection: formData.railSection,
        ...(data?.responseData || {}),
      });
    } catch (error) {}
  };

  const repRef = useRef();

  const handlePrint = useReactToPrint({
        content: () => repRef.current,
        documentTitle: "rolling_verification", // Set custom filename
      });

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      {/* <h2>Verification Report</h2> */}
      {/* <Table
        columns={verificationColumns}
        dataSource={data}
        pagination={false}
        className="iso-table"
        bordered
      /> */}

      <SearchFilter
        showDate
        showShift
        showRailGrade
        showRailSection
        onFinish={onFinish}
      />

      <div className="a4-container" ref={repRef}>
        <IsoHeader hinTitle="सत्यापन रिपोर्ट के लिए प्रारूप (रेल रोलिंग) - आरएसएम"
          engTitle="FORMAT FOR VERIFICATION REPORT (Rail Rolling) – RSM <br /> Clause No. 8.5 of ISO 9001:2015" col3AdtnlLine="APPROVED DIVISIONAL HEAD" />
          <Subheading formatNo="F/CR-BSP/7.5/17/03" page="1 OF 1" pageRev="00" 
            dsVis dsVal={formData.date + " - " + formData.shift} 
            grdVis grdVal={formData.railGrade}
            secVis secVal={formData.railSection} 
          />
      
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
              <th rowSpan="2" className="cell-style">
                सत्यापन बिंदु
                <br />
                Point Of Verification
              </th>
              <th rowSpan="2" className="cell-style">
                पैरामीटर
                <br />
                Parameter
              </th>
              <th rowSpan="2" className="cell-style">
                रिकॉर्ड का सत्यापन
                <br />
                Verification of Record
              </th>
            </tr>
          </thead>

          <tr>
            <td className="cell-style text-left pl-4">
              1. ब्लूम यार्ड <br /> BLOOM YARD
            </td>
            <td className="cell-style">
              {formData?.bloomYardDtlList?.map((item) => (
                <div className="mb-4">
                  Heat Number: <br />
                  Internal Transfer Verification: <br />
                  Heat Register Verification: <br />
                </div>
              ))}
            </td>
            <td className="cell-style">
              {formData?.bloomYardDtlList?.map((item) => (
                <div className="mb-4">
                  {item.heatNumber} <br />
                  {item.internalTransferVerification
                    ? "Satisfactory"
                    : "Unsatisfactory"}{" "}
                  <br />
                  {item.heatRegisterVerification
                    ? "Satisfactory"
                    : "Unsatisfactory"}{" "}
                  <br />
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="cell-style text-left pl-4">
              2. चार्जिंग टेबल <br /> CHARGING TABLE
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  Heat Number: <br />
                  Length: <br />
                  Defect: <br />
                </div>
              ))}
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  {item.heatNumber} <br />
                  {item.length} <br />
                  {item.defect} <br />
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="cell-style text-left pl-4">
              3. ब्लूम ट्रैकिंग <br /> BLOOM TRACKING
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  Online verification of <br />
                  Computerized Bloom Tracking
                </div>
              ))}
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  {item.bloomTrackingVerification
                    ? "Satisfactory"
                    : "Unsatisfactory"}
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="cell-style text-left pl-4">
              4. ब्लूम्स का डीस्केलिंग <br /> DESCALING OF BLOOMS
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  De-scaling of hot <br /> blooms before rolling
                </div>
              ))}
            </td>
            <td className="cell-style">
              {formData?.verificationChargingDtlList?.map((item) => (
                <div className="mb-4">
                  {item.hotBloomsDescaling ? "Satisfactory" : "Unsatisfactory"}
                </div>
              ))}
            </td>
          </tr>

          <tr>
            <td className="cell-style" colSpan={3}>
              5. तापमान अवलोकन <br /> TEMPERATURE OBSERVATION
            </td>
          </tr>

          {/* <tr>
            <td className="cell-style">Time of Observation</td>
            <td className="cell-style">Time of Observation</td>
            <td className="cell-style">Time of Observation</td>
            <td className="cell-style">Time of Observation</td>
          </tr> */}
        </table>
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
              <th rowSpan="2" className="cell-style">
                Time of Observation
              </th>
              <th rowSpan="2" className="cell-style">
                Soaking Zone Temperature <br /> 1280 ±20 0C
              </th>
              <th rowSpan="2" className="cell-style">
                Finishing Temperature <br /> 900 ± 30 0C
              </th>
              <th rowSpan="2" className="cell-style">
                Remarks
              </th>
            </tr>
          </thead>

          {formData?.tempDtlList?.map((item) => (
            <tr>
              <td className="cell-style">{item.createdAt}</td>
              <td className="cell-style">{item.soakingZoneTemperature}</td>
              <td className="cell-style">{item.finishingTemperature}</td>
              <td className="cell-style"></td>
            </tr>
          ))}

          <tr>
            <td rowSpan={4} colSpan={4} className="cell-style">
              <div className="text-left mt-2">
                अवलोकन,यदि कोई हो <br />
                Observations, if any:
              </div>
              <div className="w-full text-right">
                <div className="mt-16 mr-8">
                  हस्ताक्षर / Signature: .............................
                </div>

                <br />

                <div className="mr-8">
                  नाम / Name: ........................................
                </div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      </div>

      <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </div>
  );
};

export default RollingVerificationIso;
