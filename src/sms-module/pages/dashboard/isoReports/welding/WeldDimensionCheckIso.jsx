/* eslint-disable */
import { Button, Table, message } from 'antd';
import React, { useRef, useState } from 'react'
import IsoHeader from '../../../../components/DKG_IsoHeader';
import Subheading from '../sms/Subheading';
import SearchFilter from '../sms/SearchFilter';
import { apiCall } from '../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';

const WeldDimensionCheckIso = () => {
    const columns = [
        {
          title: "क्र.सं.\nS.No.",
          dataIndex: "sNo",
          key: "sNo",
          render: (_, __, index) => index+1
        },
        {
          title: "जॉइंट सं.\nJoint No.",
          dataIndex: "jointNumber",
          key: "jointNumber",
        },
        {
          title: "1 मीटर स्ट्रेट एज / 1m Straight Edge",
          children: [
            {
              title: "Lateral",
              children: [
                {
                  title: "LH",
                  dataIndex: "LH",
                  key: "LH",
                },
                {
                  title: "RH",
                  dataIndex: "oneMeterRH",
                  key: "oneMeterRH",
                },
              ],
            },
            {
              title: "Vertical (Top)",
              dataIndex: "oneMeterVertical",
              key: "oneMeterVertical",
            },
          ],
        },
        {
          title: "10 सेमी स्ट्रेट एज / 10 cm Straight Edge",
          children: [
            {
              title: "Lateral",
              children: [
                {
                  title: "LH",
                  dataIndex: "tenCmLH",
                  key: "tenCmLH",
                },
                {
                  title: "RH",
                  dataIndex: "tenCmRH",
                  key: "tenCmRH",
                },
              ],
            },
            {
              title: "Vertical (Top)",
              dataIndex: "tenCmVertical",
              key: "tenCmVertical",
            },
          ],
        },
        {
          title: "विजुअल\nVisual",
          dataIndex: "visual",
          key: "visual",
        },
        {
          title: "अंकन\nMarking",
          dataIndex: "marking",
          key: "marking",
        },
        {
          title: "टिप्पणियां\nRemarks",
          dataIndex: "remark",
          key: "remark",
        },
        {
          title: "हस्ताक्षर\nSignature",
          dataIndex: "signature",
          key: "signature",
        },
      ];

      const [formData, setFormData] = useState({
        date: "",
        shift: "",
        railGrade: "",
        railSection: "",
        dtlList: []
      })

      const {token} = useSelector(state => state.auth)

      const onFinish = async (formData) => {
        try{
            const {data} = await apiCall("POST", "/iso/getWeldDimCheckDtls", token, formData)
            console.log("WeldDimensionCheckIso API Response:", data);
            if (data?.responseData && data.responseData.length > 0) {
                setFormData({
                    date: formData.date,
                    shift: formData.shift,
                    railGrade: formData.railGrade,
                    railSection: formData.railSection,
                    dtlList: data.responseData
                })
            } else {
                message.warning("No dimension check data found for the specified criteria.");
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
            console.error("WeldDimensionCheckIso API Error:", error);
            message.error(`Failed to fetch dimension check data: ${error.response?.data?.message || error.message}`);
        }

    }
const repRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => repRef.current,
        documentTitle: "sms_chemical_analysis", // Set custom filename
    });
  return (
    <>
    <SearchFilter showDate showShift showRailGrade showRailSection onFinish={onFinish} />
    <div className='a4-container' ref={repRef}>
        <IsoHeader 
            engTitle="FORMAT FOR DIMENSIONAL CHECK OF WELDED JOINTS (AFTER FINISHING) <br /> Clause No. 8.5 of ISO:9001:2015"
            hinTitle="वेल्ड किए गए जोड़ों की आयामी जाँच के लिए प्रारूप (समापन के बाद)"
            col3AdtnlLine="APPROVED DIVISIONAL HEAD"
        />
        <Subheading
        formatNo="F/CR-BSP/7.5/20/01"
        page="1 OF 1"
        pageRev="NIL"
            textVis
            textVal="वेल्ड किए गए जोड़ों की आयामी जाँच (समापन के बाद) (मशीन द्वारा वेल्ड किया गया: स्थिर/गतिशील) <br /> DIMENSIONAL CHECK OF WELDED JOINTS (AFTER FINISHING) <br /> (M/c welded: Stationary/Mobile)"
            grdVis grdVal={formData.railGrade}
            secVis secVal={formData.railSection}
            dsVis dsVal={formData.date + " - " + formData.shift}
        />
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

export default WeldDimensionCheckIso
