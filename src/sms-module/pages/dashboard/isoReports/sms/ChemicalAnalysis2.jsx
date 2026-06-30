/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import SearchFilter from "./SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "./Subheading";
import Tab from "../../../../components/DKG_Tab";
import { Button, Modal, Table, Typography } from "antd";
import { useSelector } from 'react-redux'
import { useReactToPrint } from "react-to-print";


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
        title: "Mo",
        dataIndex: "c",
      },
      {
        title: "Ni",
        dataIndex: "si",
      },
      {
        title: "Cu",
        dataIndex: "mn",
      },
      {
        title: "Sn",
        dataIndex: "s",
      },
      {
        title: "Sb",
        dataIndex: "p",
      },
      {
        title: "Ti",
        dataIndex: "cr",
      },
      {
        title: "Nb",
        dataIndex: "v",
      },
      {
        title: "Cu + 10Sn",
        dataIndex: "al",
      },
      {
        title: "Other (Cr + Mo + Ni + Cu + V)",
        dataIndex: "al",
      }
    ]
  },
  {
    title: "टिप्पणियां / Remarks",
    dataIndex: "remarks",
    key: "remarks",
  },
]

const textVal =
  "रासायनिक विश्लेषण गवाह रिपोर्ट (कनवर्टर प्रयोगशाला) <br /> CHEMICAL ANALYSIS WITNESS REPORT (CONVERTER LABORATORY)";

  
  const ChemicalAnalysis2 = () => {
  const {token} = useSelector(state => state.auth);
  const repRef = useRef();
  const onFinish = async (searchFormData) => {
    // Update formData with search parameters to ensure SMS selection is reflected
    setFormData(prev => ({
      ...prev,
      date: searchFormData.date,
      shift: searchFormData.shift,
      sms: searchFormData.sms, // This will update the SMS field for dynamic titles
    }));

    // Uncomment below when API is ready
    // try{
    //   const { data } = await apiCall("POST", "/iso/getSmsChemicalAnalysis", token, searchFormData);
    //   setFormData(prev => ({
    //     ...prev,
    //     date: searchFormData.date,
    //     shift: searchFormData.shift,
    //     sms: searchFormData.sms,
    //     tableData: data?.responseData?.map((item, index) => ({
    //       key: index + 1,
    //       sno: index + 1,
    //       heatNo: item.heatNumber,
    //       seqNo: item.sequenceNumber,
    //       nitrogen: item.nitrogen,
    //       oxygen: item.oxygen,
    //       hydrogen: item.hydris,
    //       degassingVacuum: item.degassingVacuum,
    //       degassingDuration: item.degassingDuration,
    //       remarks: item.heatRemark || "N/A"
    //     }))
    //   }));
    // }catch(error){
    //   console.log(error);
    // }
  };

  const [formData, setFormData] = useState({
    railGrade: "R260",
    date: "13/12/2001",
    shift: "A",
    sms: "SMS 2",
    tableData: [
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
      {
        key: "1",
        sno: "1",
        description: "Machine 1",
        seqNo: "001",
        c: "0.30",
        si: "0.20",
        mn: "1.50",
        s: "0.05",
        p: "0.03",
        cr: "0.25",
        v: "0.01",
        al: "0.02",
        nitrogen: "0.012",
        oxygen: "0.005",
        hydris: "0.001",
        degassingVacuum: "5",
        remarks: "Good",
      },
    ]
  });

  const handlePrint = useReactToPrint({
      content: () => repRef.current,
      documentTitle: "sms_chemical_analysis", // Set custom filename
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsModalOpen(true); // Open modal when the component mounts
  }, []);

  const handleOk = () => {
    setIsModalOpen(false);
  };

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

         {
            isModalOpen && (
                <Modal
      title="Demo Report" 
      open={isModalOpen} 
      onOk={handleOk} 
      onCancel={handleOk} 
      centered
    >
      <Typography.Text>
        This is a demo report. The database does not contain the data for the mentioned chemicals yet.
      </Typography.Text>
    </Modal>

            )
         }
    </div>
  );
};

export default ChemicalAnalysis2;
