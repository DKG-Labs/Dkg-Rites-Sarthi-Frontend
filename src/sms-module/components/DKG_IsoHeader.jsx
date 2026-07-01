/* eslint-disable */
import React from "react";
import { ReactComponent as Logo } from "../assets/images/logo.svg";


const IsoHeader = ({engTitle, hinTitle, col3AdtnlLine}) => {
  const formattedEngTitle = engTitle.split("<br />").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index !== engTitle.split("<br />").length - 1 && <br />}
    </React.Fragment>
  ));
  const formattedHinTitle = hinTitle.split("<br />").map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index !== hinTitle.split("<br />").length - 1 && <br />}
    </React.Fragment>
  ));
  return (
    <div className="border border-black grid grid-cols-3 divide-x divide-black -p-4">
      <div className="flex flex-col justify-center items-center">
        <Logo height={40} width={100} />
        <h2 className="font-semibold !text-xs text-center mb-1">
        गुणवत्ता आश्वासन प्रभाग
        </h2>
        <h2 className="font-semibold !text-xs text-center">
        QUALITY ASSURANCE DIVISION
        </h2>
      </div>
      <div className="flex flex-col justify-center items-center">
        <h1 className="font-semibold !text-xs text-center mb-1">
          {formattedHinTitle}
        </h1>

        <h1 className="font-semibold !text-xs text-center">
          {formattedEngTitle}
        </h1>
      </div>

      <div className="flex flex-col justify-center items-center !text-xs font-semibold text-center">
        ISO 9001:2015 <br /> ISSUE NO. 02 <br />
        {
          col3AdtnlLine && (
            <>
            <br />
            {col3AdtnlLine}
            </>
          )
        }
      </div>

    </div>
  );
};

export default IsoHeader;
