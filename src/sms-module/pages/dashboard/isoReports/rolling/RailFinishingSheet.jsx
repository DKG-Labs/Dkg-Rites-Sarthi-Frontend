/* eslint-disable */
/*
 * Verification Report (Rail Finishing) laid out like the printed ISO forms:
 *  - URM: F/CR-BSP/7.5/17/14 — Hot Stamping, Pre-Cambering, Straightening Machine
 *  - RSM: F/CR-BSP/7.5/17/09 — Cooling Bed, Pre-Cambering, Straightening Machine (Short / Long Rail)
 * The rows are always shown; saved checks of the selected date / shift fill "Verification of Record".
 */
import React from "react";

const SAT = "Satisfactory/ Unsatisfactory";
const satText = (v) => (v === true ? "Satisfactory" : v === false ? "Unsatisfactory" : null);

/** numbered lines: saved values first, then blank slots up to the form's count */
const lines = (values, slots, placeholder = "") => {
  const out = values.filter((v) => v !== null && v !== undefined && v !== "").map((v, i) => `${i + 1}. ${v}`);
  for (let i = out.length; i < slots; i++) out.push(`${i + 1}. ${placeholder}`);
  return out;
};

/** "dd/mm/yyyy - A", or blank when nothing is selected */
export const dateShift = (date, shift) => [date, shift].filter(Boolean).join(" - ");

const cell = { border: "1px solid #000", padding: "6px 8px", verticalAlign: "top", fontSize: 12, color: "#000" };
const head = { ...cell, textAlign: "center", fontWeight: 600, verticalAlign: "middle" };

const Lines = ({ items }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {items.map((t, i) => <div key={i}>{t}</div>)}
  </div>
);

const Point = ({ no, hi, en }) => (
  <div>
    <div style={{ fontWeight: 600 }}>{no}. {hi}</div>
    <div>{en}</div>
  </div>
);

const RailFinishingSheet = ({ mill, data }) => {
  const isUrm = mill === "URM";
  const hot = (data?.hotStampingList || []).map((h) => [h.heatNo, h.branding].filter(Boolean).join(" - "));
  const pre = (data?.preCamberingList || []).map((p) => [p.heatNo, satText(p.isSatisfactory)].filter(Boolean).join(" - "));
  const sm = data?.straighteningMachineList || [];
  const straightness = sm.map((s) => s.straightnessRemarks);
  const slots = isUrm ? 1 : 3;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
      <thead>
        <tr>
          <th style={{ ...head, width: "32%" }}>सत्यापन बिंदु<br />Point of Verification</th>
          <th style={{ ...head, width: "30%" }}>पैरामीटर<br />Parameter</th>
          <th style={head}>रिकॉर्ड का सत्यापन<br />Verification of Record</th>
        </tr>
      </thead>
      <tbody>
        <tr style={{ height: 110 }}>
          <td style={cell}>
            {isUrm
              ? <Point no={1} hi="रेल की हॉट स्टैम्पिंग" en="HOT STAMPING OF RAILS" />
              : <Point no={1} hi="कूलिंग बेड" en="COOLING BED" />}
          </td>
          <td style={cell}>{isUrm ? "a) Visual" : "a) Visual Examination"}</td>
          <td style={cell}><Lines items={isUrm ? lines(hot, 0) : lines(hot, 3)} /></td>
        </tr>
        <tr style={{ height: 80 }}>
          <td style={cell}><Point no={2} hi="लंबी रेल की प्री-कैम्बरिंग" en="PRE-CAMBERING OF LONG RAIL" /></td>
          <td style={cell}>a) Visual</td>
          <td style={cell}><Lines items={lines(pre, 0)} /></td>
        </tr>
        {isUrm ? (
          <>
            <tr style={{ height: 110 }}>
              <td style={cell} rowSpan={2}><Point no={3} hi="स्ट्रेटनिंग मशीन" en="STRAIGHTENING MACHINE" /></td>
              <td style={cell}>a) Pressure Triangle/Roll Deflection</td>
              <td style={cell}><Lines items={lines(sm.map((s) => satText(s.smIsSatisfactory)), slots, SAT)} /></td>
            </tr>
            <tr style={{ height: 110 }}>
              <td style={cell}>b) Straightness of Rails</td>
              <td style={cell}><Lines items={lines(straightness, slots, SAT)} /></td>
            </tr>
          </>
        ) : (
          <>
            <tr>
              <td style={cell} rowSpan={4}><Point no={3} hi="स्ट्रेटनिंग मशीन" en="STRAIGHTENING MACHINE" /></td>
              <td style={cell} colSpan={2}>a) Pressure Triangle/Roll Deflection</td>
            </tr>
            <tr>
              <td style={{ ...cell, paddingLeft: 24 }}>i) Short Rail</td>
              <td style={cell}><Lines items={lines(sm.map((s) => satText(s.smSrIsSatisfactory)), slots, SAT)} /></td>
            </tr>
            <tr>
              <td style={{ ...cell, paddingLeft: 24 }}>ii) Long Rail</td>
              <td style={cell}><Lines items={lines(sm.map((s) => satText(s.smLrIsSatisfactory)), slots, SAT)} /></td>
            </tr>
            <tr>
              <td style={cell}>b) Straightness of Rails</td>
              <td style={cell}><Lines items={lines(straightness, slots, SAT)} /></td>
            </tr>
          </>
        )}
        <tr>
          <td colSpan={3} style={{ ...cell, height: 110, verticalAlign: "bottom", textAlign: "right", paddingRight: 40 }}>
            <div>हस्ताक्षर / Signature: .............................</div>
            <div style={{ marginTop: 10 }}>(नाम / Name: ........................................)</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default RailFinishingSheet;
