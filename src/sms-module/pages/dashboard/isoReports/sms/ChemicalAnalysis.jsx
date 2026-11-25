/* eslint-disable */
import React, { useRef, useState } from "react";
import SearchFilter from "./SearchFilter";
import IsoHeader from "../../../../components/DKG_IsoHeader";
import Subheading from "./Subheading";
import { Button, Table } from "antd";
import { useSelector } from 'react-redux'
import { useReactToPrint } from "react-to-print";
import { apiCall } from "../../../../utils/CommonFunctions";
import { bi, mapHeats, padRows, dateShift } from "./chemIsoShared";
import "./ChemicalIso.css";

/*
 * SMS Chemical Analysis Witness Report (Converter Laboratory) — page 1 of 2 (F/CR-BSP/7.5/17/02).
 * Always shows the printed form: specified values for Grade 880 / R260, then the heats of the selected
 * date / shift / SMS, padded with blank rows. Element values (C … Al) are not captured in SARTHI yet,
 * so those cells stay blank for the lab entry.
 */

// Specified values (printed on the form). O, H2, vacuum and degassing time are common to both grades.
const SPEC_ROWS = [
  {
    key: "spec-880", spec: true, first: true,
    label: bi("ग्रेड 880 के लिए निर्दिष्ट मान", "Specified values for Grade 880"),
    c: "0.60-0.80", mn: "0.80-1.30", si: "0.10-0.50", s: "0.030 Max.", p: "0.030 Max.",
    cr: "0.30 Max.", v: "0.01 Max.", al: "0.015 Max.", nitrogen: "",
    oxygen: "20 Max.", hydris: "1.6 Max.", degassingVacuum: "≤ 3 mbar",
    degassingDuration: "10 minutes Min. after achieving 3 mbar", remarks: "---",
  },
  {
    key: "spec-r260", spec: true,
    label: bi("ग्रेड R260 के लिए निर्दिष्ट मान", "Specified values for Grade R260"),
    c: "0.62-0.80", mn: "0.70-1.20", si: "0.15-0.58", s: "0.025 Max.", p: "0.025 Max.",
    cr: "0.15 Max.", v: "0.030 Max.", al: "0.004 Max.", nitrogen: "0.009", remarks: "---",
  },
];

const show = (v) => (v === null || v === undefined ? "" : v);
// first three columns merge into the "Specified values" label on the two spec rows
const idCell = (lead) => (r) => (r.spec ? { colSpan: lead ? 3 : 0 } : {});
// O, H2, vacuum and degassing time are one merged cell over both spec rows
const commonSpec = (r) => (r.spec ? { rowSpan: r.first ? 2 : 0 } : {});

const columns = [
  { title: bi("क्र.सं.", "S. No."), dataIndex: "sno", key: "sno", width: 60, align: "center",
    onCell: idCell(true), render: (v, r) => (r.spec ? r.label : show(v)) },
  { title: bi("मशीन नं./ कास्ट नं.", "M/c No./ Cast No."), dataIndex: "heatNo", key: "heatNo", width: 110, align: "center",
    onCell: idCell(false), render: show },
  { title: bi("अनुक्रम संख्या", "Seq No."), dataIndex: "seqNo", key: "seqNo", width: 70, align: "center",
    onCell: idCell(false), render: show },
  {
    title: bi("रासायनिक विश्लेषण %", "CHEMICAL ANALYSIS %"),
    children: ["C", "Mn", "Si", "S", "P", "Cr", "V", "Al"].map((el) => ({
      title: el, dataIndex: el.toLowerCase(), key: el.toLowerCase(), align: "center", render: show,
    })),
  },
  { title: "N Max", dataIndex: "nitrogen", key: "nitrogen", align: "center", render: show },
  { title: "O (ppm)", dataIndex: "oxygen", key: "oxygen", align: "center", render: show, onCell: commonSpec },
  { title: "H2 (ppm)", dataIndex: "hydris", key: "hydris", align: "center", render: show, onCell: commonSpec },
  { title: bi("वैक्यूम स्तर (मिली बार)", "Vacuum level (m bar)"), dataIndex: "degassingVacuum", key: "degassingVacuum",
    align: "center", render: show, onCell: commonSpec },
  { title: bi("डीगैसिंग समय (मिनट)", "Degassing time (Minutes)"), dataIndex: "degassingDuration", key: "degassingDuration",
    align: "center", render: show, onCell: commonSpec },
  { title: bi("टिप्पणियां", "Remarks"), dataIndex: "remarks", key: "remarks", align: "center", render: show },
];

const textVal =
  "रासायनिक विश्लेषण गवाह रिपोर्ट (कनवर्टर प्रयोगशाला) <br /> CHEMICAL ANALYSIS WITNESS REPORT (CONVERTER LABORATORY)";

const ChemicalAnalysis = () => {
  const { token } = useSelector(state => state.auth);
  const repRef = useRef();
  const [formData, setFormData] = useState({ date: "", shift: "", sms: "", heats: [] });

  const onFinish = async (search) => {
    try {
      const { data } = await apiCall("POST", "/iso/getSmsChemicalAnalysis", token, search);
      setFormData({ date: search.date, shift: search.shift, sms: search.sms, heats: mapHeats(data?.responseData) });
    } catch (error) {
      console.log(error);
      setFormData({ date: search.date, shift: search.shift, sms: search.sms, heats: [] });
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: repRef,   // react-to-print v3
    documentTitle: "sms_chemical_analysis_page1",
    // print on A4 landscape, same layout with or without data
    pageStyle: "@page { size: A4 landscape; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
  });

  return (
    <div>
      <SearchFilter showDate showShift showSms onFinish={onFinish} />
      <div className="a4-container landscape chem-iso" ref={repRef}>
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
            dsVal={dateShift(formData.date, formData.shift)}
            textVis
            textVal={textVal}
          />

          <Table
            className="iso-table"
            columns={columns}
            dataSource={[...SPEC_ROWS, ...padRows(formData.heats)]}
            tableLayout="fixed"
            bordered
            pagination={false}
            size="small"
          />

          <div className="grid grid-cols-2 border border-black">
            <div className="border-r border-black p-2">
              <h2 className="!text-xs">हस्ताक्षर Signature</h2>
              <h2 className="!text-xs my-4">(राइट्स) (RITES)</h2>
              <h2 className="!text-xs">(नाम Name: ............................................)</h2>
            </div>
            <div className="p-2">
              <h2 className="!text-xs">हस्ताक्षर Signature</h2>
              <h2 className="!text-xs my-4">(प्रभारी कनवर्टर लैब, बी एस पी) (I/C Conv. Lab, BSP)</h2>
              <h2 className="!text-xs">(नाम Name: ............................................)</h2>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </div>
  );
};

export default ChemicalAnalysis;
