import React, { useState } from 'react';
import './PoWiseMonthlyReport.css';

const PoWiseMonthlyReport = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Full list of Zonal Railways as requested
    const zonalRailways = [
        'CR', 'ER', 'ECR', 'ECoR', 'NR', 'NCR', 'NER', 'NFR', 'NWR', 'SR', 'SCR', 'SER', 'SECR', 'SWR', 'WR', 'WCR'
    ];

    const dummyData = zonalRailways.map((rly, index) => {
        // Create 1-3 rows per zone to demonstrate multi-row grouping
        const rowCount = (index % 3) + 1;
        const vendors = [];
        let totalInspected = 0;
        let totalAccepted = 0;
        let totalRej = 0;

        for (let i = 0; i < rowCount; i++) {
            const inspected = 30000 + (index * 500) + (i * 1000);
            const accepted = inspected - (200 + (i * 50));
            const rej = inspected - accepted;
            
            totalInspected += inspected;
            totalAccepted += accepted;
            totalRej += rej;

            vendors.push({
                vendorName: i === 0 ? 'Cemcon Railway Industries' : (i === 1 ? 'Fateh Chand Jain' : 'Utkarsh'),
                type: 'MK-V',
                poNoDate: `512450${70000 + index + i} Dt:1${i+1}.11.2025`,
                specification: 'IRS T-31 Latest',
                inspected: inspected,
                accepted: accepted,
                rejections: {
                    total: rej,
                    rmCheck: { chem: '', dia: '', grain: '', inclusion: '', decarb: '' },
                    process: { hardness: 10 + i, shearing: 50 + i, mpi: 100 + i, turning: 40 + i, forging: '', quenching: '', tempering: '', dimension: '' },
                    acceptance: { hardness: 50 + i, decarb: '', dimTol: '', appDeflection: '', toeLoad: '', weight: rej - (250 + i), visual: '', micro: '', freedom: '', other: '' }
                },
                remarks: i === 0 ? 'Standard Check' : '',
                percentage: ((rej / inspected) * 100).toFixed(2) + '%'
            });
        }

        return {
            sNo: index + 1,
            zonalRailway: rly,
            vendors: vendors,
            subTotal: { 
                inspected: totalInspected, 
                accepted: totalAccepted, 
                totalRej: totalRej, 
                percentage: ((totalRej / totalInspected) * 100).toFixed(2) + '%' 
            }
        };
    });

    return (
        <div className="pwmr-container animate-up">
            <div className="pwmr-header">
                <div className="pwmr-title-section">
                    <h2>PO Wise Monthly Report</h2>
                    <p className="pwmr-subtitle">Quality of ERCs during 2026-27 (Apr'26)</p>
                </div>
                <div className="pwmr-actions">
                    <div className="pwmr-search-wrapper">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Search Zonal Railway or Vendor..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="pwmr-export-btn">
                        <i className="fa-solid fa-file-excel"></i> Export Excel
                    </button>
                </div>
            </div>

            <div className="pwmr-table-wrapper">
                <table className="pwmr-table">
                    <thead>
                        <tr className="excel-main-title-row">
                            <th colSpan="8" className="empty-cell"></th>
                            <th colSpan="24" className="excel-title">Quality of ERCs during 2026-27</th>
                            <th colSpan="2" className="excel-month">Apr'26</th>
                        </tr>
                        <tr>
                            <th rowSpan="4" className="sticky-col col-sno">S.No.</th>
                            <th rowSpan="4" className="sticky-col col-railway">Zonal Railway</th>
                            <th rowSpan="4" className="sticky-col col-vendor">Vendor</th>
                            <th rowSpan="4" className="col-type">Type of ERCs (eg. ERC MK-V)</th>
                            <th rowSpan="4">P.O. No. & Date</th>
                            <th rowSpan="4">Specification (T-31-2025- Sixth Revision/ T-31-2021)</th>
                            <th rowSpan="4">Quantity Inspected</th>
                            <th rowSpan="4">Quantity Accepted</th>
                            <th colSpan="24" className="rejection-main-header">No. of ERC rejected & reasons for rejection</th>
                            <th rowSpan="4">Remarks, if any</th>
                            <th rowSpan="4">%age rejection</th>
                        </tr>
                        <tr>
                            <th rowSpan="3">Total Nos.</th>
                            <th colSpan="5">Raw material check</th>
                            <th colSpan="8">Process</th>
                            <th colSpan="10">Acceptance</th>
                        </tr>
                        <tr>
                            <th rowSpan="2">Chemical composition</th>
                            <th rowSpan="2">Diameter of bar</th>
                            <th rowSpan="2">Grain size</th>
                            <th rowSpan="2">Inclusion rating</th>
                            <th rowSpan="2">Depth of decarb.</th>
                            <th rowSpan="2">Hardness</th>
                            <th rowSpan="2">Shearing</th>
                            <th rowSpan="2">MPI</th>
                            <th rowSpan="2">Turning</th>
                            <th rowSpan="2">Forging</th>
                            <th rowSpan="2">Quenching</th>
                            <th rowSpan="2">Tempering</th>
                            <th rowSpan="2">Dimension (finished ERC)</th>
                            <th rowSpan="2">Hardness</th>
                            <th rowSpan="2">Depth of Decarburization</th>
                            <th rowSpan="2">Dimension tolerance</th>
                            <th rowSpan="2">Application & Deflection test</th>
                            <th rowSpan="2">Toe Load test</th>
                            <th rowSpan="2">Weight</th>
                            <th rowSpan="2">Visual test</th>
                            <th rowSpan="2">Micro Structure</th>
                            <th rowSpan="2">Freedom from defects</th>
                            <th rowSpan="2">Other rejections</th>
                        </tr>
                        <tr></tr>
                    </thead>
                    <tbody>
                        {dummyData.map((zone, zIdx) => (
                            <React.Fragment key={zIdx}>
                                {zone.vendors.map((vendor, vIdx) => (
                                    <tr key={`${zIdx}-${vIdx}`} className={vIdx % 2 === 0 ? 'row-even' : 'row-odd'}>
                                        {vIdx === 0 && <td rowSpan={zone.vendors.length + 1} className="text-center font-bold sticky-col col-sno">{zone.sNo}</td>}
                                        {vIdx === 0 && <td rowSpan={zone.vendors.length + 1} className="text-center font-bold sticky-col col-railway">{zone.zonalRailway}</td>}
                                        <td className="sticky-col col-vendor">{vendor.vendorName}</td>
                                        <td className="col-type">{vendor.type}</td>
                                        <td>{vendor.poNoDate}</td>
                                        <td>{vendor.specification}</td>
                                        <td className="text-right">{vendor.inspected.toLocaleString()}</td>
                                        <td className="text-right">{vendor.accepted.toLocaleString()}</td>
                                        <td className="text-right font-bold text-red-600">{vendor.rejections.total.toLocaleString()}</td>
                                        <td className="text-right">{vendor.rejections.rmCheck.chem}</td>
                                        <td className="text-right">{vendor.rejections.rmCheck.dia}</td>
                                        <td className="text-right">{vendor.rejections.rmCheck.grain}</td>
                                        <td className="text-right">{vendor.rejections.rmCheck.inclusion}</td>
                                        <td className="text-right">{vendor.rejections.rmCheck.decarb}</td>
                                        <td className="text-right">{vendor.rejections.process.hardness}</td>
                                        <td className="text-right">{vendor.rejections.process.shearing}</td>
                                        <td className="text-right">{vendor.rejections.process.mpi}</td>
                                        <td className="text-right">{vendor.rejections.process.turning}</td>
                                        <td className="text-right">{vendor.rejections.process.forging}</td>
                                        <td className="text-right">{vendor.rejections.process.quenching}</td>
                                        <td className="text-right">{vendor.rejections.process.tempering}</td>
                                        <td className="text-right">{vendor.rejections.process.dimension}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.hardness}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.decarb}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.dimTol}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.appDeflection}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.toeLoad}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.weight}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.visual}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.micro}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.freedom}</td>
                                        <td className="text-right">{vendor.rejections.acceptance.other}</td>
                                        <td className="remarks-cell">{vendor.remarks}</td>
                                        <td className="text-right font-bold">{vendor.percentage}</td>
                                    </tr>
                                ))}
                                <tr className="subtotal-row">
                                    <td colSpan="4" className="text-right font-bold">Sub Total</td>
                                    <td className="text-right font-bold">{zone.subTotal.inspected.toLocaleString()}</td>
                                    <td className="text-right font-bold">{zone.subTotal.accepted.toLocaleString()}</td>
                                    <td className="text-right font-bold text-red-600">{zone.subTotal.totalRej.toLocaleString()}</td>
                                    <td colSpan="22"></td>
                                    <td className="text-right font-bold">{zone.subTotal.percentage}</td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PoWiseMonthlyReport;
