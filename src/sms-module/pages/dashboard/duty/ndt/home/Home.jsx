/* eslint-disable */
import React, { useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/ndt/ndt.json";
import TabList from "../../../../../components/DKG_TabList";
import ndtHomeTabs from '../../../../../utils/frontSharedData/ndt/ndtHome';
import { message, Divider } from 'antd';
import FormBody from "../../../../../components/DKG_FormBody";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { handleChange } from "../../../../../utils/CommonFunctions";
import { endNdtDuty } from '../../../../../store/slice/ndtDutySlice';
import { ExperimentOutlined }from '@ant-design/icons';

// const { ndtGeneralInfo } = data;

const Home = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({shiftRemarks: null})
    const dispatch = useDispatch();

    const handleFormSubmit = async () => {
        await dispatch(endNdtDuty(formData)).unwrap();
        navigate('/')
    }

    const ndtGeneralInfo = useSelector(state => state.ndtDuty);

    const testSampleMarkingTab = {
        title: 'Testing Sample Marking',
        icon: <ExperimentOutlined />,
        onClick: () => {
            message.info("Test Sample Marking is available in the Rolling Stage module. Please start a Rolling duty to access this functionality.");
            navigate('/sms/stage');
        }
    }

  return (
    <FormContainer>
        <SubHeader title="NDT - Home" link="/" />
        <GeneralInfo data={ndtGeneralInfo} />

        <section className="mt-6">
            <TabList tabList={[...ndtHomeTabs, testSampleMarkingTab]} />
        </section>

        <Divider className="mt-2 mb-0" />

        <FormBody initialValues={formData} onFinish={handleFormSubmit}>            
            <FormInputItem placeholder='Enter Remarks' onChange={(field, value) => handleChange(field, value, setFormData)} name='shiftRemarks' required/>

            <div className='flex justify-center'>
                <Btn htmlType='submit' className='w-36'>End Duty</Btn>
            </div>
        </FormBody>
    </FormContainer>
  )
}

export default Home