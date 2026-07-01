/* eslint-disable */
import React from 'react'
import data from "../../../../../utils/db.json";
import { Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import Btn from '../../../../../components/DKG_Btn';
import FormContainer from '../../../../../components/DKG_FormContainer';

const { smsCheckListData: sampleData, smsGeneralInfo } = data;

const columns = [
  {
    title: 'S/No.',
    dataIndex: 'serialNo',
    key: 'serialNo',
  },
  {
    title: 'Cast No.',
    dataIndex: 'castNo',
    key: 'castNo',
    fixed: 'left'
  },
  {
    title: 'M/c',
    dataIndex: 'machine',
    key: 'machine',
  },
  {
    title: 'Probe Make Name',
    dataIndex: 'probeMakeName',
    key: 'probeMakeName',
  },
  {
    title: 'H2',
    dataIndex: 'h2',
    key: 'h2',
  },
  {
    title: 'Is Hydris Measured b/w 80 to 100 m of casting',
    dataIndex: 'isHydrisMeasured',
    key: 'isHydrisMeasured',
  },
  {
    title: 'Is Probe Dipped Below 300 mm from Slag - metal Interface',
    dataIndex: 'isProbeDipped',
    key: 'isProbeDipped',
  },
  {
    title: 'Use of Imported Casting Powder : (Name of Castin Powder Make)',
    dataIndex: 'importedCastingPowder',
    key: 'importedCastingPowder',
  },
];


const SmsCheckList = () => {
  const navigate = useNavigate()
  return (
    <FormContainer>
      <SubHeader title='SMS - Report - Check List' link='/sms/sms/shiftReports' />
      <GeneralInfo data={smsGeneralInfo} />
      <section>
        <Table
          dataSource={sampleData}
          columns={columns}
          scroll={{ x: true }}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20"],
          }}
        />
      </section>
        <Btn onClick={() => navigate(-1)} className='mx-auto'> Go Back </Btn>
    </FormContainer>
  )
}

export default SmsCheckList
