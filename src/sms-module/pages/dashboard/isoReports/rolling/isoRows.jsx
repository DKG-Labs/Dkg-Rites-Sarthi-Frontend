/* eslint-disable */
/* Shared by the Rolling ISO reports: keep the printed form's entry rows even when there is little or no data. */
import React from "react";

/** Entry rows on the printed Rolling Stage Control forms */
export const FORM_ROWS = 15;

/** Blank rows after the data rows, up to FORM_ROWS */
export const BlankRows = ({ filled = 0, cols, rows = FORM_ROWS }) =>
  Array.from({ length: Math.max(0, rows - filled) }, (_, i) => (
    <tr key={`blank-${i}`} style={{ height: 26 }}>
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} style={{ border: "1px solid black" }}>&nbsp;</td>
      ))}
    </tr>
  ));

/** "dd/mm/yyyy - A", or blank when nothing is selected */
export const dateShift = (date, shift) => [date, shift].filter(Boolean).join(" - ");
