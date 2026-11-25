/* eslint-disable */
import React from "react";
import { Table, Alert, Button } from "antd";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import { useNavigate } from "react-router-dom";
import Btn from "../../../../../components/DKG_Btn";
import FormContainer from "../../../../../components/DKG_FormContainer";
import useSmsShiftHeats, { num } from "../../../../../utils/useSmsShiftHeats";

// Process verification of the current SMS duty's heats (converter turn-down, degassing, casting)
const withUnit = (unit) => (v) => (v === null || v === undefined || v === "" ? "-" : `${v} ${unit}`);
const columns = [
  { title: "S.No.", dataIndex: "serialNumber", key: "serialNumber", width: 70 },
  { title: "Cast No.", dataIndex: "heatNo", key: "heatNo", fixed: "left" },
  { title: "Converter - Turn Down Temp.", dataIndex: "turnDownTemp", key: "turnDownTemp", render: withUnit("°C") },
  { title: "Degassing - Vacuum", dataIndex: "degassingVacuum", key: "degassingVacuum", render: num },
  { title: "Degassing - Duration", dataIndex: "degassingDuration", key: "degassingDuration", render: withUnit("min") },
  { title: "Casting Temp.", dataIndex: "castingTemp", key: "castingTemp", render: withUnit("°C") },
  { title: "Prime / CO / Rejected Blooms", key: "blooms",
    render: (_, r) => `${num(r.noOfPrimeBlooms)} / ${num(r.noOfCoBlooms)} / ${num(r.noOfRejectedBlooms)}` },
];

const SmsVerification = () => {
  const navigate = useNavigate();
  const { info, rows, loading, error, reload } = useSmsShiftHeats();
  return (
    <FormContainer>
      <SubHeader title="SMS - Verification Report" link="/sms/sms/shiftReports" />
      <GeneralInfo data={info} />
      <section>
        {error && (
          <Alert type="warning" showIcon message={error} className="mb-3"
            action={<Button size="small" onClick={reload}>Retry</Button>} />
        )}
        <Table
          dataSource={rows}
          columns={columns}
          loading={loading}
          scroll={{ x: true }}
          locale={{ emptyText: "No heats recorded in this shift yet." }}
          pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ["5", "10", "20"] }}
        />
      </section>
      <Btn onClick={() => navigate(-1)} className="mx-auto"> Go Back </Btn>
    </FormContainer>
  );
};

export default SmsVerification;
