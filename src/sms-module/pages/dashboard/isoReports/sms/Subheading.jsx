/* eslint-disable */
// import React from "react";

// const Subheading = ({formatNo, page, pageRev, effDate, dsVis, dsVal, smsVis, smsVal, grdVis, grdVal, textVis, textVal, secVis, secVal}) => {
//     const formattedText = textVal?.split("<br />").map((line, index) => (
//         <React.Fragment key={index}>
//           {line}
//           {index !== textVal.split("<br />").length - 1 && <br />}
//         </React.Fragment>
//       ));
//   return (
//     <>
//     <div className="border-b border-black flex justify-between p-2">
//       <h2 className="!text-xs">FORMAT NO: {formatNo}</h2>
//       <h2 className="!text-xs">PAGE {page}</h2>
//       <h2 className="!text-xs">PAGE REV. NO. {pageRev}</h2>
//       <h2 className="!text-xs">EFFECTIVE DATE: {effDate}</h2>
//     </div>

//     <div className="flex justify-between p-2 border-b border-black gap-2">
//       {
//         textVal && (
//         <h1 className="font-semibold !text-xs">
//           {formattedText}
//         </h1>

//         )
//       }
//         {
//             dsVis && (
//                 <div className='flex gap-2 items-center'>
//                 <div>
//                 <h2 className='!text-sm'>दिनांक व पारी</h2>
//                 <h2 className='font-semibold !text-sm'>Date & Shift</h2>
//                 </div>
//                 <div className="!text-xs">
//                     {dsVal}
//                 </div>
//                 </div>
//             )
//         }
//         {
//             smsVis && (
//                 <div className='flex gap-2 items-center'>
//                 <div>
//                 <h2 className='!text-xs'>एस.एम.एस - II / एस.एम.एस - III</h2>
//                 <h2 className='font-semibold !text-xs'>SMS II / SMS III</h2>
//                 </div>
//                 <div className="!text-xs">
//                     {smsVal}
//                 </div>
//                 </div>
//             )
//         }
//         {
//             grdVis && (
//                 <div className='flex gap-2 items-center'>
//                 <div>
//                 <h2 className='!text-xs'>सेक्शन</h2>
//                 <h2 className='font-semibold !text-xs'>Grade</h2>
//                 </div>
//                 <div className="!text-xs">
//                     {grdVal}
//                 </div>
//                 </div>
//             )
//         }
//         {
//             secVis && (
//                 <div className='flex gap-2 items-center'>
//                 <div>
//                 <h2 className='!text-xs'>ग्रेड</h2>
//                 <h2 className='font-semibold !text-xs'>Section</h2>
//                 </div>
//                 <div className="!text-xs">
//                     {secVal}
//                 </div>
//                 </div>
//             )
//         }
//         {
//         /* <div className='text-center'>
//           <h2 className="!text-sm">एस.एम.एस - II / एस.एम.एस - III</h2>
//           <h2 className='font-semibold !text-sm'>SMS II / SMS III</h2>
//         </div>

//         <div className='flex gap-2 items-center'>
//           <div>
//           <h2 className='!text-sm'>ग्रेड</h2>
//           <h2 className='font-semibold !text-sm'>Grade</h2>
//           </div>
//           <div>
//             {formData.railGrade}
//           </div>
//         </div> */}
//       </div>


//     </>
//   );
// };

// export default Subheading;


import React from "react";

const Subheading = ({
  formatNo,
  page,
  pageRev,
  effDate,
  dsVis,
  dsVal,
  smsVis,
  smsVal,
  grdVis,
  grdVal,
  secVis,
  secVal,
  stdWtVis,
  stdWtVal,
  mmVis,
  mmVal,
  vVis,
  vVal,
  ggVis,
  ggVal,
  textVis,
  textVal,
}) => {
  // Generate dynamic SMS titles based on smsVal
  const getSmsTitle = (smsValue) => {
    console.log('Subheading SMS Value received:', smsValue); // Debug log
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
    console.log('Subheading using default SMS title for value:', smsValue); // Debug log
    return {
      hindi: 'एस.एम.एस - II / एस.एम.एस - III',
      english: 'SMS II / SMS III'
    };
  };

  const smsTitle = getSmsTitle(smsVal);
  // Handling line breaks
  const formattedText = textVal?.split("<br />").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index !== textVal.split("<br />").length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <>
      {/* Top Header Row */}
      <div className="border border-t-0 border-black flex justify-between p-2">
        <h2 className="!text-xs">FORMAT NO: {formatNo}</h2>
        <h2 className="!text-xs">PAGE {page}</h2>
        <h2 className="!text-xs">PAGE REV. NO. {pageRev}</h2>
        <h2 className="!text-xs">EFFECTIVE DATE: {effDate}</h2>
      </div>

      {/* Main Content */}
      <div className="flex justify-between p-2 border-x border-black gap-2 flex-wrap">
        {textVis && <h1 className="font-semibold !text-xs">{formattedText}</h1>}

        {dsVis && (
          <SubheadingItem title="दिनांक व पारी" subTitle="Date & Shift" value={dsVal} />
        )}

        {smsVis && (
          <SubheadingItem title={smsTitle.hindi} subTitle={smsTitle.english} value={smsVal} />
        )}

        {grdVis && (
          <SubheadingItem title="ग्रेड" subTitle="Grade" value={grdVal} />
        )}

        {secVis && (
          <SubheadingItem title="सेक्शन" subTitle="Section" value={secVal} />
        )}

        {stdWtVis && (
          <SubheadingItem title="मानक भार" subTitle="Standard Weight" value={stdWtVal} />
        )}

        {mmVis && (
          <SubheadingItem title="माइक्रोमीटर संख्या" subTitle="Micrometer Number" value={mmVal} />
        )}

        {vVis && (
          <SubheadingItem title="वर्नियर संख्या" subTitle="Vernier Number" value={vVal} />
        )}

        {ggVis && (
          <SubheadingItem title="गेजों की संख्या" subTitle="Number of Gauges" value={ggVal} />
        )}
      </div>
    </>
  );
};

// Reusable Subheading Item Component
const SubheadingItem = ({ title, subTitle, value }) => (
  <div className="flex gap-2 items-center">
    <div>
      <h2 className="!text-xs">{title}</h2>
      <h2 className="font-semibold !text-xs">{subTitle}</h2>
    </div>
    <div className="!text-xs">{value}</div>
  </div>
);

export default Subheading;
