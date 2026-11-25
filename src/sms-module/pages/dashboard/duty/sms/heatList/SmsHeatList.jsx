/* eslint-disable */
import React from "react";
import { Table, Alert, Button } from "antd";
import { useNavigate } from "react-router-dom";
import FormContainer from "../../../../../components/DKG_FormContainer";
import SubHeader from "../../../../../components/DKG_SubHeader";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import Btn from "../../../../../components/DKG_Btn";
import useSmsShiftHeats, { num } from "../../../../../utils/useSmsShiftHeats";

// Heats of the current SMS duty (date + shift + SMS) from /sms/getHeatSummary
const columns = [
  { title: "S.No.", dataIndex: "serialNumber", key: "serialNumber", width: 70 },
  { title: "Heat Number", dataIndex: "heatNo", key: "heatNo", fixed: "left" },
  { title: "Caster No.", dataIndex: "casterNumber", key: "casterNumber", render: num },
  { title: "Seq. No.", dataIndex: "sequenceNo", key: "sequenceNo", render: num },
  { title: "Ladle Chemical Analysis", dataIndex: "chemical", key: "chemical", render: num },
  { title: "N", dataIndex: "nitrogen", key: "nitrogen", render: num },
  { title: "O", dataIndex: "oxygen", key: "oxygen", render: num },
  { title: "H", dataIndex: "hydrogen", key: "hydrogen", render: num },
  { title: "Vac. Level", dataIndex: "degassingVacuum", key: "degassingVacuum", render: num },
  { title: "Deg. Time", dataIndex: "degassingDuration", key: "degassingDuration", render: num },
];

const SmsHeatList = () => {
  const navigate = useNavigate();
  const { info, rows, loading, error, reload } = useSmsShiftHeats();
  return (
    <FormContainer>
      <SubHeader title="SMS - Report - Heat List" link="/sms/sms/shiftReports" />
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

export default SmsHeatList;
