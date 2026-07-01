/* eslint-disable */
import React, { useRef, useState } from 'react'
import SearchFilter from '../sms/SearchFilter';
import IsoHeader from '../../../../components/DKG_IsoHeader';
import Subheading from '../sms/Subheading';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { apiCall } from '../../../../utils/CommonFunctions';
import { Button, Table, message } from 'antd';

const WeldTestingIso = () => {


    const [formData, setFormData] = useState({
            date: "",
            shift: "",
            railGrade: "",
            railSection: "",
            dtlList: []
          })

          const {token} = useSelector(state => state.auth)

            const repRef = useRef();
                const handlePrint = useReactToPrint({
                    content: () => repRef.current,
                    documentTitle: "welding_testing", // Set custom filename
                  });

    const columns = [
        {
          title: "S.No.",
          dataIndex: "sNo",
          key: "sNo",
          render: (_, __, index) => index+1
        },
        {
          title: "Joint No.",
          dataIndex: "jointNumber",
          key: "jointNumber",
        },
        {
          title: "Name of Operator (Welding Machine)",
          dataIndex: "weldOperator",
          key: "weldOperator",
        },
        {
          title: "Name of Operator (USFD Machine)",
          dataIndex: "usfdOperator",
          key: "usfdOperator",
        },
        {
          title: "Result of Testing",
          dataIndex: "result",
          key: "result",
        },
        {
          title:
            "If Defective, details of flaw defective zone/flaw peak pattern: Head/Web/Foot Probe Trace.",
          dataIndex: "remark",
          key: "remark",
        },
        {
          title: "Remarks",
          dataIndex: "panelRemark",
          key: "panelRemark",
        },
        {
          title: "Signature",
          dataIndex: "signature",
          key: "signature",
        },
      ];


            const onFinish = async (formData) => {
              try{
                  const {data} = await apiCall("POST", "/iso/getWeldJointTestDtls", token, formData)
                  console.log("WeldTestingIso API Response:", data);
                  if (data?.responseData && data.responseData.length > 0) {
                      setFormData({
                          date: formData.date,
                          shift: formData.shift,
                          railGrade: formData.railGrade,
                          railSection: formData.railSection,
                          dtlList: data.responseData
                      })
                  } else {
                      message.warning("No joint testing data found for the specified criteria.");
                      setFormData({
                          date: formData.date,
                          shift: formData.shift,
                          railGrade: formData.railGrade,
                          railSection: formData.railSection,
                          dtlList: []
                      })
                  }
              }
              catch(error){
                  console.error("WeldTestingIso API Error:", error);
                  message.error(`Failed to fetch joint testing data: ${error.response?.data?.message || error.message}`);
              }

          }
  return (
    <>
    <SearchFilter showDate showShift showRailGrade showRailSection onFinish={onFinish} />
    <div className='a4-container' ref={repRef}>
        <IsoHeader
            engTitle="FORMAT FOR ULTRASONIC TESTING OF WELDED JOINTS <br /> Clause No. 8.5 of ISO:9001:2015"
            hinTitle="वेल्ड किए गए जोड़ों के अल्ट्रासोनिक परीक्षण के लिए प्रारूप"
            col3AdtnlLine="APPROVED DIVISIONAL HEAD"
        />
        <Subheading
        formatNo="F/CR-BSP/7.5/20/02"
        page="1 OF 1"
        pageRev="NIL"
            textVis
            textVal="वेल्ड किए गए जोड़ों के अल्ट्रासोनिक परीक्षण <br /> ULTRASONIC TESTING OF WELDED JOINTS"
            grdVis grdVal={formData.railGrade}
            secVis secVal={formData.railSection}
            dsVis dsVal={formData.date + " - " + formData.shift}
        />

        <div className="border-x border-t border-black grid grid-cols-3">
            <div className='border-r border-black !text-xs font-semibold p-2'>
                USFD Machine Sr.No. : <br /> <br />
            </div>
            <div className='border-r border-black !text-xs font-semibold p-2'>
            Probe Used (Head) : <br /> <br />
            Calibration Setting (Head) : 
            </div>
            <div className='!text-xs font-semibold p-2'>
            Probe Used ( Web & Foot): <br /> <br />
            Calibration Setting (Web & Foot): 
            </div>
        </div>
        <Table columns={columns} 
            dataSource={formData.dtlList}
            scroll={{ x: true }}
            bordered
            className="iso-table border !border-black"
            pagination={false} 
        />
    </div>
     <Button
            onClick={handlePrint}
            className="my-8 w-full mx-auto bg-darkBlueHover text-white"
          >Print</Button>
    </>
  )
}

export default WeldTestingIso
