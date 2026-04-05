import React from "react";
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";


const weightHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast / Heat No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Quantity (in nos.)", rowSpan: 2 },
    { label: "Sample Size", rowSpan: 2 },
    {
      label:
        "Weight (kg)\nERC MK-III: 0.920 ±0.010\nERC MK-V: 1.088 ±0.020",
      rowSpan: 2,
    },
    { label: "No. of Defectives", rowSpan: 2 },
    { label: "Cumulative No. of Defectives", rowSpan: 2 },
    { label: "Remarks", rowSpan: 2 },
  ],
];



const weightTestData = [
  {
    heatNo: "H-1501",
    colour: "Red",
    lotNo: "LOT-01",
    qty: 500,
    sampleSize: 10,
    weight: "0.921 – 0.928",
    defectives: 0,
    cumulative:0,
    result: "Accepted",
  },
  {
    heatNo: "H-1502",
    colour: "Blue",
    lotNo: "LOT-02",
    qty: 450,
    sampleSize: 10,
    weight: "1.086 – 1.094",
    defectives: 0,
    cumulative:0,
    result: "Accepted",
  },
];



const WeightTestAnnexure = () => {
  return (
    <AnnexureLayout>

      <AnnexureHeader
        pageNo="18 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test results- Weight test"
        annexureNumber="Annexure-XV"
        annexureCode="IRST-31-2025"
      />

      <AnnexureTable headerRows={weightHeaderRows}>
        {weightTestData.map((row, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{row.heatNo}</td>
            <td>{row.colour}</td>
            <td>{row.lotNo}</td>
            <td>{row.qty}</td>
            <td>{row.sampleSize}</td>
            <td>{row.weight}</td>
            <td>{row.defectives}</td>
            <td>{row.cumulative}</td>
            <td>{row.result}</td>
          </tr>
        ))}
      </AnnexureTable>

      <AnnexureFooter />

    </AnnexureLayout>
  );
};

export default WeightTestAnnexure;

