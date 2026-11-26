/* eslint-disable */
/*
 * Rolling Stage Control Report (60E1A1) laid out like the printed form
 * (RITES LTD - CENTRAL REGION, BHILAI; dimensions as per IRS T-12-2009).
 * Saved samples fill the top rows; the rest stay blank like the paper.
 * Used by the RSM and URM 60E1A1 reports (their rows use different field names).
 */
import React from "react";

const ROWS = 18;
const b = { border: "1px solid #000", padding: "3px 4px", fontSize: 11, color: "#000", textAlign: "center", verticalAlign: "middle" };
const h = { ...b, fontWeight: 600 };
const v = (x) => (x === null || x === undefined || x === "" ? "" : x);

/** one row in a common shape, whichever report it came from */
const norm = (r) => ({
  sample: r.sampleNumber ?? r.sampleNo,
  time: r.timing ?? r.time,
  heat: r.heatNumber ?? r.heatNo,
  height: r.height,
  head: r.head,
  flange: r.flange,
  web: r.web,
  crown: r.crownProfile,
  fishing: r.fishingHeight ?? r.heightFishing,
  concavity: r.footFlatness,
  weight: r.weight ?? r.weightTaken,
  remarks: r.remark ?? r.remarks,
});

const Info = ({ label, value, span }) => (
  <td style={{ ...b, textAlign: "left" }} colSpan={span}>
    {label} <strong>{v(value)}</strong>
  </td>
);

const Rail60E1A1Sheet = ({ dateShiftText, micrometerNo, vernierNo, gauges, rows = [] }) => {
  const data = rows.map(norm);
  const blanks = Math.max(0, ROWS - data.length);

  return (
    <div style={{ color: "#000" }}>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>
        <div>राइट्स लिमिटेड – मध्यक्षेत्र , भिलाई</div>
        <div>RITES LTD- CENTRAL REGION, BHILAI</div>
        <div style={{ marginTop: 8, textDecoration: "underline" }}>
          रोलिंग चरण नियंत्रण रिपोर्ट (60ई1ए1) / ROLLING STAGE CONTROL REPORT (60E1A1)
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <tbody>
          <tr>
            <Info label="दिनांक और पारी/ Date & Shift:" value={dateShiftText} span={1} />
            <Info label="सेक्शन रोल्ड / Section Rolled:" value="60E1A1" span={1} />
            <Info label="मानक वजन / STD. WEIGHT:" value="" span={1} />
          </tr>
          <tr>
            <Info label="माइक्रोमीटर क्र./Micrometer No.:" value={micrometerNo} span={1} />
            <Info label="वर्नियर क्र./Vernier No.:" value={vernierNo} span={1} />
            <Info label="प्रयुक्त 'गो-नो-गो' गेज की संख्या/No. of 'Go- No-Go' Gauges Used:" value={gauges} span={1} />
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={h} rowSpan={2}>नमूना क्र./<br />Sample No.</th>
            <th style={h} rowSpan={2}>समय<br />Time</th>
            <th style={h} rowSpan={2}>हीट क्र.<br />Heat No.</th>
            <th style={h} colSpan={7}>पर्यवेक्षण / Observations</th>
            <th style={h} rowSpan={2}>लिया गया वजन<br />(किग्रा/मी)<br />Weight taken<br />(Kg/M)</th>
            <th style={h} rowSpan={2}>टिप्पणियाँ<br />Remarks</th>
          </tr>
          <tr>
            <th style={h}>ऊंचाई (मिमी)<br />Height(mm)</th>
            <th style={h}>हेड की चौड़ाई (मिमी)<br />Head width (mm)</th>
            <th style={h}>फ्लैंज चौड़ाई (मिमी)<br />Flange width (mm)</th>
            <th style={h}>वेब मोटाई (मिमी)<br />Web thickness (mm)</th>
            <th style={h}>क्राउन प्रोफाइल<br />Crown Profile</th>
            <th style={h}>फिशिंग की ऊंचाई (&lt;165 मिमी)<br />Height of Fishing (&lt;165mm)</th>
            <th style={h}>फुट बेस अवतलता<br />Foot base concavity</th>
          </tr>
          <tr>
            <th style={h} colSpan={12}>IRS T-12-2009 के अनुसार निर्दिष्ट आयाम /Specified Dimension as per IRS T-12-2009</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...h }} colSpan={3}>60E1A1</td>
            <td style={b}>134<br />(±0.7mm)</td>
            <td style={b}>72<br />(±0.5mm)</td>
            <td style={b}>140<br />(±1.0mm)</td>
            <td style={b}>44<br />(±0.7mm)</td>
            <td style={b}>±0.6 mm</td>
            <td style={b}>±0.5 mm</td>
            <td style={b}>0.3mm max</td>
            <td style={b}>72.97<br />(+1.5/-0.5%)</td>
            <td style={b}></td>
          </tr>
          {data.map((r, i) => (
            <tr key={i} style={{ height: 24 }}>
              {[r.sample, r.time, r.heat, r.height, r.head, r.flange, r.web, r.crown, r.fishing, r.concavity, r.weight, r.remarks]
                .map((x, c) => <td key={c} style={b}>{v(x)}</td>)}
            </tr>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <tr key={`blank-${i}`} style={{ height: 24 }}>
              {Array.from({ length: 12 }, (_, c) => <td key={c} style={b}>&nbsp;</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "right", marginTop: 40, marginRight: 30, fontSize: 12, fontWeight: 600 }}>
        <div>निरीक्षण अभियंता के हस्ताक्षर</div>
        <div>Signature of Inspecting Engineer</div>
      </div>
    </div>
  );
};

export default Rail60E1A1Sheet;
