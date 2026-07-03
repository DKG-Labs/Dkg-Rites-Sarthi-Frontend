/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import TabList from "../../../../../components/DKG_TabList";
import weldingHomeTabs from '../../../../../utils/frontSharedData/weldingInspection/WeldingHome';
import { message, Divider, Table, Form } from 'antd';
import FormInputItem from "../../../../../components/DKG_FormInputItem";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from "react-redux";
import { apiCall, handleChange } from "../../../../../utils/CommonFunctions";
import TextAreaComponent from "../../../../../components/DKG_TextAreaComponent";
import { endWeldingDuty } from "../../../../../store/slice/weldingDutySlice";


const machineWiseCountColumns = [
  {
    title: 'Machine No.',
    dataIndex: 'machineNo',
    key: 'machineNo',
    align: 'center',
  },
  {
    title: "TLT",
    dataIndex: 'tltCount',
    key: 'tltCount',
    align: 'center',
  },
  {
    title:"Hardness",
    dataIndex: 'hardnessCount',
    key: 'hardnessCount',
    align: 'center',
  },
  {
    title: 'Micro',
    dataIndex: 'microCount',
    key: 'microCount',
    align: 'center',
  },
  {
    title: 'Macro',
    dataIndex: 'macroCount',
    key: 'macroCount',
    align: 'center',
  }
]

// const machineWiseCountColumns = [
//   {
//     title: 'Machine No.',
//     dataIndex: 'machineNo',
//     key: 'machineNo',
//     align: 'center',
//   },
//   {
//     title: "TLT",
//     dataIndex: 'tltCount',
//     key: 'tltCount',
//     align: 'center',
//   },
//   {
//     title:"Hardness",
//     dataIndex: 'hardnessCount',
//     key: 'hardnessCount',
//     align: 'center',
//   },
//   {
//     title: 'Micro',
//     dataIndex: 'microCount',
//     key: 'microCount',
//     align: 'center',
//   },
//   {
//     title: 'Macro',
//     dataIndex: 'macroCount',
//     key: 'macroCount',
//     align: 'center',
//   }
// ]

const WeldingHome = () => {
    const navigate = useNavigate();
  const [form] = Form.useForm();
    const [formData, setFormData] = useState({
      machineSNoHead: null,
      machineSNoFoot: null,
      probeDetailsHead: null,
      probeDetailsFoot: null,
      probeDbHead: null,
      probeDbFoot: null,
      remarksHead: null,
      remarksFoot: null,
      shiftRemarks: null,
      jointsWeldedPrevShiftBsp4: null,
      jointsWeldedPrevShiftBsp1: null,
      jointsWeldedPrevShiftBsp2: null
    });
    const {token} = useSelector(state => state.auth);
    const weldingGeneralInfo = useSelector(state => state.weldingDuty);

    const [machineWiseCount, setMachineWiseCount] = useState([]);
    const dispatch = useDispatch();
    const handleFormSubmit = async () => {
      try{
        await dispatch(endWeldingDuty(formData)).unwrap();
        localStorage.removeItem("weldEndDuty")
        navigate('/');
      }
      catch(error){}

    }

    const  populateData = useCallback(async () => {
      try{
        const {data} = await apiCall("GET", '/welding/getMachineWiseTestCount', token);

        setMachineWiseCount(data?.responseData || []);
      }catch(error){
      }
    }, [token])

    useEffect(() => {
      populateData();
    }, [populateData])


    useEffect(() => {
      const weldEndDuty = localStorage.getItem("weldEndDuty");
      if(weldEndDuty){
        setFormData(JSON.parse(weldEndDuty));
        form.setFieldsValue(JSON.parse(weldEndDuty))
      }
    }, [form])


    useEffect(() => {
      localStorage.setItem("weldEndDuty", JSON.stringify(formData))
    }, [formData])


  return (
    <FormContainer>
        <SubHeader title="Welding - Home" link="/" />
        <GeneralInfo data={weldingGeneralInfo} />

        <section>
          {
            weldingGeneralInfo.mill === 'RSM' && (
              <>
              {/* <Divider /> */}
              <h1 className="!text-xl font-semibold mt-2">Weld Joint Counter</h1>
              <div className="flex gap-2 my-4">
              <h2 className="font-bold">No. of Joints  welded in previous Shift after Weld Test (BSP4):</h2>
              <FormInputItem name="jointsWeldedPrevShiftBsp4" onChange={(name, value) => handleChange(name, value, setFormData)} />
              </div>
              <Divider />
              </>
            )
          }

          {
            (weldingGeneralInfo.mill === 'URM' && weldingGeneralInfo.weldingLine === 'L3') && (
              <>
              {/* <Divider className="mb-0" /> */}
              <h1 className="!text-xl font-semibold mt-2">Weld Joint Counter</h1>
               <div className="flex gap-2 my-4">
              <h2 className="font-bold">No. of Joints  welded in previous shift after Weld Test (BSP1):</h2>
              <FormInputItem name="jointsWeldedPrevShiftBsp1" onChange={(name, value) => handleChange(name, value, setFormData)} />
              </div>
               <div className="flex gap-2">
              <h2 className="font-bold">No. of Joints  welded in previous shift after Weld Test (BSP2):</h2>
              <FormInputItem name="jointsWeldedPrevShiftBsp2" onChange={(name, value) => handleChange(name, value, setFormData)} />
              </div>
              <Divider />
                {/* <h2 className="font-bold">No. of Joints  welded in previous shift after Weld Test (BSP1): <span className="font-normal text-red-500">{totalCountForBSP1}</span></h2>
                <h2 className="font-bold">No. of Joints  welded in this previous shift after Weld Test (BSP2): <span className="font-normal text-red-500">{totalCountForBSP2}</span></h2> */}
              </>
              
            )
          }
        </section>

        {/* <Form form={form} layout='vertical' initialValues={formData} onFinish={handleFormSubmit}>
        <h1 className="font-semibold !text-xl mb-4 underline">UT M/c Probe Setting Details</h1>
        <div className="border grid grid-cols-5 divide-x divide-y divide-gray-300">
          <div></div>
          <h3 className="font-semibold p-2 text-center">Machine Sno.</h3>
          <h3 className="font-semibold p-2 text-center">Probe Details</h3>
          <h3 className="font-semibold p-2 text-center">Probe DB</h3>
          <h3 className="font-semibold p-2 text-center">Remarks</h3>

          <h3 className="font-semibold p-2 text-center">Head</h3>
          <TextAreaComponent className="no-border" placeholder='Machine S.No.' name='machineSNoHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='probeDetailsHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='probeDbHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='remarksHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>

          <h3 className="font-semibold p-2 text-center">Foot</h3>
          <TextAreaComponent className="no-border" name='machineSNoFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='probeDetailsFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='probeDbFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='remarksFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
        </div>
            
          <Divider className= "mt-4" /> */}

          {/* <FormInputItem placeholder='Enter Remarks' name='shiftRemarks' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>

          <div className='flex justify-center'>
              <Btn htmlType='submit' className='w-36'>End Duty</Btn>
          </div> */}
          {/* </Form> */}

        <section className="-mt-4">
          <Table
            dataSource={machineWiseCount}
            columns={machineWiseCountColumns}
            scroll={{ x: true }}
            bordered
          />
        </section>

        <Divider className="mt-0 mb-0" />

        <section className="mt-6">
            <TabList tabList={weldingHomeTabs} />
        </section>


        <Form form={form} layout='vertical' initialValues={formData} onFinish={handleFormSubmit}>
        <h1 className="font-semibold !text-xl mb-4 underline">UT M/c Probe Setting Details</h1>
        <div className="border grid grid-cols-5 divide-x divide-y divide-gray-300">
          <div></div>
          <h3 className="font-semibold p-2 text-center">Machine Sno.</h3>
          <h3 className="font-semibold p-2 text-center">Probe Details</h3>
          <h3 className="font-semibold p-2 text-center">Probe DB</h3>
          <h3 className="font-semibold p-2 text-center">Remarks</h3>

          <h3 className="font-semibold p-2 text-center">Head</h3>
          <TextAreaComponent className="no-border" placeholder='Machine S.No.' name='machineSNoHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='probeDetailsHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='probeDbHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>
          <TextAreaComponent className="no-border" name='remarksHead' onChange={(name, value) => handleChange(name, value, setFormData)} required/>

          <h3 className="font-semibold p-2 text-center">Foot</h3>
          <TextAreaComponent className="no-border" name='machineSNoFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='probeDetailsFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='probeDbFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
          <TextAreaComponent className="no-border" name='remarksFoot' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>
        </div>
            
          <Divider className= "mt-0" />

          <FormInputItem placeholder='Enter Remarks' name='shiftRemarks' onChange={(name, value) => handleChange(name, value, setFormData)}  required/>

          <div className='flex justify-center'>
              <Btn htmlType='submit' className='w-36'>End Duty</Btn>
          </div>
          </Form>

        <Divider className="mb-0 mt-0" />

        {/* <Table 
          columns={weldDataColumns}
          dataSource={info}
          bordered
          scroll={{x: true}}
          pagination={false}
        /> */}
    </FormContainer>
  )
}

export default WeldingHome