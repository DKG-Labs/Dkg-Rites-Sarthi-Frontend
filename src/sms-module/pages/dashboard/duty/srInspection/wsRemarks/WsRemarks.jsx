/* eslint-disable */
import React, { useCallback, useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import data from "../../../../../utils/frontSharedData/srInspection/srInspection.json";
import Btn from '../../../../../components/DKG_Btn';
import { useNavigate } from 'react-router-dom'
import { Divider, Table } from 'antd';
import { apiCall } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';

const { srInspectionGeneralInfo } = data;

const WsRemarks = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/sms/srInspection/home");
  }

  const columns = [
    {
      title: "Shift Details",
      dataIndex: "shiftDtls"
    },
    {
      title: "Remarks",
      dataIndex: "shiftRemarks",
      render: (data) => data || "----"
    }
  ]

  const [dataSource, setDataSource] = useState([]);

  const {token} = useSelector(state => state.auth)

  const {dutyId} = useSelector(state => state.sriDuty)

  const populateWsRemarks = useCallback(async () => {
    try{
      const {data} = await apiCall("GET", `/shortrailinspection/getWorkStationRemarks?dutyId=${dutyId}`, token);
      setDataSource(data?.responseData || [])
    }
    catch(error){}
  }, [])

  useEffect(() => {
    populateWsRemarks()
  }, [populateWsRemarks])

  return (
    <FormContainer>
      {/* <SubHeader title='Other Workstation Remarks' link='/srInspection/home' />
      <GeneralInfo data={srInspectionGeneralInfo} />

      <section>
        <h3>SMS 2: <span className='font-light'>Shift Remarks</span></h3>
        <h3 className='mt-3'>SMS 3: <span className='font-light'>Shift Remarks</span></h3>
        <h3 className='mt-3'>RSM Rolling Stage: <span className='font-light'>Shift Remarks</span></h3>
        <h3 className='mt-3'>URM Rolling Stage: <span className='font-light'>Shift Remarks</span></h3>
        <h3 className='mt-3'>NDT:
          <section className='mt-2 ml-10'>
            <h3>RSM - LR: <span className='font-light'>Shift Remarks</span></h3>
            <h3 className='mt-3'>RSM - SR: <span className='font-light'>Shift Remarks</span></h3>
            <h3 className='mt-3'>URM - NDT1: <span className='font-light'>Shift Remarks</span></h3>
            <h3 className='mt-3'>URM - NDT2: <span className='font-light'>Shift Remarks</span></h3>
          </section>
        </h3>

        <h3 className='mt-3'>Testing: <span className='font-light'>Shift Remarks</span></h3>

        <h3 className='mt-3'>Visual Inspection:
          <section className='mt-2 ml-10'>
            <h3>URM: <span className='font-light'>Shift Remarks</span></h3>
            <h3 className='mt-3'>RSM: <span className='font-light'>Shift Remarks</span></h3>
          </section>
        </h3>

        <h3 className='mt-3 mb-8'>Welding:
          <section className='mt-1 ml-10'>
            <h3>RSM: <span className='font-light'>Shift Remarks</span></h3>
            <h3 className='mt-2'>URM:
              <section className='mt-1 ml-10'>
                <h3>L3: <span className='font-light'>Shift Remarks</span></h3>
                <h3 className='mt-2'>L4: <span className='font-light'>Shift Remarks</span></h3>
                <h3 className='mt-2'>L5: <span className='font-light'>Shift Remarks</span></h3>
                <h3 className='mt-2'>L6: <span className='font-light'>Shift Remarks</span></h3>
              </section>
            </h3>
          </section>
        </h3>

        <Divider />

        <div className='flex justify-center mt-4'>
          <Btn className='w-36' onClick={handleClick}>OK</Btn>
        </div>
      </section> */}
      <Table columns={columns} dataSource={dataSource} pagination={false} />
    </FormContainer>
  )
}

export default WsRemarks