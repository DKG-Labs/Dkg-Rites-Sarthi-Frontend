/* eslint-disable */
// import React, { useEffect, useState } from "react";
// import SubHeader from "../../../../../components/DKG_SubHeader";
// import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
// import FormBody from "../../../../../components/DKG_FormBody";
// import { message } from "antd";
// import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
// import FormInputItem from "../../../../../components/DKG_FormInputItem";
// import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
// import Btn from "../../../../../components/DKG_Btn";
// import FormContainer from "../../../../../components/DKG_FormContainer";
// import { Navigate, useNavigate } from 'react-router-dom'
// import SelectSearch from "../../../../../components/DKG_SelectSearch";
// import { getCurrentDate } from "../../../../../utils/CommonFunctions";
// import { useDispatch, useSelector } from "react-redux";
// import { startWeldingDuty } from "../../../../../store/slice/weldingDutySlice";

// const { millMapingTer: sampleData, shiftList, railGradeList, railSectionList } = data;

// const WeldingStartDutyForm = () => {
//     const [millDropdownList, setMillDropdownList] = useState([]);
//     const [weldingLineDropdownList, setWeldingLineDropdownList] = useState([]);
//     const {dutyId} = useSelector(state => state.weldingDuty);
//     const navigate = useNavigate();
//     const dispatch = useDispatch();

//     const [formData, setFormData] = useState({
//         startDate: getCurrentDate(), shift: '', mill: '', weldingLine: '', railGrade: '', railSection: ''
//     });

//     const populateData = () => {
//         const millDropdownList = Object.keys(sampleData).map( mill => {
//           return {
//             key: mill,
//             value: mill
//           }
//         })
//         setMillDropdownList([...millDropdownList])
//     }

//     useEffect(()=> {
//         populateData()
//     }, [])
    
//     useEffect(()=>{
//     if(sampleData[formData.mill]){
//         const weldingLineDropdownList = sampleData[formData.mill].map(mill => {
//         return {
//             key: mill,
//             value: mill
//         }
//         })
//         setWeldingLineDropdownList([...weldingLineDropdownList])
//     }
//     }, [formData.mill, millDropdownList])

//     const handleFormSubmit = async () => {
//         try{
//           await dispatch(startWeldingDuty(formData)).unwrap();
//           navigate('/sms/welding/home');
//         }
//         catch(error){}
//     };

//     const handleChange = (fieldName, value) => {
//         setFormData((prev) => {
//           return {
//             ...prev,
//             [fieldName]: value,
//           };
//         });
//     };

//     if (dutyId) {
//         message.error("Duty already in progress. Cannot start new duty.");
//         return <Navigate to="/sms/welding/home" />;
//     }

//   return (
//     <FormContainer>
//         <SubHeader title="Welding Inspection - Shift Details" link="/" />

//         <FormBody initialValues={formData} onFinish={handleFormSubmit}>
//             <div className="grid grid-cols-2 gap-x-2">
//                 <CustomDatePicker label="Date" name="startDate" defaultValue={formData.startDate} onChange={handleChange} required />
//                 <FormDropdownItem label="Shift" name="shift" formField="shift" dropdownArray={shiftList} visibleField="value" valueField="key" onChange={handleChange} required />

//                 <FormDropdownItem label='Mill' name='mill' formField="mill"  dropdownArray={millDropdownList} valueField={'key'} visibleField={'value'} onChange={handleChange} required />
//                 {
//                   formData.mill === 'RSM' && (
//                     <FormDropdownItem label ='Welding Line' name='weldingLine' formField="weldingLine"  dropdownArray={weldingLineDropdownList} valueField={'key'} visibleField={'value'} onChange = {handleChange}/>
//                   )
//                 }
//                 {
//                   formData.mill === 'URM' && (
//                     <FormDropdownItem label ='Welding Line' name='weldingLine' formField="weldingLine"  dropdownArray={weldingLineDropdownList} valueField={'key'} visibleField={'value'} onChange = {handleChange} required/>
//                   )
//                 }
//                 <FormDropdownItem label="Rail Grade" name='railGrade' formField="railGrade" dropdownArray={railGradeList} visibleField='value' valueField='key' onChange={handleChange} required/>
//                 <FormDropdownItem label="Rail Section" name='railSection' formField="railSection" dropdownArray={railSectionList} visibleField='value' valueField='key' onChange={handleChange} required />
//             </div>

//             <Btn htmlType="submit" className="flex justify-center mx-auto mt-2">
//                 Start Duty
//             </Btn>
//         </FormBody>
//     </FormContainer>
//   )
// }

// export default WeldingStartDutyForm

import React, { useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
import FormBody from "../../../../../components/DKG_FormBody";
import { message, Form } from "antd";
import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../components/DKG_Btn";
import FormContainer from "../../../../../components/DKG_FormContainer";
import { Navigate, useNavigate } from 'react-router-dom'
import { getCurrentDate, handleChange } from "../../../../../utils/CommonFunctions";
import { useDispatch, useSelector } from "react-redux";
import { startWeldingDuty } from "../../../../../store/slice/weldingDutySlice";

const { millMapingTer: sampleData, shiftList, railGradeList, railSectionList } = data;

const WeldingStartDutyForm = () => {
    const [millDropdownList, setMillDropdownList] = useState([]);
    const [weldingLineDropdownList, setWeldingLineDropdownList] = useState([]);
    const { dutyId } = useSelector(state => state.weldingDuty);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        startDate: getCurrentDate(), shift: '', mill: '', weldingLine: '', railGrade: '', railSection: ''
    });

    const [form] = Form.useForm();

    useEffect(() => {
        if (sampleData[formData.mill]) {
            const weldingLineDropdownList = sampleData[formData.mill]?.map(weldingLine => ({ key: weldingLine, value: weldingLine }));
            setWeldingLineDropdownList([...weldingLineDropdownList]);
        } else {
            setWeldingLineDropdownList([]);
            setFormData(prevData => ({ ...prevData, weldingLine: null }));
        }
    }, [formData.mill, millDropdownList]);

    const handleFormSubmit = async () => {
        try {
            await dispatch(startWeldingDuty(formData)).unwrap();
            navigate('/sms/welding/home');
        } catch (error) {}
    };

    const populateData = () => {
        const millDropdownList = Object.keys(sampleData).map(mill => ({ key: mill, value: mill }));
        setMillDropdownList([...millDropdownList]);
    };

    useEffect(() => {
        populateData();
    }, []);

    useEffect(() => {
        form.setFieldsValue(formData);
    }, [formData, form]);

    if (dutyId) {
        // message.error("Duty already in progress. Cannot start new duty.");
        return <Navigate to="/sms/welding/home" />;
    }

    return (
        <FormContainer>
            <SubHeader title="Welding Inspection - Shift Details" link="/" />

            <Form initialValues={formData} form={form} layout="vertical" onFinish={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-x-2">
                    <CustomDatePicker label="Date" name="startDate" defaultValue={formData.startDate} onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required/>
                    <FormDropdownItem label="Shift" name="shift" formField="shift" dropdownArray={shiftList} visibleField="value" valueField="key" onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />

                    <FormDropdownItem label='Mill' name='mill' formField="mill" dropdownArray={millDropdownList} valueField='key' visibleField='value' onChange={(fieldName, value) => {
                        handleChange(fieldName, value, setFormData);
                        setFormData(prevData => ({ ...prevData, weldingLine: null }));
                    }} required />
                    <FormDropdownItem 
                      label='Welding Line' 
                      name='weldingLine' 
                      formField="weldingLine" 
                      dropdownArray={weldingLineDropdownList} 
                      valueField='key' 
                      visibleField='value' 
                      onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} 
                      required={formData.mill === 'URM'}
                    />
                    <FormDropdownItem label="Rail Grade" name='railGrade' formField="railGrade" dropdownArray={railGradeList} visibleField='value' valueField='key' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required/>
                    <FormDropdownItem label="Rail Section" name='railSection' formField="railSection" dropdownArray={railSectionList} visibleField='value' valueField='key' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
                </div>

                <Btn htmlType="submit" className="flex justify-center mx-auto mt-2">
                    Start Duty
                </Btn>
            </Form>
        </FormContainer>
    );
}

export default WeldingStartDutyForm;
