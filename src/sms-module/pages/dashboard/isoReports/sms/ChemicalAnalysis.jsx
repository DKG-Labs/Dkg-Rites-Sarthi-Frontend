/* eslint-disable */
import React, { useRef, useState } from "react";
import SearchFilter from "./SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "./Subheading";
import Tab from "../../../../components/DKG_Tab";
import { Button, Table } from "antd";
import { useSelector } from 'react-redux'
import { useReactToPrint } from "react-to-print";
import { apiCall } from "../../../../utils/CommonFunctions";

/* const data = []; */


const columns = [
  {
    title: "क्र.सं. \n S.No.",
    dataIndex: "sno",
    key: "sno",
  },
  {
    title: "मशीन न. / कास्ट न. \n M/c No. / Cast No.",
    dataIndex: "heatNo",
    key: "heatNo",
  },
  {
    title: "Seq No.",
    dataIndex: "seqNo",
    key: "seqNo",
  },
  {
    title: "रासायनिक विश्लेषण / Chemical Analysis",
    // dataIndex: "result",
    // key: "result",
    children: [
      {
        title: "C",
        dataIndex: "c",
      },
      {
        title: "Si",
        dataIndex: "si",
      },
      {
        title: "Mn",
        dataIndex: "mn",
      },
      {
        title: "S",
        dataIndex: "s",
      },
      {
        title: "P",
        dataIndex: "p",
      },
      {
        title: "Cr",
        dataIndex: "cr",
      },
      {
        title: "V",
        dataIndex: "v",
      },
      {
        title: "Al",
        dataIndex: "al",
      }
    ]
  },
  {
    title: "N",
    dataIndex: "nitrogen",
    key: "nitrogen",
  },
  {
    title: "O",
    dataIndex: "oxygen",
    key: "oxygen",
  },
  {
    title: "H2",
    dataIndex: "hydris",
    key: "hydris",
  },
  {
    title: "वैक्यूम स्तर (मिली बार) / Vacuum Level (m bar)",
    dataIndex: "degassingVacuum",
    key: "degassingVacuum",
  },
  {
    title: "डेगासिंग समय (मिनट) / Degassing Time (Minutes)",
    dataIndex: "degassingDuration",
    key: "remarks",
  },
  {
    title: "टिप्पणियां / Remarks",
    dataIndex: "remarks",
    key: "remarks",
  },
]

const textVal =
  "रासायनिक विश्लेषण गवाह रिपोर्ट (कनवर्टर प्रयोगशाला) <br /> CHEMICAL ANALYSIS WITNESS REPORT (CONVERTER LABORATORY)";

  
  const ChemicalAnalysis = () => {
  const {token} = useSelector(state => state.auth);
  const repRef = useRef();
  const onFinish = async (formData) => {
    try{
      const { data } = await apiCall("POST", "/iso/getSmsChemicalAnalysis", token, formData);

      setFormData({
        date: formData.date,
        shift: formData.shift,
        sms: formData.sms,
        tableData: data?.responseData?.map((item, index) => ({
          key: index + 1,  // Adding a key for Ant Design Table
          sno: index + 1,
          heatNo: item.heatNumber,
          seqNo: item.sequenceNumber,
          nitrogen: item.nitrogen,
          oxygen: item.oxygen,
          hydrogen: item.hydris,
          degassingVacuum: item.degassingVacuum,
          degassingDuration: item.degassingDuration,
          remarks: item.heatRemark || "N/A"
        }))
    })
  }catch(error){
      console.log(error);
    }
  };

  const [formData, setFormData] = useState({
    railGrade: "",
    date: "",
    shift: "",
    sms: "",
    // tableData: [
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    //   {
    //     key: "1",
    //     sno: "1",
    //     description: "Machine 1",
    //     seqNo: "001",
    //     c: "0.30",
    //     si: "0.20",
    //     mn: "1.50",
    //     s: "0.05",
    //     p: "0.03",
    //     cr: "0.25",
    //     v: "0.01",
    //     al: "0.02",
    //     nitrogen: "0.012",
    //     oxygen: "0.005",
    //     hydris: "0.001",
    //     degassingVacuum: "5",
    //     remarks: "Good",
    //   },
    // ]
  });

  const handlePrint = useReactToPrint({
      content: () => repRef.current,
      documentTitle: "sms_chemical_analysis", // Set custom filename
    });
  return (
    <div>
      <SearchFilter
        showDate
        showShift
        // showRailGrade
        // showRailSection
        showSms
        onFinish={onFinish}
      />
      <div className="a4-container landscape" ref={repRef}>
        <div className="content">
          <IsoHeader
            engTitle="RITES Ltd, Bhilai <br /> Clause No. 8.5 of ISO:9001:2015"
            hinTitle="राइट्स लिमिटेड, भिलाई"
          />
          <Subheading
            formatNo="F/CR-BSP/7.5/17/02"
            page="1 OF 2"
            pageRev="00"
            effDate="01.04.2025"
            smsVis
            dsVis
            smsVal={formData.sms}
            dsVal={formData.date + " - " + formData.shift}
            textVis
            textVal={textVal}
          />

          <Table 
          className="iso-table"
            columns={columns} 
            dataSource={formData.tableData}
            scroll={{x: "auto"}}
            bordered
            pagination={false}
          />

          <div className="grid grid-cols-2 border border-black">
            <div className="border-r border-black p-2">
              <h2 className="!text-xs">Signature हस्ताक्षर</h2>
              <h2 className="!text-xs my-4">(राइट्स) (RITES)</h2>
              <h2 className="!text-xs">(Name नाम: ............................................)</h2>
            </div>
            <div className="p-2">
            <h2 className="!text-xs">Signature हस्ताक्षर</h2>
              <h2 className="!text-xs my-4">(I/C Conv. Lab, BSP)(प्रभार कनवर्टर लैब, बी एस पी)</h2>
              <h2 className="!text-xs">(Name नाम: ............................................)</h2>
            </div>
          </div>
          
        </div>
      </div>


         <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </div>
  );
};

export default ChemicalAnalysis;
