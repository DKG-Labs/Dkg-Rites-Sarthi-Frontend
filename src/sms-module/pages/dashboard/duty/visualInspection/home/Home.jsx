/* eslint-disable */
import React, { useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
import TabList from "../../../../../components/DKG_TabList";
import visualHomeTabs from '../../../../../utils/frontSharedData/VisualInspection/VIHome';
import { message, Checkbox, Divider } from 'antd';
import FormBody from "../../../../../components/DKG_FormBody";
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { handleChange } from "../../../../../utils/CommonFunctions";
import { endViDuty } from "../../../../../store/slice/viDutySlice";
import { ExperimentOutlined }from '@ant-design/icons';

const Home = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const viGeneralInfo = useSelector(state => state.viDuty);

    const testSampleMarkingTab = {
        title: 'Testing Sample Marking',
        icon: <ExperimentOutlined />,
        onClick: () => {
            message.info("Test Sample Marking is available in the Rolling Stage module. Please start a Rolling duty to access this functionality.");
            navigate('/sms/stage');
        }
    }

    const [formData, setFormData] = useState({
        shiftRemarks: null,
        ieConfirmation: true
    })

    const handleFormSubmit = async () => {
        try{
            localStorage.removeItem("date")
            localStorage.removeItem("shift")
            await dispatch(endViDuty(formData)).unwrap();
            navigate('/');
        }
        catch(error){}
    }

  return (
    <FormContainer>
        <SubHeader title="Visual - Home" link="/" />
        <GeneralInfo data={viGeneralInfo} />

        <section className="mt-6">
            <TabList tabList={[...visualHomeTabs, testSampleMarkingTab]} />
        </section>

        <Divider className="mt-0 mb-0" />

        <FormBody initialValues={formData} onFinish={handleFormSubmit}>
            <Checkbox checked={formData.ieConfirmation} name="ieConfirmation" onChange={(e) => handleChange("ieConfirmation", e.target.checked, setFormData)}>Mark right if other IEs confirmation are done</Checkbox>
            
            <Divider className="mt-8" />

            <FormInputItem placeholder='Enter Remarks' onChange={(name, value) => handleChange(name, value, setFormData)} name='shiftRemarks' required/>
            <div className='flex justify-center'>
                <Btn htmlType='submit' className='w-36'>End Duty</Btn>
            </div>
        </FormBody>
    </FormContainer>
  )
}

export default Home