/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import SubHeader from '../../../../../components/DKG_SubHeader'
import { Divider } from 'antd';
import { Table, Form } from "antd";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/ndt/ndt.json";
import { useNavigate } from 'react-router-dom'
import Btn from '../../../../../components/DKG_Btn';
import FormContainer from '../../../../../components/DKG_FormContainer';
import { apiCall } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';

const { ndtRailWiseData: sampleData, columns, ndtGeneralInfo } = data;

const NReport = () => {
  const navigate = useNavigate();

  const ndtGeneralInfo = useSelector((state) => state.ndtDuty);
  const { token } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const [formData, setFormData] = useState({
    ndtDtlList: [
      // {
      //   heatNo: "H12345",
      //   sequenceNo: null,
      //   heatRemark: null,
      //   isDiverted: false,
      //   hydris: null,
      //   heatStage: "Converter"
      // }
    ]
  });

  const populateTableData = useCallback(async () => {
    try {
      const { data } = await apiCall(
        "GET",
        `/ndt/calibration/getCalibrationDtls?dutyId=${ndtGeneralInfo.dutyId}`,
        token
      );
      const { responseData } = data;

      setFormData({
        heatDtlList: responseData?.heatDtlList,
      });
    } catch (error) {}
  }, [ndtGeneralInfo.dutyId, token]);

  useEffect(() => {
    populateTableData();
  }, [populateTableData]);

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [formData, form]);

  const handleClick = () => {
    navigate('/sms/ndt/home')
  }

  return (
    <FormContainer>
        <SubHeader title='NDT - Report' link='/ndt/home' />
        <GeneralInfo data={ndtGeneralInfo} />

        <Divider>Rail Wise Record</Divider>

        <Table
            dataSource={formData.ndtDtlList}
            columns={columns}
            scroll={{ x: true }}
            pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30"],
            }}
        />

        <div className='flex justify-center mt-4'>
            <Btn onClick={handleClick}>NDT Home</Btn>
        </div>
    </FormContainer>
  )
}

export default NReport