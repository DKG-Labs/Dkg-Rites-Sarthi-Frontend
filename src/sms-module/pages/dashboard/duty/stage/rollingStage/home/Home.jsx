/* eslint-disable */
import React, { useEffect, useState } from "react";
import SubHeader from "../../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../../components/DKG_GeneralInfo";
import TabList from "../../../../../../components/DKG_TabList";
import getStageHomeTabs from "../../../../../../utils/frontSharedData/rollingStage/StageHome";
import { Divider } from 'antd';
import FormBody from "../../../../../../components/DKG_FormBody";
import FormInputItem from "../../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { endRollingDuty } from "../../../../../../store/slice/rollingDutySlice";
import { ExperimentOutlined }from '@ant-design/icons';

const Home = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({shiftRemarks: null});
    const dispatch = useDispatch();

    const handleFormSubmit = async () => {
        await dispatch(endRollingDuty(formData)).unwrap();
        navigate('/')
    }


    const rollingGeneralInfo = useSelector(state => state.rollingDuty);
    const railGrade = rollingGeneralInfo?.railGrade || "";

    const testSampleMarkingTab = {
        title: 'Testing Sample Marking',
        icon: <ExperimentOutlined />,
        link: "/stage/testSampleMarkingList",
        state: {
            state: {
                module: 'rolling',
                dutyId: rollingGeneralInfo.dutyId,
                generalInfo: rollingGeneralInfo,
                redirectTo: "/stage/home"
            }
        }
    }

  return (
    <FormContainer>
        <SubHeader title="Stage - Home" link="/" />
        <GeneralInfo data={rollingGeneralInfo} />

        <section className="mt-6">
            <TabList tabList={[...getStageHomeTabs(railGrade), testSampleMarkingTab]} />
        </section>

        <Divider className="mt-6 mb-1" />

        <FormBody initialValues={formData} onFinish={handleFormSubmit}>
            <FormInputItem placeholder='Enter Remarks' onChange={(_, value) => setFormData({shiftRemarks: value})} name='shiftRemarks' required/>
            <div className='flex justify-center'>
                <Btn htmlType='submit' className='w-36'>End Duty</Btn>
            </div>
        </FormBody>
    </FormContainer>
  )
}

export default Home

// import React, { useState } from "react";
// import { Select } from "antd";

// const { Option } = Select;

// const Home = () => {
//   const [firstValue, setFirstValue] = useState(null);
//   const [secondValue, setSecondValue] = useState(null);

//   const handleFirstChange = (value) => {
//     setFirstValue(value);
//     setSecondValue(null); 
//   };

//   return (
//     <div style={{ width: 300, margin: "20px auto" }}>
//       <Select
//         style={{ width: "100%", marginBottom: 10 }}
//         placeholder="Select first option"
//         onChange={handleFirstChange}
//         value={firstValue}
//         allowClear
//       >
//         <Option value="apple">Apple</Option>
//         <Option value="banana">Banana</Option>
//         <Option value="cherry">Cherry</Option>
//       </Select>

//       <Select
//         style={{ width: "100%" }}
//         placeholder="Select second option"
//         value={secondValue}
//         onChange={setSecondValue}
//         allowClear
//         disabled={!firstValue} // Disable if first is not selected
//       >
//         <Option value="red">Red</Option>
//         <Option value="green">Green</Option>
//         <Option value="blue">Blue</Option>
//       </Select>
//     </div>
//   );
// };

// export default Home;