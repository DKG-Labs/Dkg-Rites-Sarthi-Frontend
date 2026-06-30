/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react'
import IsoHeader from '../../../../components/DKG_IsoHeader'
import VerificationSearchFilter from './SearchFilter'
import { apiCall } from '../../../../utils/CommonFunctions'
import { useSelector } from 'react-redux'
import { Button } from 'antd'
import { useReactToPrint } from 'react-to-print';

const VerificationIso = () => {
  const repRef = useRef();

  // Generate dynamic SMS titles based on smsVal
  const getSmsTitle = (smsValue) => {
    console.log('SMS Value received:', smsValue); // Debug log
    if (smsValue === 'SMS 2' || smsValue === 'SMS2') {
      return {
        hindi: 'एस.एम.एस - II',
        english: 'SMS II'
      };
    } else if (smsValue === 'SMS 3' || smsValue === 'SMS3') {
      return {
        hindi: 'एस.एम.एस - III',
        english: 'SMS III'
      };
    }
    // Default fallback
    console.log('Using default SMS title for value:', smsValue); // Debug log
    return {
      hindi: 'एस.एम.एस - II / एस.एम.एस - III',
      english: 'SMS II / SMS III'
    };
  };
  const [formData, setFormData] = useState({
    date: null,
    shift: null,
    railGrade: null,
    ladleToTundishUsed: null,
    tundishToMouldUsed: null,
    heatDtlList: [
      {
        castNo: null,
        castingTemp: null,
        castingTempWv: null,
      },
      {
        castNo: null,
        castingTemp: null,
        castingTempWv: null,
      },
      {
        castNo: null,
        castingTemp: null,
        castingTempWv: null,
      },
      {
        castNo: null,
        castingTemp: null,
        castingTempWv: null,
      },
    ],
    castingDtlList: [
      {
        castNo: null,
        firstTemp: null,
        secondTemp: null,
      },
      {
        castNo: null,
        firstTemp: null,
        secondTemp: null,
      },
      {
        castNo: null,
        firstTemp: null,
        secondTemp: null,
      },
      {
        castNo: null,
        firstTemp: null,
        secondTemp: null,
      },
    ],
    degassingDtlList: [
      {
        castNo: null,
        vacuum: null,
        time: null,
        castingTimeWv: null,
      },
      {
        castNo: null,
        vacuum: null,
        time: null,
        castingTimeWv: null,
      },
      {
        castNo:null,
        vacuum:null,
        time:null,
        castingTimeWv:null,
      },
    ],
    bloomDtlList: [
      {
        castNo:null,
        noOfCoBlooms:null
      },
      {
        castNo: null,
        noOfCoBlooms: null,
      },
      {
        castNo: null,
        noOfCoBlooms: null,
      },
      {
        castNo:null,
        noOfCoBlooms:null,
      },
    ],
    bloomYardInsp: {
      castNo: null,
      isAvailable: null,
    }
  })

  const handlePrint = useReactToPrint({
    content: () => repRef.current,
    documentTitle: "sms_verification_iso_report",
  });

  const {token} = useSelector(state => state.auth);

  // Helper function to prioritize Witnessed over Verified
  const prioritizeWitnessedVerified = (items) => {
    return items.sort((a, b) => {
      // Priority: Witnessed > Verified > others
      const getPriority = (item) => {
        if (item.castingTempWv === 'Witnessed') return 1;
        if (item.castingTempWv === 'Verified') return 2;
        return 3;
      };

      return getPriority(a) - getPriority(b);
    });
  };

  const onFinish = async (formData) => {
    try {
      const { data } = await apiCall("POST", "/iso/getHeatDtls", token, formData);

      const castingDtlList = [];
      const heatDtlList = [];
      const degassingDtlList = [];
      const bloomDtlList = [];

      // Process data based on heat stages
      data?.responseData?.forEach(item => {
        if (item.heatStage === "Converter") {
          heatDtlList.push({
            castNo: item.heatNumber,
            castingTemp: item.turnDownTemp,
            castingTempWv: item.turnDownTempWv
          });
        }
        else if (item.heatStage === "Degassing") {
          heatDtlList.push({
            castNo: item.heatNumber,
            castingTemp: item.turnDownTemp,
            castingTempWv: item.turnDownTempWv
          });
          degassingDtlList.push({
            castNo: item.heatNumber,
            vacuum: item.degassingVacuum,
            time: item.degassingDuration,
            castingTimeWv: item.degassingDurationWv
          });
        }
        else if (item.heatStage === "Casting") {
          heatDtlList.push({
            castNo: item.heatNumber,
            castingTemp: item.turnDownTemp,
            castingTempWv: item.turnDownTempWv
          });
          degassingDtlList.push({
            castNo: item.heatNumber,
            vacuum: item.degassingVacuum,
            time: item.degassingDuration,
            castingTimeWv: item.degassingDurationWv
          });
          castingDtlList.push({
            castNo: item.heatNumber,
            firstTemp: item.castingTemp,
            secondTemp: item.castingTemp
          });
        }
        else if (item.heatStage === "Bloom Cutting") {
          bloomDtlList.push({
            castNo: item.heatNumber,
            noOfCoBlooms: item.numberOfCoBlooms
          });
          heatDtlList.push({
            castNo: item.heatNumber,
            castingTemp: item.turnDownTemp,
            castingTempWv: item.turnDownTempWv
          });
          degassingDtlList.push({
            castNo: item.heatNumber,
            vacuum: item.degassingVacuum,
            time: item.degassingDuration,
            castingTimeWv: item.degassingDurationWv
          });
          castingDtlList.push({
            castNo: item.heatNumber,
            firstTemp: item.castingTemp,
            secondTemp: item.castingTemp
          });
        }
      });

      // Apply prioritization to all lists
      const prioritizedHeatDtlList = prioritizeWitnessedVerified(heatDtlList);

      // Sort degassing list by Witnessed/Verified priority
      const sortedDegassingDtlList = degassingDtlList.sort((a, b) => {
        const getPriority = (item) => {
          if (item.castingTimeWv === 'Witnessed') return 1;
          if (item.castingTimeWv === 'Verified') return 2;
          return 3;
        };
        return getPriority(a) - getPriority(b);
      });

      setFormData({
        heatDtlList: prioritizedHeatDtlList,
        castingDtlList,
        degassingDtlList: sortedDegassingDtlList,
        bloomDtlList,
        date: formData.date,
        shift: formData.shift,
        railGrade: formData.railGrade,
        sms: formData.sms, // Add SMS field to maintain dropdown selection
        ladleToTundishUsed: data?.responseData[0]?.isLadleToTundishUsed === true ? "Yes" : "No",
        tundishToMouldUsed: data?.responseData[0]?.isTundishToMouldUsed === true? "Yes" : "No",
      });
    } 
    catch(error) {
      // Error handling
    }
  }

  console.log("FORN: ", formData)

  useEffect(() => {
  }, [])

  return (
    <div>
    <VerificationSearchFilter showDate showShift showRailGrade showSms onFinish={onFinish} />
    <div className='a4-container' ref={repRef}>
      <IsoHeader
        engTitle="WITNESSED / VERIFICATION REPORT <br /> (CONVERTER & CASTING)"
        hinTitle="विटनेस / सत्यापन रिपोर्ट <br /> (कनवर्टर एवं कास्टिंग)"
        col3AdtnlLine="APPROVED DIVISIONAL HEAD"
      />
      <div className="border-b border-black flex justify-between p-2">
        <h2>FORMAT NO: F/CR-BSP/7.5/17/01</h2>
        <h2>PAGE 1 OF 1</h2>
        <h2>PAGE REV. NO. 00</h2>
        <h2>EFFECTIVE DATE: 23/12/2024</h2>
      </div>

      <div className="flex justify-between p-2 border-b border-black">
        <div className='flex gap-2 items-center'>
          <div>
          <h2 className='!text-sm'>दिनांक व पारी</h2>
          <h2 className='font-semibold !text-sm'>Date & Shift</h2>
          </div>
          <div>
            {formData.date + " " + formData.shift}
          </div>
        </div>

        <div className='text-center'>
          <h2 className="!text-sm">{getSmsTitle(formData.sms).hindi}</h2>
          <h2 className='font-semibold !text-sm'>{getSmsTitle(formData.sms).english}</h2>
        </div>

        <div className='flex gap-2 items-center'>
          <div>
          <h2 className='!text-sm'>ग्रेड</h2>
          <h2 className='font-semibold !text-sm'>Grade</h2>
          </div>
          <div>
            {formData.railGrade}
          </div>
        </div>
      </div>

      <div className="border border-black border-t-0 grid grid-cols-5 divide-x divide-y divide-black">
        <div className='font-semibold !text-sm text-center'>
        सत्यापन बिंदु / <br /> Point of Verification
        </div>
        <div className='font-semibold !text-sm text-center'>
        पैरामीटर / <br /> Parameter
        </div>

        <div className='text-center'>Cast No.</div>
        <div className='text-center'>Temp (C)</div>
        <div className='text-center'>Witnessed / Verified</div>

        <div className="row-span-4 p-2">
          <div className="!text-sm">
          1. कनवर्टर
          </div>
          <div className="!text-sm font-semibold">
            Converter
          </div>
        </div>
        <div className="row-span-4 p-2 !text-sm">
          Turn Down Temperature <br /> Min. 1630
        </div>

        <div className='text-center !text-sm'>{formData?.heatDtlList[0]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[0]?.castingTemp}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[0]?.castingTempWv}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[1]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[1]?.castingTemp}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[1]?.castingTempWv}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[2]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[2]?.castingTemp}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[2]?.castingTempWv}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[3]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[3]?.castingTemp}</div>
        <div className='text-center !text-sm'>{formData?.heatDtlList[3]?.castingTempWv}</div>

        <div className="p-2">
          <div className="!text-sm">
          2. डीगैसिंग
          </div>
          <div className="!text-sm font-semibold">
            Degassing
          </div>
        </div>
        <div className="p-2 !text-sm .flex.flex-col.gap-2">
          <div className='!text-sm'>
            a. Duration Min. 10 minutes.
          </div>

          <div className='!text-sm'>
            b. Vacuum level 3 millibar max
          </div>          
        </div>
        <div className="col-span-3">
        <div className="border border-black grid grid-cols-5 divide-x divide-y divide-black"> 
          <div className="text-center !text-sm">Cast No.</div>
          <div className="text-center !text-sm">Vacuum Level (m bar)</div>
          <div className="text-center !text-sm">Time</div>
          <div className="text-center !text-sm col-span-2">Witnessed / Verified</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[0]?.castNo}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[0]?.vacuum}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[0]?.time}</div>
          <div className='text-center !text-sm col-span-2'>{formData?.degassingDtlList[0]?.castingTimeWv}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[1]?.castNo}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[1]?.vacuum}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[1]?.time}</div>
          <div className='text-center !text-sm col-span-2'>{formData?.degassingDtlList[1]?.castingTimeWv}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[2]?.castNo}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[2]?.vacuum}</div>
          <div className='text-center !text-sm'>{formData?.degassingDtlList[2]?.time}</div>
          <div className='text-center !text-sm col-span-2'>{formData?.degassingDtlList[2]?.castingTimeWv}</div>
        </div>
        </div>

        {/* <div>Converter</div> */}

        <div className="row-span-5 p-2">
          <div className="!text-sm">
          3. कास्टिंग
          </div>
          <div className="!text-sm font-semibold">
            Casting
          </div>
        </div>
        <div className="row-span-5 p-2 !text-sm">
        <div>
          <div className='!text-sm'>
          a. First Casting
Temp at 8m-10m
          </div>

          <div className='!text-sm'>
          b. Second Casting
Temp. at 20m-30m (Min. 1480 °C)
          </div>          
        </div>
        </div>
        <div className="!text-sm text-center">Cast No.</div>
        <div className="!text-sm text-center">First Temp.</div>
        <div className="!text-sm text-center">Second Temp.</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[0]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[0]?.firstTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[0]?.secondTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[1]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[1]?.firstTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[1]?.secondTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[2]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[2]?.firstTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[2]?.secondTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[3]?.castNo}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[3]?.firstTemp}</div>
        <div className='text-center !text-sm'>{formData?.castingDtlList[3]?.secondTemp}</div>

        <div className="p-2">
          <div className="!text-sm">
          4. श्राउड का प्रयोग
          </div>
          <div className="!text-sm font-semibold">
            Use of Shroud
          </div>
        </div>

        <div className="text-center !text-sm p-2">Ladle to Tundish</div>
        <div className="text-center !text-sm p-2">{formData?.ladleToTundishUsed}</div>
        <div className="text-center !text-sm p-2">Tundish to Mould</div>
        <div className="text-center !text-sm p-2">{formData?.tundishToMouldUsed}</div>


        <div className="p-2">
          <div className="!text-sm">
          5. चेंज ओवर ब्लूम्स
          </div>
          <div className="!text-sm font-semibold">
            Change over Blooms
          </div>
        </div>
        <div className="p-2 !text-sm">
          One Bloom per Strand
        </div>

        <div className="col-span-3">
        <div className="border border-black grid grid-cols-2 divide-x divide-y divide-black"> 
          <div className="text-center !text-sm">Cast No.</div>
          <div className="text-center !text-sm">No. Of CO Blooms</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[0]?.castNo}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[0]?.noOfCoBlooms}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[1]?.castNo}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[1]?.noOfCoBlooms}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[2]?.castNo}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[2]?.noOfCoBlooms}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[3]?.castNo}</div>
          <div className="text-center !text-sm">{formData?.bloomDtlList[3]?.noOfCoBlooms}</div>

        </div>
        </div>

        <div className="p-2">
          <div className="!text-sm">
          6. ब्लूम यार्ड में ब्लूम निरीक्षण
          </div>
          <div className="!text-sm font-semibold">
            Bloom Inspection in Bloom Yard
          </div>
        </div>
          <div className="grid grid-cols-1">
            <div className='!text-sm border-b-black border-b'>
            a. Identification
(Marking Heat No.
& Strand No.)
            </div>
            <div className='!text-sm'>
            b. Record of bloom
inspection at bloom
yard (once in a day)
            </div>
          </div>

          <div className="col-span-3 grid grid-cols-2 border border-black divide-x divide-y divide-black">
            <div className="!text-sm text-center row-span-2 p-2">Marked with Hot Chalk</div>
            <div className="!text-sm text-center">Verify</div>
            <div className="!text-sm text-center">Satisfactory / Not Satisfactory</div>
            <div className="!text-sm text-center">Cast No.</div>
            <div className="!text-sm text-center">Available / Not Available</div>
            <div className="!text-sm text-center">{formData?.bloomYardInsp?.castNo}</div>
            <div className="!text-sm text-center">{formData?.bloomYardInsp?.isAvailable}</div>
          </div>
      </div>

    <div className='text-right'>


      
      <div className='mt-16 mr-8'>
      हस्ताक्षर / Signature: .............................
      </div>

      <br />

      <div className='mr-8'>
      नाम / Name: ........................................
      </div>

    </div>
      
    </div>
    <Button onClick={handlePrint} className='my-8 w-full mx-auto bg-darkBlueHover text-white'>Print</Button>
    </div>
  )
}

export default VerificationIso
