/* eslint-disable */
import React, { useState } from "react";
import TableComponent from "../../../components/DKG_Table";
import SubHeader from "../../../components/DKG_SubHeader";
import { apiCall } from "../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import { Button, Select, Alert, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { CloseCircleOutlined } from "@ant-design/icons";
import "./SmsRecord.css";

/*
 * SMS Summary record — shift-wise or day-wise, one row per SMS & caster.
 * Filters: date range, SMS & caster, rail grade, reason for rejection. Data: /sms/getSmsShiftDaySummary.
 */

// Casters as entered in the SMS heat form (SMS 2: M/c IV, M/c V; SMS 3: CV1, CV2)
const SMS_CASTERS = ["SMS 2 - M/c IV", "SMS 2 - M/c V", "SMS 3 - CV1", "SMS 3 - CV2"];
const RAIL_GRADES = ["R260", "R350HT", "880", "1080HH"];
const REASONS = [
  { value: "HYDROGEN", label: "Hydrogen" },
  { value: "CHEMICAL", label: "Chemical" },
  { value: "NITROGEN", label: "Nitrogen" },
  { value: "OXYGEN", label: "Oxygen" },
];

const wt = (v) => (v === null || v === undefined || v === "" ? "-" : Number(v).toFixed(3));

const columns = [
  { title: "Date", dataIndex: "dateAndShift", key: "dateAndShift", fixed: "left" },
  { title: "Manufacturer", dataIndex: "manufacturer", key: "manufacturer" },
  { title: "SMS & Caster Number", dataIndex: "smsCaster", key: "smsCaster" },
  { title: "Rail Grade", dataIndex: "railGrade", key: "railGrade" },
  { title: "No. of Heats Casted", dataIndex: "numberOfHeatsCast", key: "numberOfHeatsCast", align: "right" },
  { title: "No. of Heats Rejected", dataIndex: "numberOfHeatsRejected", key: "numberOfHeatsRejected", align: "right" },
  { title: "No. of Diverted Heats", dataIndex: "numberOfDivertedHeats", key: "numberOfDivertedHeats", align: "right" },
  { title: "Rejected Heat Numbers", dataIndex: "rejectedHeatNumbers", key: "rejectedHeatNumbers",
    render: (v) => v || "-" },
  { title: "Reason for Rejection", dataIndex: "reasonForRejection", key: "reasonForRejection",
    render: (v) => (v ? v.split(", ").map(r => r.charAt(0) + r.slice(1).toLowerCase()).join(", ") : "-") },
  { title: "Weight of Heats Casted (MT)", dataIndex: "weightOfHeatsCast", key: "weightOfHeatsCast", align: "right", render: wt },
  { title: "Weight of Prime Blooms (MT)", dataIndex: "weightOfPrimeBlooms", key: "weightOfPrimeBlooms", align: "right", render: wt },
  { title: "Weight of CO Blooms (MT)", dataIndex: "weightOfCOBlooms", key: "weightOfCOBlooms", align: "right", render: wt },
  { title: "Weight of Accepted Blooms (MT) (Prime + CO)", dataIndex: "weightOfAcceptedBlooms", key: "weightOfAcceptedBlooms", align: "right", render: wt },
  { title: "Weight of Rejected Blooms (MT)", dataIndex: "weightOfRejectedBlooms", key: "weightOfRejectedBlooms", align: "right", render: wt },
];

const DATE_FMT = "DD/MM/YYYY";
const EMPTY = { startDate: null, endDate: null, groupBy: "SHIFT", smsCaster: undefined, railGrade: undefined, reason: undefined };

const SmsRecord = () => {
  const { token } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState(EMPTY);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const set = (name, value) => setFilter((prev) => ({ ...prev, [name]: value }));

  const search = async (override = {}) => {
    const f = { ...filter, ...override };
    if (!f.startDate || !f.endDate) {
      message.error("Select the From and To dates.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await apiCall("POST", "/sms/getSmsShiftDaySummary", token, {
        startDate: f.startDate,
        endDate: f.endDate,
        groupBy: f.groupBy,
        smsCaster: f.smsCaster || null,
        railGrade: f.railGrade || null,
        reason: f.reason || null,
      });
      setDataSource((data?.responseData || []).map((r, i) => ({ ...r, key: i })));
      setSearched(true);
    } catch (e) {
      setDataSource([]);
      setError(e?.message || "Could not load the SMS summary.");
    } finally {
      setLoading(false);
    }
  };

  // Changing Shift wise / Day wise re-runs the search when dates are set
  const changeGroupBy = (value) => {
    set("groupBy", value);
    if (filter.startDate && filter.endDate) search({ groupBy: value });
  };

  const reset = () => {
    setFilter(EMPTY);
    setDataSource([]);
    setSearched(false);
    setError("");
  };

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <SubHeader title="SMS Summary" link="/sms/" />

      <div className="sms-sum">
        {/* Shift wise / Day wise */}
        <div className="sms-sum-toggle" role="radiogroup" aria-label="Summary type">
          {[["SHIFT", "Shift wise"], ["DAY", "Day wise"]].map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={filter.groupBy === v}
              className={filter.groupBy === v ? "on" : ""} onClick={() => changeGroupBy(v)}>
              {label}
            </button>
          ))}
        </div>

        {/* Filters: one row, same 40px height, labels aligned */}
        <div className="sms-sum-filters">
          <label className="sms-sum-field">
            <span>From <em>*</em></span>
            <DatePicker size="large" format={DATE_FMT} placeholder="From date" allowClear
              value={filter.startDate ? dayjs(filter.startDate, DATE_FMT) : null}
              onChange={(d) => set("startDate", d ? d.format(DATE_FMT) : null)} />
          </label>
          <label className="sms-sum-field">
            <span>To <em>*</em></span>
            <DatePicker size="large" format={DATE_FMT} placeholder="To date" allowClear
              value={filter.endDate ? dayjs(filter.endDate, DATE_FMT) : null}
              disabledDate={(d) => filter.startDate && d && d.isBefore(dayjs(filter.startDate, DATE_FMT), "day")}
              onChange={(d) => set("endDate", d ? d.format(DATE_FMT) : null)} />
          </label>
          <label className="sms-sum-field">
            <span>SMS &amp; Caster Number</span>
            <Select size="large" allowClear showSearch placeholder="All" value={filter.smsCaster}
              onChange={(v) => set("smsCaster", v)} options={SMS_CASTERS.map((v) => ({ value: v, label: v }))} />
          </label>
          <label className="sms-sum-field">
            <span>Rail Grade</span>
            <Select size="large" allowClear showSearch placeholder="All" value={filter.railGrade}
              onChange={(v) => set("railGrade", v)} options={RAIL_GRADES.map((v) => ({ value: v, label: v }))} />
          </label>
          <label className="sms-sum-field">
            <span>Reason for Rejection</span>
            <Select size="large" allowClear placeholder="All" value={filter.reason}
              onChange={(v) => set("reason", v)} options={REASONS} />
          </label>
          <div className="sms-sum-actions">
            <Button type="primary" size="large" onClick={() => search()} loading={loading} className="sms-sum-search">
              Search
            </Button>
            <Button size="large" onClick={reset} disabled={loading} icon={<CloseCircleOutlined />}>
              Reset
            </Button>
          </div>
        </div>

        {error && (
          <Alert type="error" showIcon message={error} className="mx-2"
            action={<Button size="small" onClick={() => search()}>Retry</Button>} />
        )}

        {searched && !loading && !error && dataSource.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No SMS heats for these filters. Change the dates or filters and search again.</div>
        ) : (
          <TableComponent dataSource={dataSource} columns={columns} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default SmsRecord;
