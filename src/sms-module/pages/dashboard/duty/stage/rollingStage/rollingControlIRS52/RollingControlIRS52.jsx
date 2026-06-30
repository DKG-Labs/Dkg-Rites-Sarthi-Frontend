/* eslint-disable */
import React, { useState } from 'react'
import FormContainer from '../../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../../components/DKG_GeneralInfo'
import data from "../../../../../../utils/frontSharedData/rollingStage/Stage.json";
import FormBody from '../../../../../../components/DKG_FormBody';
import { Divider, message } from 'antd';
import { useNavigate } from 'react-router-dom'
import FormInputItem from '../../../../../../components/DKG_FormInputItem';
import FormDropdownItem from '../../../../../../components/DKG_FormDropdownItem';
import Btn from '../../../../../../components/DKG_Btn';

const { rollingControlIRS52GeneralInfo, sampleLocationList, footFlatnessIRS52List, asyList } = data;

const RollingControlIRS52 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sampleNumber: '2', heatNumber: '076825', timing: '11:02', height: '', head:'', flange: '', weight: '', web: '', asy: '', footFlatness: '', remarks: ''
  });

  const handleChange = (fieldName, value) => {
    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  };

  const handleFormSubmit = () => {
    message.success("Form submission triggered.");
    navigate("/sms/stage/rollingControl");
  };

  return (
    <FormContainer>
      <SubHeader title="Rolling Control Sample Dimensions - IRS52" link="/stage/rollingControl" />
      <GeneralInfo data={rollingControlIRS52GeneralInfo} />

      <FormBody initialValues={formData} onFinish={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem label='Sample No.' name='sampleNumber' value={formData.sampleNumber} onChange={handleChange} disabled/>
          <FormInputItem label='Heat No.' name='heatNumber' value={formData.heatNumber} onChange={handleChange} required/>
        </div>

        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem label='Timing' name='timing' value={formData.timing} onChange={handleChange} required/>
          <FormDropdownItem label="Sample Location" name="sampleLocation" dropdownArray={sampleLocationList} visibleField="value" valueField="key" onChange={handleChange} required />
        </div>

        <Divider className='mt-0 mb-4' />

        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem label='Height' name='height' value={formData.height} onChange={handleChange} required/>
          <FormInputItem label='Head' name='head' value={formData.head} onChange={handleChange} required/>
        </div>

        <div className="grid grid-cols-2 gap-x-2">
          <FormInputItem label='Flange' name='flange' value={formData.flange} onChange={handleChange} required/>
          <FormInputItem label='Weight' name='weight' value={formData.weight} onChange={handleChange}/>
        </div>

        <FormInputItem label='Web (mm)' name='web' value={formData.web} onChange={handleChange} required/>

        <div className="grid grid-cols-2 gap-x-2">
          <FormDropdownItem label="Asy" name="asy" dropdownArray={asyList} visibleField="value" valueField="key" onChange={handleChange} required />
          <FormDropdownItem label="Foot Flatness" name="footFlatness" dropdownArray={footFlatnessIRS52List} visibleField="value" valueField="key" onChange={handleChange} required />
        </div>

        <Divider className='mb-4 mt-0' />

        <FormInputItem label='Remarks' name='remarks' value={formData.remarks} onChange={handleChange} required/>

        <Btn htmlType="submit" className="flex justify-center mx-auto">
          Save
        </Btn>
      </FormBody>
    </FormContainer>
  )
}

export default RollingControlIRS52