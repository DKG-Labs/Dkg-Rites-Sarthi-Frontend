import React from "react";
import AnnexureLayout from "./AnnexureLayout";
import AnnexureHeader from "./AnnexureHeader";
import AnnexureTable from "./AnnexureTable";
import AnnexureFooter from "./AnnexureFooter";

const toeLoadHeaderRows = [
  [
    { label: "S. No", rowSpan: 2 },
    { label: "Cast Heat No.", rowSpan: 2 },
    { label: "Lot No.", rowSpan: 2 },
    { label: "Colour Code", rowSpan: 2 },
    { label: "Qty. (Nos.)", rowSpan: 2 },
    { label: "Sample size", rowSpan: 2 },
    {
      label:
        "Toe Load test (ERC MK-III: 850-1100 kgs) (ERC MK-V: 1200-1500 kgs)",
      colSpan: 10,
    },
    { label: "No. of defectives", rowSpan: 2 },
    { label: "Cumulative No. of defectives", rowSpan: 2 },
    { label: "Accepted / Not accepted", rowSpan: 2 },
  ],
  [
    { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" },
    { label: "5" }, { label: "6" }, { label: "7" }, { label: "8" },
    { label: "9" }, { label: "10" },
  ],
];

const ToeLoadTestAnnexure = ({ data, selectedCall }) => {
  // Logic: Each sampling round gets its own page
  const reportData = data?.responseData || data || {};
  const pages = reportData.pages || [];

  if (!pages || pages.length === 0) {
    return (
      <div className="annexure-empty-state">
        <p>No Toe Load Test data available for this call.</p>
      </div>
    );
  }

  return (
    <>
      {pages.map((page, pageIdx) => (
        <AnnexureLayout key={pageIdx}>
          <AnnexureHeader
            pageNo={`${pageIdx + 1} of ${pages.length}`}
            preparedBy="KJM"
            checkedBy="CSR"
            approvedBy="GM(I)/WR"
            title="Final Inspection Report"
            subtitle="Test results of - Toe load test"
            annexureNumber="Annexure-XI"
            annexureCode="IRST-31-2025"
            // Pass metadata from the root DTO
            manufacturer={reportData.manufacturer}
            vendor={reportData.vendor}
            firmName={reportData.vendor} // Added firmName
            productName={reportData.productName}
            dateOfInspection={reportData.dateOfInspection}
          />

          <AnnexureTable headerRows={toeLoadHeaderRows}>
            {page.rows && page.rows.map((batch, batchIndex) => {
              const rowSpan = batch.readings?.length || 1;

              return batch.readings?.map((readingRow, rowIndex) => (
                <tr key={`${batchIndex}-${rowIndex}`}>
                  {/* Left columns: Only render on the first row of a batch */}
                  {rowIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan}>{batchIndex + 1}</td>
                      <td rowSpan={rowSpan}>{batch.heatNo || '-'}</td>
                      <td rowSpan={rowSpan}>{batch.lotNo || '-'}</td>
                      <td rowSpan={rowSpan}>{batch.colourCode || 'N/A'}</td>
                      <td rowSpan={rowSpan}>{batch.qty || 0}</td>
                      <td rowSpan={rowSpan}>{batch.sampleSize || 0}</td>
                    </>
                  )}

                  {/* 10 Reading columns */}
                  {[...Array(10)].map((_, i) => (
                    <td key={i}>{readingRow[i] !== undefined ? readingRow[i].toString() : ""}</td>
                  ))}

                  {/* Right columns: Only render on the first row of a batch */}
                  {rowIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan}>{batch.defectives}</td>
                      <td rowSpan={rowSpan}>{batch.cumulativeDefectives}</td>
                      <td rowSpan={rowSpan}>
                        <span className={`status-badge ${batch.status === 'Accepted' ? 'status-ok' : 'status-not-ok'}`}>
                          {batch.status}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ));
            })}
          </AnnexureTable>

          <AnnexureFooter />
        </AnnexureLayout>
      ))}
    </>
  );
};

export default ToeLoadTestAnnexure;

