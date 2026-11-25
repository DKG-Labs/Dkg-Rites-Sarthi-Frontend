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
 * SMS Chemical Analysis Witness Report (Converter Laboratory) — page 2 of 2: residual chemical analysis
 * (F/CR-BSP/7.5/17/02). Always shows the printed form: specified values (Grade 880: not applicable;
 * Grade R260 limits), then the heats of the selected date / shift / SMS, padded with blank rows.
 * Residual element values are not captured in SARTHI yet, so those cells stay blank for the lab entry.
 */

const ELEMENTS = [
  { key: "mo", title: "Mo", r260: "0.02 Max" },
  { key: "ni", title: "Ni", r260: "0.10 Max" },
  { key: "cu", title: "Cu", r260: "0.15 Max." },
  { key: "sn", title: "Sn", r260: "0.030 Max." },
  { key: "sb", title: "Sb", r260: "0.020 Max." },
  { key: "ti", title: "Ti", r260: "0.025 Max." },
  { key: "nb", title: "Nb", r260: "0.04 Max." },
  { key: "cuSn", title: "Cu + 10Sn", r260: "0.35 Max." },
  { key: "other", title: "Other - (Cr + Mo + Ni + Cu + V)", r260: "0.25 Max." },
];

const SPEC_ROWS = [
  { key: "spec-880", spec: true, na: true, label: bi("ग्रेड 880 के लिए निर्दिष्ट मान", "Specified values for Grade 880"), remarks: "" },
  {
    key: "spec-r260", spec: true, label: bi("ग्रेड R260 के लिए निर्दिष्ट मान", "Specified values for Grade R260"),
    ...Object.fromEntries(ELEMENTS.map((e) => [e.key, e.r260])), remarks: "",
  },
];

const show = (v) => (v === null || v === undefined ? "" : v);
const idCell = (lead) => (r) => (r.spec ? { colSpan: lead ? 3 : 0 } : {});

const columns = [
  { title: bi("क्र.सं.", "S. No."), dataIndex: "sno", key: "sno", width: 60, align: "center",
    onCell: idCell(true), render: (v, r) => (r.spec ? r.label : show(v)) },
  { title: bi("मशीन नं./ कास्ट नं.", "M/c No./ Cast No."), dataIndex: "heatNo", key: "heatNo", width: 110, align: "center",
    onCell: idCell(false), render: show },
  { title: bi("अनुक्रम संख्या", "Seq No."), dataIndex: "seqNo", key: "seqNo", width: 70, align: "center",
    onCell: idCell(false), render: show },
  {
    title: bi("अवशिष्ट रासायनिक विश्लेषण %", "RESIDUAL CHEMICAL ANALYSIS %"),
    children: ELEMENTS.map((e, i) => ({
      title: e.title, dataIndex: e.key, key: e.key, align: "center",
      // Grade 880 row: one merged "Not Applicable" cell across all residual elements
      onCell: (r) => (r.na ? { colSpan: i === 0 ? ELEMENTS.length : 0 } : {}),
      render: (v, r) => (r.na ? (i === 0 ? "Not Applicable" : "") : show(v)),
    })),
  },
  { title: bi("टिप्पणियां", "Remarks"), dataIndex: "remarks", key: "remarks", align: "center", render: show },
];

const textVal =
  "रासायनिक विश्लेषण गवाह रिपोर्ट (कनवर्टर प्रयोगशाला) <br /> CHEMICAL ANALYSIS WITNESS REPORT (CONVERTER LABORATORY)";

const ChemicalAnalysis2 = () => {
  const { token } = useSelector(state => state.auth);
  const repRef = useRef();
  const [formData, setFormData] = useState({ date: "", shift: "", sms: "", heats: [] });

  const onFinish = async (search) => {
    try {
      // same heats as page 1 (cast no. / seq. no.); residual values are entered by the lab
      const { data } = await apiCall("POST", "/iso/getSmsChemicalAnalysis", token, search);
      const heats = mapHeats(data?.responseData).map((h) => ({ key: h.key, sno: h.sno, heatNo: h.heatNo, seqNo: h.seqNo, remarks: h.remarks }));
      setFormData({ date: search.date, shift: search.shift, sms: search.sms, heats });
    } catch (error) {
      console.log(error);
      setFormData({ date: search.date, shift: search.shift, sms: search.sms, heats: [] });
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: repRef,   // react-to-print v3
    documentTitle: "sms_chemical_analysis_page2",
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
            page="2 OF 2"
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
              <h2 className="!text-xs">Signature हस्ताक्षर</h2>
              <h2 className="!text-xs my-4">(RITES) (राइट्स)</h2>
              <h2 className="!text-xs">(Name नाम: ............................................)</h2>
            </div>
            <div className="p-2">
              <h2 className="!text-xs">Signature हस्ताक्षर</h2>
              <h2 className="!text-xs my-4">(I/C Conv. Lab, BSP) (प्रभारी कनवर्टर लैब, बी एस पी)</h2>
              <h2 className="!text-xs">(Name नाम: ............................................)</h2>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </div>
  );
};

export default ChemicalAnalysis2;
