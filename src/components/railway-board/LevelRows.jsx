import React, { useState, useMemo } from 'react';
import { StatusBadge, ExpandIcon } from './SharedComponents';
import reportService from '../../services/reportService';
import Pagination from '../Pagination';
import useReportData from '../../hooks/useReportData';

// --- Level 3 & 4 Components ---

function Level4Table({ callNo, parentSerial, railway }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const { data: shifts, loading, error } = useReportData(reportService.getLevel4Report, callNo);

    if (loading) return <div className="p-4 text-center">Loading Detailed Report...</div>;
    if (error) return <div className="p-4 text-center text-red">Error: {error}</div>;

    const count = shifts?.length || 0;
    const paginatedData = shifts?.slice(page * rowsPerPage, (page + 1) * rowsPerPage) || [];

    return (
        <div className="nested-table-wrapper level-4">
            <div className="level-label level-4-label">Level 4: Inspection Call Wise List (Only for Process Inspection)</div>
            <div className="level-4-scroll-container">
                <table className="data-table complex-table nested-table level-4-table">
                    <thead>
                        {/* Row 1: Main Headers */}
                        <tr>
                            <th rowSpan="3">Date</th>
                            <th rowSpan="3">Shift</th>
                            <th rowSpan="3">Sl No.</th>
                            <th rowSpan="3">PO + Sr. No.</th>
                            <th rowSpan="3">Lot Number</th>
                            <th rowSpan="3">Total Accepted Qty</th>
                            <th rowSpan="3">Total Rejection Qty</th>

                            <th colSpan="2" className="process-header shearing">Shearing</th>
                            <th colSpan="2" className="process-header turning">Turning</th>
                            <th colSpan="2" className="process-header mpi">MPI</th>
                            <th colSpan="2" className="process-header forging">Forging</th>
                            <th colSpan="2" className="process-header quenching">Quenching</th>
                            <th colSpan="2" className="process-header tempering">Tempering</th>

                            {/* Rejection Classification Headers (Yellow) - Updated colSpan to 24 */}
                            <th colSpan="24" className="rejection-class-header">Rejection Classification</th>
                        </tr>

                        {/* Row 2: Sub Headers */}
                        <tr>
                            {/* Process Sub-headers */}
                            <th rowSpan="2" className="shearing-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="shearing-col" style={{ minWidth: '90px' }}>REJ QTY</th>
                            <th rowSpan="2" className="turning-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="turning-col" style={{ minWidth: '90px' }}>REJ QTY</th>
                            <th rowSpan="2" className="mpi-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="mpi-col" style={{ minWidth: '90px' }}>REJ QTY</th>
                            <th rowSpan="2" className="forging-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="forging-col" style={{ minWidth: '90px' }}>REJ QTY</th>
                            <th rowSpan="2" className="quenching-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="quenching-col" style={{ minWidth: '90px' }}>REJ QTY</th>
                            <th rowSpan="2" className="tempering-col" style={{ minWidth: '90px' }}>PROD QTY</th><th rowSpan="2" className="tempering-col" style={{ minWidth: '90px' }}>REJ QTY</th>

                            {/* Rejection Details Sub-headers */}
                            <th colSpan="4" className="shearing-col">Shearing Defects</th>
                            <th colSpan="3" className="turning-col">Turning Defects</th>
                            <th className="mpi-col">MPI Defects</th>
                            <th colSpan="4" className="forging-col">Forging Defects</th>
                            <th className="quenching-col">Quenching Defects</th>
                            <th colSpan="3" className="dim-col">Dimensional Rejection</th>
                            <th colSpan="3" className="visual-col">Visual Defects</th>
                            <th colSpan="3" className="testing-col">Testing Defects</th>
                            <th colSpan="2" className="finishing-col">Finishing Defects</th>
                        </tr>

                        {/* Row 3: Granular Defect Headers */}
                        <tr>
                            {/* Shearing */}
                            <th className="shearing-col" style={{ minWidth: '110px' }}>CUT LENGTH</th><th className="shearing-col">OVALITY</th><th className="shearing-col">SHARP EDGES</th><th className="shearing-col">CRACKS</th>
                            {/* Turning */}
                            <th className="turning-col" style={{ minWidth: '120px' }}>PARALLEL LEN</th><th className="turning-col">FULL TURNING</th><th className="turning-col">TURN DIA</th>
                            {/* MPI */}
                            <th className="mpi-col">MPI REJ</th>
                            {/* Forging */}
                            <th className="forging-col">FORGE TEMP</th><th className="forging-col">STABILISE</th><th className="forging-col">IMPROPER</th><th className="forging-col">FORGE DEFECT</th>
                            {/* Quenching */}
                            <th className="quenching-col">HARDNESS</th>
                            {/* Dimensional */}
                            <th className="dim-col">BOX GAUGE</th><th className="dim-col">BEARING AREA</th><th className="dim-col">FALLING</th>
                            {/* Visual */}
                            <th className="visual-col">SURFACE</th><th className="visual-col">EMBOSSING</th><th className="visual-col">MARKING</th>
                            {/* Testing */}
                            <th className="testing-col">TEMP HARD</th><th className="testing-col">TOE LOAD</th><th className="testing-col">WEIGHT</th>
                            {/* Finishing */}
                            <th className="finishing-col">PAINT ID</th><th className="finishing-col">COATING</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((shift, index) => (
                            <tr key={index} className="clickable-row">
                                <td>{shift.basicDetails?.date ? new Date(shift.basicDetails.date).toLocaleDateString() : 'Invalid Date'}</td>
                                <td>{shift.basicDetails?.shift || '-'}</td>
                                <td>{index + 1}</td>
                                <td>{shift.basicDetails?.poSrNo || callNo}</td>
                                <td>{shift.basicDetails?.lotNumber || '-'}</td>
                                <td>{shift.basicDetails?.totalAcceptedQty ?? 0}</td>
                                <td>{shift.basicDetails?.totalRejectionQty ?? 0}</td>

                                <td>{shift.processQty?.shearingProductionQty ?? 0}</td><td>{shift.processQty?.shearingRejectionQty ?? 0}</td>
                                <td>{shift.processQty?.turningProductionQty ?? 0}</td><td>{shift.processQty?.turningRejectionQty ?? 0}</td>
                                <td>{shift.processQty?.mpiProductionQty ?? 0}</td><td>{shift.processQty?.mpiRejectionQty ?? 0}</td>
                                <td>{shift.processQty?.forgingProductionQty ?? 0}</td><td>{shift.processQty?.forgingRejectionQty ?? 0}</td>
                                <td>{shift.processQty?.quenchingProductionQty ?? 0}</td><td>{shift.processQty?.quenchingRejectionQty ?? 0}</td>
                                <td>{shift.processQty?.temperingProductionQty ?? 0}</td><td>{shift.processQty?.temperingRejectionQty ?? 0}</td>
                                <td>{shift.shearingDefects?.lengthOfCutBar ?? 0}</td>
                                <td>{shift.shearingDefects?.ovalityImproperDiaAtEnd ?? 0}</td>
                                <td>{shift.shearingDefects?.sharpEdges ?? 0}</td>
                                <td>{shift.shearingDefects?.crackedEdges ?? 0}</td>

                                <td>{shift.turningDefects?.parallelLength ?? 0}</td>
                                <td>{shift.turningDefects?.fullTurningLength ?? 0}</td>
                                <td>{shift.turningDefects?.turningDia ?? 0}</td>

                                <td>{shift.processQty?.mpiRejectionQty ?? 0}</td>

                                <td>{shift.forgingDefects?.forgingTemperature ?? 0}</td>
                                <td>{shift.forgingDefects?.forgingStabilisationRejection ?? 0}</td>
                                <td>{shift.forgingDefects?.improperForging ?? 0}</td>
                                <td>{shift.forgingDefects?.forgingMarksNotches ?? 0}</td>

                                <td>{shift.testingDefects?.temperingHardness ?? 0}</td>

                                <td>{shift.dimensionalDefects?.boxGauge ?? 0}</td>
                                <td>{shift.dimensionalDefects?.flatBearingArea ?? 0}</td>
                                <td>{shift.dimensionalDefects?.fallingGauge ?? 0}</td>

                                <td>{shift.visualDefects?.surfaceDefect ?? 0}</td>
                                <td>{shift.visualDefects?.embossingDefect ?? 0}</td>
                                <td>{shift.visualDefects?.marking ?? 0}</td>

                                <td>0</td>
                                <td>{shift.testingDefects?.toeLoad ?? 0}</td><td>{shift.testingDefects?.weight ?? 0}</td>
                                <td>{shift.finishingDefects?.paintIdentification ?? 0}</td><td>{shift.finishingDefects?.ercCoating ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination
                theme="slate"
                currentPage={page}
                totalPages={Math.ceil(count / rowsPerPage)}
                start={page * rowsPerPage}
                end={Math.min((page + 1) * rowsPerPage, count)}
                totalCount={count}
                onPageChange={setPage}
                rows={rowsPerPage}
                onRowsChange={(r) => { setRowsPerPage(r); }}
            />
        </div>
    );
}

function Level3Row({ call, expandedCall, toggleCall, parentSerial, index, railway }) {
    const isExpanded = expandedCall === call.inspectionCallNumber;
    const isProcess = call.stageOfInspection === 'Process' || call.inspectionType === 'Process';
    // const shifts = SHIFT_RESULTS[call.call_no] || [];

    return (
        <React.Fragment>
            <tr
                className={`clickable-row ${isExpanded ? 'expanded-row-parent' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleCall(call.inspectionCallNumber); }}
            >
                <td className="text-center">
                    {isProcess && <ExpandIcon isExpanded={isExpanded} isSubmenu={true} />}
                </td>
                <td>{index + 1}</td>
                <td className="font-medium text-teal" style={{ whiteSpace: 'nowrap' }}>{parentSerial}</td>
                <td className="font-medium text-teal">{call.inspectionCallNumber}</td>
                <td><StatusBadge status={call.stageOfInspection} /></td>
                <td>{call.desiredDateOfInspection ? new Date(call.desiredDateOfInspection).toLocaleDateString() : '-'}</td>
                <td>{call.inspectionStartDate ? new Date(call.inspectionStartDate).toLocaleDateString() : '-'}</td>
                <td>{call.inspectionCompletionDate ? new Date(call.inspectionCompletionDate).toLocaleDateString() : '-'}</td>
                <td className="text-center">{call.noOfVisitsOrMandays}</td>
                <td className="text-right">{call.offeredOrManufacturedQty?.toLocaleString()}</td>
                <td className="text-right">{call.acceptedQuantity?.toLocaleString()}</td>
                <td className="text-right">{call.balanceQty?.toLocaleString()}</td>
                <td className={call.rejectionPercentage > 5 ? 'text-red' : ''}>{call.rejectionPercentage || 0}%</td>
                <td className="col-reason" title={call.mainReasonForRejection}>{call.mainReasonForRejection || '-'}</td>
                <td>{call.icNumber}</td>
            </tr>
            {isExpanded && isProcess && (
                <tr className="detail-row level-4-container">
                    <td colSpan="15">
                        <Level4Table callNo={call.inspectionCallNumber} parentSerial={parentSerial} railway={railway} />
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}

function Level3Table({ poNo, rlyPoSrNo, expandedCall, toggleCall, parentSerial, railway }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const apiParams = useMemo(() => ({ poNo, rlyPoSrNo, page, size: rowsPerPage }), [poNo, rlyPoSrNo, page, rowsPerPage]);
    const { data: calls, pagination, loading, error } = useReportData(reportService.getLevel3Report, apiParams);

    if (loading) return <div className="p-4 text-center">Loading Inspection Calls...</div>;
    if (error) return <div className="p-4 text-center text-red">Error: {error}</div>;

    const count = pagination?.totalElements || 0;
    const tableData = calls || [];

    return (
        <div className="nested-table-wrapper level-3">
            <div className="level-label">Level 3: Inspection Calls</div>
            <table className="data-table nested-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Sl No.</th>
                        <th>Rly-Sr.</th>
                        <th>Call</th>
                        <th>Stage</th>
                        <th>Des Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Visits</th>
                        <th>Off</th>
                        <th>Acc</th>
                        <th>Bal</th>
                        <th>Rej%</th>
                        <th>Reason</th>
                        <th>IC No</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((call, idx) => (
                        <Level3Row
                            key={call.inspectionCallNumber || idx}
                            call={call}
                            index={(page * rowsPerPage) + idx}
                            parentSerial={parentSerial}
                            railway={railway}
                            expandedCall={expandedCall}
                            toggleCall={toggleCall}
                        />
                    ))}
                </tbody>
            </table>
            {/* Level 3 Pagination - Only show if no call is expanded */}
            {!expandedCall && (
                <Pagination
                    theme="orange"
                    currentPage={page}
                    totalPages={pagination?.totalPages || Math.ceil(count / rowsPerPage)}
                    start={page * rowsPerPage}
                    end={Math.min((page + 1) * rowsPerPage, count)}
                    totalCount={count}
                    onPageChange={setPage}
                    rows={rowsPerPage}
                    onRowsChange={(r) => { setRowsPerPage(r); }}
                />
            )}
        </div>
    );
}

function Level2Row({ row, index, expandedSerial, toggleSerial, expandedCall, toggleCall, railway, poNo }) {
    const compositeId = `${poNo}_${row.rlyPoSrNo}`;
    const isExpanded = expandedSerial === compositeId;

    return (
        <React.Fragment>
            <tr
                className={`clickable-row ${isExpanded ? 'expanded-row-parent' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleSerial(poNo, row.rlyPoSrNo); }}
            >
                <td className="text-center">
                    <ExpandIcon isExpanded={isExpanded} isSubmenu={true} />
                </td>
                <td>{index + 1}</td>
                <td className="font-medium text-teal">{row.rlyPoSrNo}</td>
                <td title={row.consignee}>{row.consignee}</td>
                <td>{new Date(row.originalDpDate).toLocaleDateString()}</td>
                <td>{row.extendedDpDate ? new Date(row.extendedDpDate).toLocaleDateString() : '-'}</td>
                <td className="text-right">{row.poSrNoQty?.toLocaleString()}</td>
                <td className="text-right">{row.balancePoQty?.toLocaleString()}</td>
                <td className="text-center">{row.noOfIcIssued}</td>
                <td>-</td>
                <td className="text-right">{row.rawMaterialAcceptedMt}</td>
                <td className={row.rawMaterialRejectionPercentage > 2 ? 'text-red' : ''}>{row.rawMaterialRejectionPercentage || 0}%</td>
                <td className="text-right">{row.processInspectionMaterialAcceptedNos?.toLocaleString()}</td>
                <td className={row.processInspectionMaterialRejectionPercentage > 3 ? 'text-red' : ''}>{row.processInspectionMaterialRejectionPercentage || 0}%</td>
                <td className="text-right">{row.finalInspectionMaterialAcceptedNos?.toLocaleString()}</td>
                <td className={row.finalInspectionMaterialRejectionPercentage > 1 ? 'text-red' : ''}>{row.finalInspectionMaterialRejectionPercentage || 0}%</td>
            </tr>
            {isExpanded && (
                <tr className="detail-row level-3-container">
                    <td colSpan="16">
                        <Level3Table
                            rlyPoSrNo={row.rlyPoSrNo}
                            poNo={poNo}
                            parentSerial={row.rlyPoSrNo}
                            railway={railway}
                            expandedCall={expandedCall}
                            toggleCall={toggleCall}
                        />
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
}

function Level2Table({ poNo, expandedSerial, toggleSerial, expandedCall, toggleCall, railway }) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const { data: serials, loading, error } = useReportData(reportService.getLevel2Report, poNo);

    if (loading) return <div className="p-4 text-center">Loading PO Serial Details...</div>;
    if (error) return <div className="p-4 text-center text-red">Error: {error}</div>;

    const count = serials?.length || 0;
    const paginatedData = serials?.slice(page * rowsPerPage, (page + 1) * rowsPerPage) || [];

    return (
        <div className="nested-table-wrapper">
            <div className="level-label">Level 2: PO Serial Details</div>
            <table className="data-table nested-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}></th>
                        <th>Sl No.</th>
                        <th>Rly-Sr. No.</th>
                        <th>Consignee</th>
                        <th>DP Date</th>
                        <th>Ext DP</th>
                        <th>Qty</th>
                        <th>Bal</th>
                        <th>ICs</th>
                        <th>Last IC</th>
                        <th>RM Acc</th>
                        <th>RM %</th>
                        <th>Proc Acc</th>
                        <th>Proc %</th>
                        <th>Final Acc</th>
                        <th>Final %</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.map((row, idx) => (
                        <Level2Row
                            key={row.rlyPoSrNo || idx}
                            row={row}
                            poNo={poNo}
                            index={(page * rowsPerPage) + idx}
                            expandedSerial={expandedSerial}
                            toggleSerial={toggleSerial}
                            expandedCall={expandedCall}
                            toggleCall={toggleCall}
                            railway={railway}
                        />
                    ))}
                </tbody>
            </table>
            {/* Level 2 Pagination - Only show if no serial is expanded */}
            {!expandedSerial && (
                <Pagination
                    theme="blue"
                    currentPage={page}
                    totalPages={Math.ceil(count / rowsPerPage)}
                    start={page * rowsPerPage}
                    end={Math.min((page + 1) * rowsPerPage, count)}
                    totalCount={count}
                    onPageChange={setPage}
                    rows={rowsPerPage}
                    onRowsChange={(r) => { setRowsPerPage(r); }}
                />
            )}
        </div>
    );
}

// --- Level 1 Component ---

export const Level1Row = React.memo(({
    po,
    index,
    expandedPo,
    togglePo,
    expandedSerial,
    toggleSerial,
    expandedCall,
    toggleCall
}) => {
    const isExpanded = expandedPo === po.poNo;

    return (
        <React.Fragment>
            <tr
                className={`clickable-row ${isExpanded ? 'expanded-row-parent' : ''}`}
                onClick={() => togglePo(po?.poNo)}
            >
                <td className="text-center">
                    <ExpandIcon isExpanded={isExpanded} />
                </td>
                <td>{index + 1}</td>
                <td><span className="badge-railway">{po?.railway}</span></td>
                <td className="font-medium text-teal">{po?.poNo}</td>
                <td>{po?.poDate ? new Date(po.poDate).toLocaleDateString() : '-'}</td>
                <td className="col-vendor" title={po?.vendor}>{po?.vendor}</td>
                <td>{po?.inspectionRegion || '-'}</td>
                <td className="text-right">{po?.poQty?.toLocaleString() || '0'}</td>
                <td className="text-right">{po?.finalQuantityAcceptedByRites?.toLocaleString() || '0'}</td>
                <td className="text-right">{po?.balancePoQty?.toLocaleString() || '0'}</td>
                <td className={po?.rawMaterialRejectionPercentage > 2 ? 'text-red' : ''}>{po?.rawMaterialRejectionPercentage || 0}%</td>
                <td className={po?.processInspectionRejectionPercentage > 3 ? 'text-red' : ''}>{po?.processInspectionRejectionPercentage || 0}%</td>
                <td>{po?.finalInspectionRejectionPercentage || 0}%</td>
                <td><StatusBadge status={po?.poStatus} /></td>
            </tr>
            {isExpanded && (
                <tr className="detail-row level-2-container">
                    <td colSpan="14">
                        <Level2Table
                            poNo={po?.poNo}
                            railway={po?.railway}
                            expandedSerial={expandedSerial}
                            toggleSerial={toggleSerial}
                            expandedCall={expandedCall}
                            toggleCall={toggleCall}
                        />
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
});
