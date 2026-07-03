/* eslint-disable */
import React, { useRef, useState } from "react";
import { Button, Table } from "antd";
import { useReactToPrint } from "react-to-print";
import SearchFilter from "../sms/SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";

const FinishingVerification = () => {
  // Demo data
  const repRef = useRef();
  const [data] = useState([
    {
      key: "1",
      verificationPoint: "COOLING BED",
      hindiVerificationPoint: "कूलिंग बेड",
      parameter: "a) Visual Examination",
      verification: ["1.", "2.", "3."],
    },
    {
      key: "2",
      verificationPoint: "PRE-CAMBERING OF LONG RAIL",
      hindiVerificationPoint: "लंबी रेल की प्री-कैंबरिंग",
      parameter: "a) Visual",
      verification: [],
    },
    {
      key: "3",
      verificationPoint: "STRAIGHTENING MACHINE",
      hindiVerificationPoint: "स्ट्रेटनिंग मशीन",
      parameter: "a) Pressure Triangle/Roll Deflection",
      subParameters: [
        "i) Short Rail",
        "ii) Long Rail",
        "b) Straightness of Rails",
      ],
      verifications: [
        "1. Satisfactory/ Unsatisfactory",
        "2. Satisfactory/ Unsatisfactory",
        "3. Satisfactory/ Unsatisfactory",
      ],
    },
  ]);

//   // Table Columns
//   const columns = [
//     {
//       title: "सत्यापन बिंदु\nPoint of Verification",
//       dataIndex: "verificationPoint",
//       key: "verificationPoint",
//       render: (text, record) => (
//         <div style={{ fontWeight: "bold", textAlign: "left" }}>
//           {record.hindiVerificationPoint} <br />
//           {text}
//         </div>
//       ),
//     },
//     {
//       title: "पैरामीटर\nParameter",
//       dataIndex: "parameter",
//       key: "parameter",
//       render: (text, record) => (
//         <div style={{ textAlign: "left" }}>
//           {record.subParameters ? (
//             <ul style={{ marginLeft: 10 }}>
//               {record.subParameters.map((sub, index) => (
//                 <li key={index}>{sub}</li>
//               ))}
//             </ul>
//           ) : (
//             text
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "रिकॉर्ड का सत्यापन \n Verification of Record",
//       dataIndex: "verification",
//       key: "verification",
//       render: (text, record) => (
//         <div>
//           {record.verifications ? (
//             <ul style={{ marginLeft: 10 }}>
//               {record.verifications.map((ver, index) => (
//                 <li key={index}>{ver}</li>
//               ))}
//             </ul>
//           ) : (
//             text
//           )}
//         </div>
//       ),
//     },
//   ];

// const columns = [
//     {
//       title: "सत्यापन बिंदु\nPoint of Verification",
//       dataIndex: "verificationPoint",
//       key: "verificationPoint",
//       render: (text, record) => (
//         <div style={{ fontWeight: "bold", textAlign: "left" }}>
//           {record.hindiVerificationPoint} <br />
//           {text}
//         </div>
//       ),
//     },
//     {
//       title: "पैरामीटर\nParameter",
//       dataIndex: "parameter",
//       key: "parameter",
//       render: (text, record) => (
//         <div style={{ textAlign: "left" }}>
//           {record.subParameters ? (
//             <ul style={{ marginLeft: 10 }}>
//               {record.subParameters.map((sub, index) => (
//                 <li key={index}>{sub}</li>
//               ))}
//             </ul>
//           ) : (
//             text
//           )}
//         </div>
//       ),
//     },
//     {
//       title: "रिकॉर्ड का सत्यापन \n Verification of Record",
//       dataIndex: "verification",
//       key: "verification",
//       render: (text, record) => (
//         <div>
//           {record.verifications ? (
//             <ul style={{ marginLeft: 10 }}>
//               {record.verifications.map((ver, index) => (
//                 <li key={index}>{ver}</li>
//               ))}
//             </ul>
//           ) : (
//             <ul style={{ marginLeft: 10 }}>
//               {record.verification.map((ver, index) => (
//                 <li key={index}>{ver}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//       ),
//     },
//   ];

const columns = [
    {
        title: "सत्यापन बिंदु\nPoint of Verification",
        dataIndex: "verificationPoint",
        key: "verificationPoint",
        render: (text, record) => (
            <div style={{ fontWeight: "bold", textAlign: "left" }}>
                {record.hindiVerificationPoint} <br />
                {text}
            </div>
        ),
    },
    {
        title: "पैरामीटर\nParameter",
        dataIndex: "parameter",
        key: "parameter",
        render: (text, record) => (
            <div style={{ textAlign: "left" }}>
                <ul style={{ marginLeft: 10 }}>
                    {record.parameter.map((param, index) => (
                        <li key={index}>{param}</li>
                    ))}
                </ul>
            </div>
        ),
    },
    {
        title: "रिकॉर्ड का सत्यापन \n Verification of Record",
        dataIndex: "verification",
        key: "verification",
        render: (text, record) => (
            <div>
                <ul style={{ marginLeft: 10 }}>
                    {record.verification.map((ver, index) => (
                        <li key={index}>{ver}</li>
                    ))}
                </ul>
            </div>
        ),
    },
];

    const handlePrint = useReactToPrint({
        content: () => repRef.current,
        documentTitle: "rolling_finishing_verification", // Set custom filename
      });
      const [formData, setFormData] = useState({}
    //     {
    //     date: "13/12/2001",
    //     shift: "A",
    //     railSection: "URM"
    //   }
    )

      const {token} = useSelector(state => state.auth)

    //   const onFinish = async (formData) => {
        
    //     try{
    //         const {data} = await apiCall("POST", "/iso/getRollingFinishingDtls", token, formData)
    //         const hotStampingList = data?.responseData?.hotStampingList || [];
    //         const preCamberingList = data?.responseData?.preCamberingList || [];
    //         const straighteningMachineList = data?.responseData?.straighteningMachineList || [];


    // setFormData([
    //     {
    //       key: "1",
    //       verificationPoint: "COOLING BED",
    //       hindiVerificationPoint: "कूलिंग बेड",
    //       parameter: "a) Visual Examination",
    //       verification: hotStampingList.map(
    //         (item) => `${item.heatNo} - ${item.branding}`
    //       ),
    //     },
    //     {
    //       key: "2",
    //       verificationPoint: "PRE-CAMBERING OF LONG RAIL",
    //       hindiVerificationPoint: "लंबी रेल की प्री-कैंबरिंग",
    //       parameter: "a) Visual",
    //       verification: preCamberingList.map((item) => item.heatNo),
    //       verifications: preCamberingList.map((item) =>
    //         item.isSatisfactory ? "UnSatisfactory" : "Unsatisfactory"
    //       ),
    //     },
    //     {
    //       key: "3",
    //       verificationPoint: "STRAIGHTENING MACHINE",
    //       hindiVerificationPoint: "स्ट्रेटनिंग मशीन",
    //       parameter: "a) Pressure Triangle/Roll Deflection",
    //       subParameters: ["i) Short Rail", "ii) Long Rail", "b) Straightness of Rails"],
    //       verification: straighteningMachineList.map((item) => item.heatNo),
    //       verifications: straighteningMachineList.map((item) =>
    //         item.smIsSatisfactory ? "Satisfactory" : "Unsatisfactory"
    //       ),
    //     },
    //   ]);
  
    //     }
    //     catch(error){}
    //   } 


    const onFinish = async (formData) => {
        try {
            const { data } = await apiCall("POST", "/iso/getRollingFinishingDtls", token, {...formData, mill: "URM"});
            const hotStampingList = data?.responseData?.hotStampingList || [];
            const preCamberingList = data?.responseData?.preCamberingList || [];
            const straighteningMachineList = data?.responseData?.straighteningMachineList || [];
    
            setFormData(
                {
            date: formData.date,
            shift: formData.shift,
            railSection: formData.railSection,
            mill: formData.mill,
                tableData: [
                {
                    key: "1",
                    verificationPoint: "COOLING BED",
                    hindiVerificationPoint: "कूलिंग बेड",
                    parameter: hotStampingList.map(
                        (item) => `${item.heatNo} - ${item.branding}`
                    ),
                    verification: [],
                },
                {
                    key: "2",
                    verificationPoint: "PRE-CAMBERING OF LONG RAIL",
                    hindiVerificationPoint: "लंबी रेल की प्री-कैंबरिंग",
                    parameter: preCamberingList.map((item) => item.heatNo),
                    verification: preCamberingList.map((item) =>
                        item.isSatisfactory ? "Satisfactory" : "Unsatisfactory"
                    ),
                },
                {
                    key: "3",
                    verificationPoint: "STRAIGHTENING MACHINE",
                    hindiVerificationPoint: "स्ट्रेटनिंग मशीन",
                    parameter: straighteningMachineList.map(
                        (item) => {

                            // `Short Rail: ${item.shortRail}, Long Rail: ${item.longRail}, Straightness: ${item.straightness}`
                            if(item.smIsSatisfactory !== null){
                                return "Straightening Machine"       
                            }
                            if(item.smSrIsSatisfactory !== null){
                                return "Straightening Machine - SR"
                            }
                            if(item.smLrIsSatisfactory !== null){
                                return "Straightening Machine - LR"
                            }

                            return null;
                        }
                    ),
                    verification: straighteningMachineList.map((item) => {
                         // `Short Rail: ${item.shortRail}, Long Rail: ${item.longRail}, Straightness: ${item.straightness}`
                         if(item.smIsSatisfactory !== null){
                            return item.smIsSatisfactory ? "Satisfactory" : "Unsatisfactory"
                        }
                        if(item.smSrIsSatisfactory !== null){
                            return item.smSrIsSatisfactory ? "Satisfactory" : "Unsatisfactory"
                        }
                        if(item.smLrIsSatisfactory !== null){
                            return item.smLrIsSatisfactory ? "Satisfactory" : "Unsatisfactory"
                        }

                        return null;
                    }
                        // item.smIsSatisfactory ? "Satisfactory" : "Unsatisfactory"
                    ),
                },
            ]
        }
        );
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };


  return (
    <>
    <SearchFilter
        showDate
        showShift
        // showRailGrade
        // showMill
        showRailSection
        // showSms
        onFinish={onFinish}
      />
      <div className="a4-container landscape" ref={repRef}>
        <IsoHeader engTitle={`FORMAT FOR VERIFICATION REPORT (RAIL FINISHING)-URM`} hinTitle="सत्यापन रिपोर्ट के लिए प्रारूप (रेल फिनिशिंग) यू आर एम" col3AdtnlLine="APPROVED DIVISIONAL HEAD" />
        <Subheading formatNo="F/CR-BSP/7.5/17/09" page="1 OF 1" effDate="" pageRev= "00" textVal="सत्यापन रिपोर्ट आर एस एम / VERIFICATION REPORT - RSM" dsVis dsVal={formData?.date + " - " + formData?.shift} secVis secVal={formData.railSection}/>
        <h1 className="text-center font-semibold my-2">
        सत्यापन रिपोर्ट आर एस एम / VERIFICATION REPORT - URM
        </h1>
      <Table columns={columns} dataSource={formData?.tableData} pagination={false} bordered className="iso-table" />
      <div className="text-right">
        <div className="mt-16 mr-8">
          हस्ताक्षर / Signature: .............................
        </div>

        <br />

        <div className="mr-8">
          नाम / Name: ........................................
        </div>
      </div>
      </div>
      <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </>
  );
};

export default FinishingVerification;
