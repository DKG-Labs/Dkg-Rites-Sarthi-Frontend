/*
 * Start-duty rules shared by the rail-mill duty forms (Rolling, NDT):
 *  - Date: today or yesterday only
 *  - Shift: today -> A / B / C, yesterday -> C only
 *  - Organisation: BSP / JSPL; JSPL has only the URM mill
 */
import dayjs from "dayjs";

const DATE_FORMAT = "DD/MM/YYYY";

export const ORGANISATION_LIST = [
  { key: "BSP", value: "BSP" },
  { key: "JSPL", value: "JSPL" },
];

const isYesterday = (d) => d.isSame(dayjs().subtract(1, "day"), "day");

/** DatePicker disabledDate: everything except today and yesterday */
export const disableNonDutyDates = (current) =>
  !!current && !(current.isSame(dayjs(), "day") || isYesterday(current));

/** Shifts allowed for the selected date (DD/MM/YYYY) */
export const shiftsForDate = (dateStr, allShifts) => {
  const d = dateStr ? dayjs(dateStr, DATE_FORMAT) : null;
  return d && d.isValid() && isYesterday(d) ? allShifts.filter((s) => s.key === "C") : allShifts;
};

/** Mills allowed for the organisation (JSPL: URM only); empty until an organisation is chosen */
export const millsForOrg = (org, allMills) => {
  if (org === "JSPL") return allMills.filter((m) => m.key === "URM");
  return org ? allMills : [];
};
