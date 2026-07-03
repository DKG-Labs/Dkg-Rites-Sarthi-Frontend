/* eslint-disable */
import { Button, Table } from "antd";
import React, { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import SearchFilter from "../sms/SearchFilter";
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "../sms/Subheading";

const ViOnlineInspection = () => {
  const columns = [
    {
      title: "क्र. सं. \n S. No",
      dataIndex: "sNo",
      render: (_, __, index) => index + 1,
    },
    {
      title: "हीट संख्या \n Heat number",
      dataIndex: "heatNumber",
    },
    {
      title: "हीट  की स्थिति  \n Heat status",
      dataIndex: "heatStatus",
    },
    {
      title: "रेल आईडी संख्या \n Rail \nID no.",
      dataIndex: "railId",
    },
    {
      title: "सीधापन \n Straigh\ntness",
      dataIndex: "gaugingEndStraightness",
      render: (_, record) => (record.gaugingEndStraightness ? "YES" : "NO"),
    },
    {
      title: "ऑनलाइन ईसीटी \n Online ECT",
      dataIndex: "ect",
    },
    {
      title: "ऑनलाइन यूटी \n Online UT",
      dataIndex: "utFeedback",
    },
    {
      title: " गेज़िंग \n Gauging",
      children: [
        {
          title:
            "Ht/\nHead/\nWeb\n/Flange\n/Asym\n/Crown\n/Foot Flatn\ness/Fish\n/Toe Thic\nkness",
          dataIndex: "combined",
        },
        {
          title: "US/DS\n/OS",
          dataIndex: "defectPresent",
        },
      ],
    },
    {
      title: " सतह निरीक्षण \n Surface Inspection",
      children: [
        {
          title: "Head",
          dataIndex: "head",
        },
        {
          title: "Web",
          dataIndex: "web",
        },
        {
          title: "Foot",
          dataIndex: "foot",
        },
      ],
    },
    {
      title: "प्रस्तावित लंबाई (मीटर) \n Offered Length (metres)",
      dataIndex: "actualOfferedLength",
    },
    {
      title: "स्वीकृत लंबाई (मीटर) \n Accepted Length (metres)",
      children: [
        {
          title: "Class A",
          dataIndex: "acceptanceClassA",
          render: (text) => text || "",
        },
        {
          title: "Class A + 0.1",
          dataIndex: "acceptanceClassAPlus",
          render: (text) => text || "",
        },
      ],
    },
    {
      title: "अस्वीकृत लंबाई (मीटर) \n Rejected Length (metres)",
      dataIndex: "rejectedLengthDetails",
      render: (text) => text || "No rejections",
    },
    {
      title: "दोष विश्लेषण \n Defect Analysis",
      dataIndex: "defectAnalysis",
      render: (text) => text || "No defects",
    },
    {
      title: "टिप्पणियाँ \n Remarks",
      dataIndex: "remarks",
    },
  ];

  const [formData, setFormData] = useState({
    date: "",
    shift: "",
    railGrade: "",
    railSection: "",
    dtlList: [],
  });

  const { token } = useSelector((state) => state.auth);

  const repRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => repRef.current,
    documentTitle: "vi_online_inspection", // Set custom filename
  });

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall(
        "POST",
        "/iso/getViOnlineInspDtls",
        token,
        formData
      );

      setFormData({
        date: formData.date,
        shift: formData.shift,
        railGrade: formData.railGrade,
        railSection: formData.railSection,
        dtlList: data?.responseData || [],
      });
    } catch (error) {}
  };

  return (
    <>
      <SearchFilter
        showDate
        showShift
        showRailGrade
        showRailSection
        // showSms
        onFinish={onFinish}
      />
      <div className="a4-container" ref={repRef}>
        <IsoHeader
            engTitle="FORMAT FOR ONLINE INSPECTION OF LONG RAILS"
            hinTitle="लंबी रेलों के ऑनलाइन निरीक्षण के लिए प्रारूप"
            col3AdtnlLine="APPROVED DIVISIONAL HEAD"
        />
        <Subheading 
            formatNo="F/CR/BSP/7.5/16/02"
            page="1 OF 1"
            pageRev="00"
            dsVis dsVal={formData.date + " - " + formData.shift}
            grdVis grdVal={formData.railGrade}
            secVis secVal={formData.railSection}
            textVis textVal="लंबी रेल का ऑनलाइन निरीक्षण <br /> ONLINE INSPECTION OF LONG RAILS"
        />
        <Table
          columns={columns}
          dataSource={formData.dtlList}
          scroll={{ x: true }}
          bordered
          className="iso-table border !border-black"
          pagination={false}
        />
        <div className="grid grid-cols-2 py-4">
            <div className="text-left !text-xs font-semibold">
             निरीक्षण अभियंताओं के नाम / <br /> Name of Inspecting Engineers
             <br /> <br />
             1. .................................  <br /> <br />   2. ................................. <br /> <br />
             3. .................................  <br /> <br />   4. .................................
            </div>
            <div className="text-right !text-xs font-semibold">
            निरीक्षण अभियंता के हस्ताक्षर <br /> Signature of Inspecting Engineer <br /> <br />
            .................................
            </div>
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

export default ViOnlineInspection;
