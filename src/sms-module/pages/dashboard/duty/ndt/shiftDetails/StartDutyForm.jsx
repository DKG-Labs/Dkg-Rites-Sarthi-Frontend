/* eslint-disable */
// import React, { useEffect, useState } from "react";
// import SubHeader from "../../../../../components/DKG_SubHeader";
// import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
// import FormBody from "../../../../../components/DKG_FormBody";
// import { message } from "antd";
// import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
// import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
// import Btn from "../../../../../components/DKG_Btn";
// import FormContainer from "../../../../../components/DKG_FormContainer";
// import { useNavigate, Navigate } from 'react-router-dom'
// import { useDispatch, useSelector } from "react-redux";
// import { startNdtDuty } from '../../../../../store/slice/ndtDutySlice';
// import dayjs from "dayjs";

// const { millMapingSec: sampleData, shiftList, railGradeList, railSectionList } = data;

// const currentDate = dayjs();
// const dateFormat = "DD/MM/YYYY";

// const StartDutyForm = () => {
//     const dispatch = useDispatch();
//     const { dutyId } = useSelector((state) => state.ndtDuty);

//     const [millDropdownList, setMillDropdownList] = useState([]);
//     const [ndtDropdownList, setNdtDropdownList] = useState([]);
//     const navigate = useNavigate();

//     const [formData, setFormData] = useState({
//         startDate: currentDate.format(dateFormat), shift: "", mill: "", ndt: "", railGrade: "", railSection: ""
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
//         const ndtDropdownList = sampleData[formData.mill].map(mill => {
//         return {
//             key: mill,
//             value: mill
//         }
//         })
//         setNdtDropdownList([...ndtDropdownList])
//     }
//     }, [formData.mill, millDropdownList])

//     const handleFormSubmit = async () => {
//         await dispatch(startNdtDuty(formData)).unwrap();
//         navigate('/sms/ndt/home');
//     };

//     if (dutyId) {
//         message.error("Duty already in progress. Cannot start new duty.");
//         return <Navigate to="/sms/ndt/home" />;
//     }

//     const handleChange = (fieldName, value) => {
//         setFormData((prev) => {
//           return {
//             ...prev,
//             [fieldName]: value,
//           };
//         });
//     };

//     console.log(formData)

//   return (
//     <FormContainer>
//         <SubHeader title="NDT - Shift Details" link="/" />

//         <FormBody initialValues={formData} onFinish={handleFormSubmit}>
//             <div className="grid grid-cols-2 gap-x-2">
//                 <CustomDatePicker label="Date" name="startDate" defaultValue={formData.startDate} onChange={handleChange} disabled required />
//                 <FormDropdownItem label="Shift" name="shift" formField='shift' dropdownArray={shiftList} visibleField="value" valueField="key" onChange={handleChange} required />
//             </div>

//             <div className="grid grid-cols-2 gap-x-2">
//                 <FormDropdownItem label='Mill' name='mill' formField='mill' dropdownArray={millDropdownList} valueField='key' visibleField='value' onChange={handleChange} required />
//                 <FormDropdownItem label ='NDT' name='ndt' formField='ndt' dropdownArray={ndtDropdownList} valueField='key' visibleField='value' onChange = {handleChange} required />
//             </div>

//             <div className="grid grid-cols-2 gap-x-2">
//                 <FormDropdownItem label="Rail Grade" name='railGrade' formField='railGrade' dropdownArray={railGradeList} visibleField='value' valueField='key' onChange={handleChange} required/>
//                 <FormDropdownItem label="Rail Section" name='railSection' formField='railSection' dropdownArray={railSectionList} visibleField='value' valueField='key' onChange={handleChange} required />
                
//             </div>

//             <Btn htmlType="submit" className="flex justify-center mx-auto">
//                 Start Duty
//             </Btn>
//         </FormBody>
//     </FormContainer>
//   )
// }

// export default StartDutyForm

import React, { useEffect, useState } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
import FormBody from "../../../../../components/DKG_FormBody";
import { message, Form } from "antd";
import CustomDatePicker from "../../../../../components/DKG_CustomDatePicker";
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import Btn from "../../../../../components/DKG_Btn";
import FormContainer from "../../../../../components/DKG_FormContainer";
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { startNdtDuty } from '../../../../../store/slice/ndtDutySlice';
import dayjs from "dayjs";
import { handleChange } from "../../../../../utils/CommonFunctions";

const { millMapingSec: sampleData, shiftList, railGradeList, railSectionList } = data;

const currentDate = dayjs();
const dateFormat = "DD/MM/YYYY";

const StartDutyForm = () => {
    const dispatch = useDispatch();
    const { dutyId } = useSelector((state) => state.ndtDuty);

    const [millDropdownList, setMillDropdownList] = useState([]);
    const [ndtDropdownList, setNdtDropdownList] = useState([]);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        startDate: currentDate.format(dateFormat), shift: "", mill: "", ndt: "", railGrade: "", railSection: ""
    });

    const [form] = Form.useForm();
    
    useEffect(() => {
        if (sampleData[formData.mill]) {
            const ndtDropdownList = sampleData[formData.mill]?.map(ndt => ({ key: ndt, value: ndt }));
            setNdtDropdownList([...ndtDropdownList]);
        } else {
            setNdtDropdownList([]);
            setFormData(prevData => ({ ...prevData, ndt: null }));
        }
    }, [formData.mill, millDropdownList]);

    const handleFormSubmit = async () => {
        await dispatch(startNdtDuty(formData)).unwrap();
        navigate('/sms/ndt/home');
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
        return <Navigate to="/sms/ndt/home" />;
    }

    return (
        <FormContainer>
            <SubHeader title="NDT - Shift Details" link="/" />

            <Form initialValues={formData} form={form} layout="vertical" onFinish={handleFormSubmit}>
                <div className="grid grid-cols-2 gap-x-2">
                    <CustomDatePicker label="Date" name="startDate" defaultValue={formData.startDate} onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
                    <FormDropdownItem label="Shift" name="shift" formField='shift' dropdownArray={shiftList} visibleField="value" valueField="key" onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
                </div>

                <div className="grid grid-cols-2 gap-x-2">
                    <FormDropdownItem label='Mill' name='mill' formField="mill" dropdownArray={millDropdownList} valueField='key' visibleField='value' onChange={(fieldName, value) => {
                        handleChange(fieldName, value, setFormData);
                        setFormData(prevData => ({ ...prevData, ndt: null }));
                    }} required />
                    <FormDropdownItem label ='NDT' name='ndt' formField='ndt' dropdownArray={ndtDropdownList} valueField='key' visibleField='value' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required disabled={!ndtDropdownList.length} />
                </div>

                <div className="grid grid-cols-2 gap-x-2">
                    <FormDropdownItem label="Rail Grade" name='railGrade' formField='railGrade' dropdownArray={railGradeList} visibleField='value' valueField='key' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required/>
                    <FormDropdownItem label="Rail Section" name='railSection' formField='railSection' dropdownArray={railSectionList} visibleField='value' valueField='key' onChange={(fieldName, value) => handleChange(fieldName, value, setFormData)} required />
                </div>

                <Btn htmlType="submit" className="flex justify-center mx-auto">
                    Start Duty
                </Btn>
            </Form>
        </FormContainer>
    );
};

export default StartDutyForm;
