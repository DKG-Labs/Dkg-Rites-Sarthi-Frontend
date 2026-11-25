/* Shared helpers for the SMS Chemical Analysis Witness ISO reports (page 1 and page 2). */

/** Printed form has this many entry rows; the screen always shows at least these. */
export const FORM_ROWS = 12;

/** antd column title with the Hindi line above the English one */
export const bi = (hi, en) => (
  <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
    {hi && <div style={{ fontWeight: 400 }}>{hi}</div>}
    <div>{en}</div>
  </div>
);

/** Heats of the selected date / shift / SMS from /iso/getSmsChemicalAnalysis (cast no., seq., N, O, H2, degassing). */
export const mapHeats = (responseData) => (responseData || []).map((item, i) => ({
  key: `h-${i}`,
  sno: i + 1,
  heatNo: item.heatNumber,
  seqNo: item.sequenceNumber,
  nitrogen: item.nitrogen,
  oxygen: item.oxygen,
  hydris: item.hydris,
  degassingVacuum: item.degassingVacuum,
  degassingDuration: item.degassingDuration,
  remarks: item.heatRemark || '',
}));

/** Data rows padded with blank rows up to the printed form's length (blank form when there is no data). */
export const padRows = (rows) => {
  const out = [...rows];
  for (let i = out.length; i < FORM_ROWS; i++) out.push({ key: `blank-${i}`, blank: true });
  return out;
};

/** "dd/mm/yyyy - A", or blank when nothing is selected (never "null - null"). */
export const dateShift = (date, shift) => [date, shift].filter(Boolean).join(' - ');
