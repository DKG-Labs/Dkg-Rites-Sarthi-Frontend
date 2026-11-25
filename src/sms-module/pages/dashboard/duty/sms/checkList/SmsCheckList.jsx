/* eslint-disable */
import React from 'react'
import { Table, Alert, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import Btn from '../../../../../components/DKG_Btn';
import FormContainer from '../../../../../components/DKG_FormContainer';
import useSmsShiftHeats, { num, yesNo } from '../../../../../utils/useSmsShiftHeats';

// Hydris / casting check list of the current SMS duty's heats (from /sms/getHeatSummary)
const columns = [
  { title: 'S/No.', dataIndex: 'serialNumber', key: 'serialNumber', width: 70 },
  { title: 'Cast No.', dataIndex: 'heatNo', key: 'heatNo', fixed: 'left' },
  { title: 'M/C', dataIndex: 'casterNumber', key: 'casterNumber', render: num },
  { title: 'Probe Make Name', dataIndex: 'probeMakeName', key: 'probeMakeName', render: num },
  { title: 'H2', dataIndex: 'hydrogen', key: 'hydrogen', render: num },
  { title: 'Is Hydris measured b/w 80 to 100 m of casting', dataIndex: 'isHydrisMeasuredBw80To100mOfCasting', key: 'hydrisBw', render: yesNo },
  { title: 'Is probe dipped below 300 mm from slag - metal interface', dataIndex: 'isProbeDippedBelow300mmFromSlagMetalInterface', key: 'probeDipped', render: yesNo },
  { title: 'Use of imported casting powder (name of casting powder make)', dataIndex: 'makeOfCastingPowder', key: 'makeOfCastingPowder', render: num },
];

const SmsCheckList = () => {
  const navigate = useNavigate()
  const { info, rows, loading, error, reload } = useSmsShiftHeats();
  return (
    <FormContainer>
      <SubHeader title='SMS - Report - Check List' link='/sms/sms/shiftReports' />
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
          locale={{ emptyText: 'No heats recorded in this shift yet.' }}
          pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ['5', '10', '20'] }}
        />
      </section>
      <Btn onClick={() => navigate(-1)} className='mx-auto'> Go Back </Btn>
    </FormContainer>
  )
}

export default SmsCheckList
