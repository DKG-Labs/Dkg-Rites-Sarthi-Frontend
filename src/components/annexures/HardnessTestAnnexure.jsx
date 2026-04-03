import React from "react";
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";


const hardnessHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast Heat No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Qty. (Nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    { label: "Hardness value (40–44 HRC)", colSpan: 10 },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 }
  ],
  [
    { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" },
    { label: "5" }, { label: "6" }, { label: "7" }, { label: "8" },
    { label: "9" }, { label: "10" }
  ]
];


const sampleData = [
  {
    heatNo: "H-1021",
    colour: "Red",
    lotNo: "LOT-01",
    qty: 500,
    sampleSize: 3,

    samples: [
      [41, 42, 43, 42, 41, 44, 43, 42, 41, 42],
      [42, 43, 41, 42, 44, 43, 42, 41, 42, 43],
      [41, 41, 42, 43, 42, 44, 43, 42, 41, 42]
    ],

    defectives: 0,
    cumulative: 0,
    result: "Accepted"
  },
   {
    heatNo: "H-1022",
    colour: "Blue",
    lotNo: "LOT-02",
    qty: 450,
    sampleSize: 5,

    samples: [
      [41, 42, 43, 42, 41, 44, 43, 42, 41, 42],
      [42, 43, 41, 42, 44, 43, 42, 41, 42, 43],
      [41, 41, 42, 43, 42, 44, 43, 42, 41, 42],
      [41, 41, 42, 43, 42, 44, 43, 42, 41, 42],
      [41, 41, 42, 43, 42, 44, 43, 42, 41, 42]
    ],

    defectives: 0,
    cumulative: 0,
    result: "Accepted"
  },
   {
    heatNo: "H-1023",
    colour: "Green",
    lotNo: "LOT-03",
    qty: 600,
    sampleSize: 3,

    samples: [
      [41, 42, 43, 42, 41, 44, 43, 42, 41, 42],
      [42, 43, 41, 42, 44, 43, 42, 41, 42, 43],
      [41, 41, 42, 43, 42, 44, 43, 42, 41, 42]
    ],

    defectives: 0,
    cumulative: 0,
    result: "Accepted"
  },
];


const HardnessTestAnnexure = () => {
  return (
    <AnnexureLayout>

      <AnnexureHeader
        pageNo="14 of 18"
        preparedBy="KJM"
        checkedBy="CSR"
        approvedBy="GM(I)/WR"
        title="Final Inspection Report"
        subtitle="Test results- Hardness Test"
        annexureNumber="Annexure-VIII"
        annexureCode="IRST-31-2025"
      />

  <AnnexureTable headerRows={hardnessHeaderRows}>
  {sampleData.map((batch, batchIndex) => {
    const rowSpan = batch.samples.length;

    return batch.samples.map((sample, sampleIndex) => (
      <tr key={`${batchIndex}-${sampleIndex}`}>

        {/* LEFT MERGED COLUMNS */}
        {sampleIndex === 0 && (
          <>
            <td rowSpan={rowSpan}>{batchIndex + 1}</td>
            <td rowSpan={rowSpan}>{batch.heatNo}</td>
            <td rowSpan={rowSpan}>{batch.colour}</td>
            <td rowSpan={rowSpan}>{batch.lotNo}</td>
            <td rowSpan={rowSpan}>{batch.qty}</td>
            <td rowSpan={rowSpan}>{batch.sampleSize}</td>
          </>
        )}

       
        {sample.map((value, i) => (
          <td key={i}>{value}</td>
        ))}

        {sampleIndex === 0 && (
          <>
            <td rowSpan={rowSpan}>{batch.defectives}</td>
            <td rowSpan={rowSpan}>{batch.cumulative}</td>
            <td rowSpan={rowSpan}>{batch.result}</td>
          </>
        )}

      </tr>
    ));
  })}
</AnnexureTable>

      <AnnexureFooter />
    </AnnexureLayout>
  );
};

export default HardnessTestAnnexure;

