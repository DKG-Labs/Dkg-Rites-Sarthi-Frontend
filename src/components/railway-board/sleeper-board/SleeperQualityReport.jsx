import React, { useState, useMemo } from 'react';
import { downloadExcel } from '../SharedComponents';
import './SleeperQualityReport.css';

const SleeperQualityReport = ({ fromDate, toDate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');

    // High quality mock data perfectly representing all 16 Indian Railways
    const initialData = useMemo(() => [
        // 1. CR (Central Railway)
        { sNo: 1, railway: 'CR', csp: 'Manmad', type: 'Mainline', produced: 18450, inspected: 18200, rejectedInProcess: 45, icIssuedQty: 16200, icIssuedCount: 3, lastIcDate: '24.04.26', totalNosRej: 40, rejDimension: 35, rejEndDamage: 2, rejHoneyCombing: 3, rejMissingDowel: 0, rejOther: 0, remarks: '30-Slope, 5-End Broken' },
        { sNo: 1, railway: 'CR', csp: 'Manmad', type: 'Turnout', produced: 850, inspected: 800, rejectedInProcess: 5, icIssuedQty: 750, icIssuedCount: 1, lastIcDate: '18.04.26', totalNosRej: 2, rejDimension: 2, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 1, railway: 'CR', csp: 'Manmad', type: 'Special (LC, Cu., SEJ, Br., etc)', produced: 120, inspected: 100, rejectedInProcess: 1, icIssuedQty: 100, icIssuedCount: 1, lastIcDate: '20.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 1, railway: 'CR', csp: 'Manmad', type: 'On Trial orders', produced: 0, inspected: 0, rejectedInProcess: 0, icIssuedQty: 0, icIssuedCount: 0, lastIcDate: '-', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 2. ER (Eastern Railway)
        { sNo: 2, railway: 'ER', csp: 'Panagarh', type: 'Mainline', produced: 23841, inspected: 23841, rejectedInProcess: 58, icIssuedQty: 20645, icIssuedCount: 3, lastIcDate: '25.04.26', totalNosRej: 58, rejDimension: 55, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 0, remarks: '29-Slope, 17- Toe Loose & Tight, 9 - Rail Seat Loose & Tight, 1 - End Broken, 2 - Surface Defect' },
        { sNo: 2, railway: 'ER', csp: 'Panagarh', type: 'Turnout', produced: 0, inspected: 603, rejectedInProcess: 0, icIssuedQty: 603, icIssuedCount: 1, lastIcDate: '17.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 2, railway: 'ER', csp: 'Panagarh', type: 'Special (LC, Cu., SEJ, Br., etc)', produced: 0, inspected: 0, rejectedInProcess: 0, icIssuedQty: 0, icIssuedCount: 0, lastIcDate: '-', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 2, railway: 'ER', csp: 'Panagarh', type: 'On Trial orders', produced: 0, inspected: 0, rejectedInProcess: 0, icIssuedQty: 0, icIssuedCount: 0, lastIcDate: '-', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 2, railway: 'ER', csp: 'Chotta Ambona', type: 'Mainline', produced: 15892, inspected: 13664, rejectedInProcess: 84, icIssuedQty: 13580, icIssuedCount: 3, lastIcDate: '22.04.26', totalNosRej: 84, rejDimension: 76, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 8, remarks: '' },
        { sNo: 2, railway: 'ER', csp: 'Chotta Ambona', type: 'Turnout', produced: 2104, inspected: 230, rejectedInProcess: 2, icIssuedQty: 228, icIssuedCount: 2, lastIcDate: '23.04.26', totalNosRej: 2, rejDimension: 2, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 3. ECR (East Central Railway)
        { sNo: 3, railway: 'ECR', csp: 'NEPL.Sarai.', type: 'Mainline', produced: 8672, inspected: 8672, rejectedInProcess: 76, icIssuedQty: 0, icIssuedCount: 0, lastIcDate: 'NA', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: 'Due to space constraints final inspection is pending.' },
        { sNo: 3, railway: 'ECR', csp: '(DEWL) Manpur, Gaya', type: 'Mainline', produced: 19527, inspected: 19527, rejectedInProcess: 6, icIssuedQty: 23402, icIssuedCount: 5, lastIcDate: '29.04.26', totalNosRej: 19, rejDimension: 14, rejEndDamage: 1, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 4, remarks: '' },
        { sNo: 3, railway: 'ECR', csp: '(DEWL) Manpur, Gaya', type: 'Turnout', produced: 928, inspected: 928, rejectedInProcess: 0, icIssuedQty: 938, icIssuedCount: 3, lastIcDate: '29.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 4. ECoR (East Coast Railway)
        { sNo: 4, railway: 'ECoR', csp: 'Garudabilli', type: 'Mainline', produced: 23892, inspected: 23248, rejectedInProcess: 1, icIssuedQty: 18393, icIssuedCount: 2, lastIcDate: '22.04.26', totalNosRej: 48, rejDimension: 9, rejEndDamage: 2, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 35, remarks: '' },
        { sNo: 4, railway: 'ECoR', csp: 'Garudabilli', type: 'Turnout (In nos)', produced: 2784, inspected: 2784, rejectedInProcess: 0, icIssuedQty: 3360, icIssuedCount: 2, lastIcDate: '21.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 5. NR (Northern Railway)
        { sNo: 5, railway: 'NR', csp: 'Khalispur', type: 'Mainline', produced: 15400, inspected: 15100, rejectedInProcess: 32, icIssuedQty: 13200, icIssuedCount: 2, lastIcDate: '24.04.26', totalNosRej: 25, rejDimension: 20, rejEndDamage: 2, rejHoneyCombing: 3, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 5, railway: 'NR', csp: 'Khalispur', type: 'Turnout', produced: 540, inspected: 500, rejectedInProcess: 2, icIssuedQty: 480, icIssuedCount: 1, lastIcDate: '19.04.26', totalNosRej: 1, rejDimension: 1, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 6. NCR (North Central Railway)
        { sNo: 6, railway: 'NCR', csp: 'Subedarganj', type: 'Mainline', produced: 16900, inspected: 16800, rejectedInProcess: 41, icIssuedQty: 14500, icIssuedCount: 3, lastIcDate: '28.04.26', totalNosRej: 32, rejDimension: 28, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 6, railway: 'NCR', csp: 'Subedarganj', type: 'Turnout', produced: 600, inspected: 580, rejectedInProcess: 4, icIssuedQty: 550, icIssuedCount: 1, lastIcDate: '22.04.26', totalNosRej: 3, rejDimension: 3, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 7. NER (North Eastern Railway)
        { sNo: 7, railway: 'NER', csp: 'Gorakhpur', type: 'Mainline', produced: 12400, inspected: 12300, rejectedInProcess: 18, icIssuedQty: 11000, icIssuedCount: 2, lastIcDate: '23.04.26', totalNosRej: 14, rejDimension: 11, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 7, railway: 'NER', csp: 'Gorakhpur', type: 'Turnout', produced: 320, inspected: 300, rejectedInProcess: 1, icIssuedQty: 300, icIssuedCount: 1, lastIcDate: '17.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 8. NFR (Northeast Frontier Railway)
        { sNo: 8, railway: 'NFR', csp: 'Bongaigaon', type: 'Mainline', produced: 9800, inspected: 9700, rejectedInProcess: 25, icIssuedQty: 8500, icIssuedCount: 2, lastIcDate: '25.04.26', totalNosRej: 18, rejDimension: 14, rejEndDamage: 2, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 8, railway: 'NFR', csp: 'Bongaigaon', type: 'Turnout', produced: 220, inspected: 200, rejectedInProcess: 0, icIssuedQty: 200, icIssuedCount: 1, lastIcDate: '18.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 9. NWR (North Western Railway)
        { sNo: 9, railway: 'NWR', csp: 'Ajmer', type: 'Mainline', produced: 14200, inspected: 14000, rejectedInProcess: 29, icIssuedQty: 12500, icIssuedCount: 3, lastIcDate: '26.04.26', totalNosRej: 22, rejDimension: 18, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 9, railway: 'NWR', csp: 'Ajmer', type: 'Turnout', produced: 410, inspected: 400, rejectedInProcess: 2, icIssuedQty: 380, icIssuedCount: 1, lastIcDate: '20.04.26', totalNosRej: 1, rejDimension: 1, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 10. SR (Southern Railway)
        { sNo: 10, railway: 'SR', csp: 'Arakkonam', type: 'Mainline', produced: 17600, inspected: 17500, rejectedInProcess: 38, icIssuedQty: 15200, icIssuedCount: 3, lastIcDate: '27.04.26', totalNosRej: 30, rejDimension: 26, rejEndDamage: 2, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 10, railway: 'SR', csp: 'Arakkonam', type: 'Turnout', produced: 520, inspected: 500, rejectedInProcess: 3, icIssuedQty: 480, icIssuedCount: 1, lastIcDate: '21.04.26', totalNosRej: 2, rejDimension: 2, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 11. SCR (South Central Railway)
        { sNo: 11, railway: 'SCR', csp: 'Secunderabad', type: 'Mainline', produced: 21500, inspected: 21300, rejectedInProcess: 52, icIssuedQty: 18900, icIssuedCount: 4, lastIcDate: '29.04.26', totalNosRej: 45, rejDimension: 39, rejEndDamage: 2, rejHoneyCombing: 3, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 11, railway: 'SCR', csp: 'Secunderabad', type: 'Turnout', produced: 720, inspected: 700, rejectedInProcess: 5, icIssuedQty: 680, icIssuedCount: 2, lastIcDate: '22.04.26', totalNosRej: 4, rejDimension: 4, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 12. SER (South Eastern Railway)
        { sNo: 12, railway: 'SER', csp: 'Jharsuguda', type: 'Mainline', produced: 16800, inspected: 16500, rejectedInProcess: 40, icIssuedQty: 14200, icIssuedCount: 3, lastIcDate: '25.04.26', totalNosRej: 32, rejDimension: 27, rejEndDamage: 2, rejHoneyCombing: 3, rejMissingDowel: 0, rejOther: 0, remarks: '' },
        { sNo: 12, railway: 'SER', csp: 'Jharsuguda', type: 'Turnout', produced: 480, inspected: 450, rejectedInProcess: 3, icIssuedQty: 420, icIssuedCount: 1, lastIcDate: '18.04.26', totalNosRej: 2, rejDimension: 2, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 13. SECR (South East Central Railway)
        { sNo: 13, railway: 'SECR', csp: 'Bilaspur', type: 'Mainline', produced: 13800, inspected: 13600, rejectedInProcess: 31, icIssuedQty: 12000, icIssuedCount: 2, lastIcDate: '24.04.26', totalNosRej: 24, rejDimension: 20, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 13, railway: 'SECR', csp: 'Bilaspur', type: 'Turnout', produced: 350, inspected: 340, rejectedInProcess: 2, icIssuedQty: 320, icIssuedCount: 1, lastIcDate: '19.04.26', totalNosRej: 1, rejDimension: 1, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 14. SWR (South Western Railway)
        { sNo: 14, railway: 'SWR', csp: 'Hubli', type: 'Mainline', produced: 11200, inspected: 11000, rejectedInProcess: 22, icIssuedQty: 9800, icIssuedCount: 2, lastIcDate: '26.04.26', totalNosRej: 17, rejDimension: 13, rejEndDamage: 1, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 14, railway: 'SWR', csp: 'Hubli', type: 'Turnout', produced: 280, inspected: 270, rejectedInProcess: 1, icIssuedQty: 250, icIssuedCount: 1, lastIcDate: '21.04.26', totalNosRej: 0, rejDimension: 0, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 15. WR (Western Railway)
        { sNo: 15, railway: 'WR', csp: 'Sabarmati', type: 'Mainline', produced: 19800, inspected: 19600, rejectedInProcess: 47, icIssuedQty: 17500, icIssuedCount: 4, lastIcDate: '29.04.26', totalNosRej: 38, rejDimension: 32, rejEndDamage: 2, rejHoneyCombing: 3, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 15, railway: 'WR', csp: 'Sabarmati', type: 'Turnout', produced: 680, inspected: 650, rejectedInProcess: 4, icIssuedQty: 600, icIssuedCount: 2, lastIcDate: '22.04.26', totalNosRej: 3, rejDimension: 3, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' },

        // 16. WCR (West Central Railway)
        { sNo: 16, railway: 'WCR', csp: 'Itarsi', type: 'Mainline', produced: 15600, inspected: 15400, rejectedInProcess: 35, icIssuedQty: 13800, icIssuedCount: 3, lastIcDate: '28.04.26', totalNosRej: 28, rejDimension: 23, rejEndDamage: 2, rejHoneyCombing: 2, rejMissingDowel: 0, rejOther: 1, remarks: '' },
        { sNo: 16, railway: 'WCR', csp: 'Itarsi', type: 'Turnout', produced: 460, inspected: 450, rejectedInProcess: 3, icIssuedQty: 400, icIssuedCount: 1, lastIcDate: '20.04.26', totalNosRej: 2, rejDimension: 2, rejEndDamage: 0, rejHoneyCombing: 0, rejMissingDowel: 0, rejOther: 0, remarks: '' }
    ], []);

    // Filter and group data dynamically
    const filteredAndGroupedData = useMemo(() => {
        let list = [...initialData];

        // Apply search query (Search Railway, CSP, or type)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(item =>
                (item.railway || '').toLowerCase().includes(q) ||
                (item.csp || '').toLowerCase().includes(q) ||
                (item.type || '').toLowerCase().includes(q)
            );
        }

        // Apply sleeper type filter
        if (selectedTypeFilter !== 'All') {
            list = list.filter(item => {
                if (selectedTypeFilter === 'Mainline') return item.type.includes('Mainline');
                if (selectedTypeFilter === 'Turnout') return item.type.includes('Turnout');
                if (selectedTypeFilter === 'Special') return item.type.includes('Special');
                if (selectedTypeFilter === 'Trial') return item.type.includes('Trial');
                return true;
            });
        }

        // Group by Railway
        const railwayGroups = {};
        list.forEach(item => {
            const rly = item.railway || 'Others';
            if (!railwayGroups[rly]) {
                railwayGroups[rly] = {
                    railway: rly,
                    csps: {},
                    subTotal: {
                        produced: 0,
                        inspected: 0,
                        rejectedInProcess: 0,
                        icIssuedQty: 0,
                        icIssuedCount: 0,
                        totalNosRej: 0,
                        rejDimension: 0,
                        rejEndDamage: 0,
                        rejHoneyCombing: 0,
                        rejMissingDowel: 0,
                        rejOther: 0
                    }
                };
            }

            // Group by CSP inside Railway
            const cspName = item.csp;
            if (!railwayGroups[rly].csps[cspName]) {
                railwayGroups[rly].csps[cspName] = [];
            }
            railwayGroups[rly].csps[cspName].push(item);

            // Accumulate Railway subtotal
            const sub = railwayGroups[rly].subTotal;
            sub.produced += item.produced;
            sub.inspected += item.inspected;
            sub.rejectedInProcess += item.rejectedInProcess;
            sub.icIssuedQty += item.icIssuedQty;
            sub.icIssuedCount += item.icIssuedCount;
            sub.totalNosRej += item.totalNosRej;
            sub.rejDimension += item.rejDimension;
            sub.rejEndDamage += item.rejEndDamage;
            sub.rejHoneyCombing += item.rejHoneyCombing;
            sub.rejMissingDowel += item.rejMissingDowel;
            sub.rejOther += item.rejOther;
        });

        // Compute percentage and format
        return Object.values(railwayGroups).map(group => {
            const sub = group.subTotal;
            sub.percentage = sub.icIssuedQty > 0
                ? ((sub.totalNosRej / sub.icIssuedQty) * 100).toFixed(2)
                : '0.00';

            // Convert csps object into list
            const cspsList = Object.entries(group.csps).map(([cspName, items]) => {
                return {
                    cspName,
                    items
                };
            });

            return {
                ...group,
                cspsList
            };
        });
    }, [initialData, searchQuery, selectedTypeFilter]);

    // Calculate Grand Total
    const grandTotal = useMemo(() => {
        const total = {
            produced: 0,
            inspected: 0,
            rejectedInProcess: 0,
            icIssuedQty: 0,
            icIssuedCount: 0,
            totalNosRej: 0,
            rejDimension: 0,
            rejEndDamage: 0,
            rejHoneyCombing: 0,
            rejMissingDowel: 0,
            rejOther: 0
        };

        filteredAndGroupedData.forEach(rly => {
            const sub = rly.subTotal;
            total.produced += sub.produced;
            total.inspected += sub.inspected;
            total.rejectedInProcess += sub.rejectedInProcess;
            total.icIssuedQty += sub.icIssuedQty;
            total.icIssuedCount += sub.icIssuedCount;
            total.totalNosRej += sub.totalNosRej;
            total.rejDimension += sub.rejDimension;
            total.rejEndDamage += sub.rejEndDamage;
            total.rejHoneyCombing += sub.rejHoneyCombing;
            total.rejMissingDowel += sub.rejMissingDowel;
            total.rejOther += sub.rejOther;
        });

        total.percentage = total.icIssuedQty > 0
            ? ((total.totalNosRej / total.icIssuedQty) * 100).toFixed(2)
            : '0.00';

        return total;
    }, [filteredAndGroupedData]);

    const getSubtitle = () => {
        if (!fromDate && !toDate) return 'Quality of PSC sleepers during 2026-27';
        const formatMonth = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[d.getMonth()]}'${String(d.getFullYear()).slice(2)}`;
        };
        return `Quality of PSC sleepers from ${formatMonth(fromDate) || "April'26"} to ${formatMonth(toDate) || "March'27"}`;
    };

    const handleExportExcel = () => {
        const flattened = [];
        filteredAndGroupedData.forEach(rly => {
            rly.cspsList.forEach(csp => {
                csp.items.forEach(item => {
                    flattened.push({
                        'Railway': rly.railway,
                        'CSP Name': csp.cspName,
                        'Sleeper Type': item.type,
                        'Sleepers Produced': item.produced,
                        'Sleepers Inspected': item.inspected,
                        'Rejected In Process': item.rejectedInProcess,
                        'IC Issued Qty': item.icIssuedQty,
                        'IC Issued Count': item.icIssuedCount,
                        'Last IC Date': item.lastIcDate,
                        'Total IC Rejections': item.totalNosRej,
                        'Rejection Dimension': item.rejDimension,
                        'Rejection End Damage': item.rejEndDamage,
                        'Rejection Honey Combing': item.rejHoneyCombing,
                        'Rejection Missing Dowel': item.rejMissingDowel,
                        'Rejection Other': item.rejOther,
                        'Remarks': item.remarks || '',
                        'Rejection Percentage': item.icIssuedQty > 0 ? ((item.totalNosRej / item.icIssuedQty) * 100).toFixed(2) + '%' : '0.00%'
                    });
                });
            });
        });

        if (flattened.length === 0) return;

        const headers = [
            { label: 'Railway', key: 'Railway' },
            { label: 'CSP Name', key: 'CSP Name' },
            { label: 'Sleeper Type', key: 'Sleeper Type' },
            { label: 'Sleepers Produced', key: 'Sleepers Produced' },
            { label: 'Sleepers Inspected', key: 'Sleepers Inspected' },
            { label: 'Rejected In Process', key: 'Rejected In Process' },
            { label: 'IC Issued Qty', key: 'IC Issued Qty' },
            { label: 'IC Issued Count', key: 'IC Issued Count' },
            { label: 'Last IC Date', key: 'Last IC Date' },
            { label: 'Total IC Rejections', key: 'Total IC Rejections' },
            { label: 'Rejection Dimension', key: 'Rejection Dimension' },
            { label: 'Rejection End Damage', key: 'Rejection End Damage' },
            { label: 'Rejection Honey Combing', key: 'Rejection Honey Combing' },
            { label: 'Rejection Missing Dowel', key: 'Rejection Missing Dowel' },
            { label: 'Rejection Other', key: 'Rejection Other' },
            { label: 'Remarks', key: 'Remarks' },
            { label: 'Rejection %', key: 'Rejection Percentage' }
        ];

        downloadExcel(flattened, headers, 'Quality_of_PSC_Sleepers_Report');
    };

    // Format display number (show empty or '-' for 0 in defects)
    const fmtDefect = (val) => {
        if (val === null || val === undefined || val === 0) return '0';
        return val.toLocaleString();
    };

    return (
        <div className="sqr-container animate-up">
            <div className="sqr-header-section">
                <div className="sqr-title-group">
                    <h2>Quality of PSC Sleepers Report</h2>
                    <p className="sqr-subtitle">{getSubtitle()}</p>
                </div>
                <div className="sqr-actions-group">
                    <div className="sqr-filter-select">
                        <select 
                            value={selectedTypeFilter} 
                            onChange={(e) => setSelectedTypeFilter(e.target.value)}
                            className="sqr-select"
                        >
                            <option value="All">All Types</option>
                            <option value="Mainline">Mainline</option>
                            <option value="Turnout">Turnout</option>
                            <option value="Special">Special</option>
                            <option value="Trial">On Trial</option>
                        </select>
                    </div>
                    <div className="sqr-search-wrapper">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input 
                            type="text" 
                            placeholder="Search CSP or Zonal Railway..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="sqr-export-btn" onClick={handleExportExcel}>
                        <i className="fa-solid fa-file-excel"></i> Export Excel
                    </button>
                </div>
            </div>

            <div className="sqr-table-wrapper">
                <table className="sqr-table">
                    <thead>
                        <tr>
                            <th rowSpan="3" className="sticky-col col-sno">S.No.</th>
                            <th rowSpan="3" className="sticky-col col-railway">Railway</th>
                            <th rowSpan="3" className="sticky-col col-csp">CSPs</th>
                            <th rowSpan="3" className="col-type">Type of PSC sleepers</th>
                            <th rowSpan="3" className="col-prod">No. of sleepers produced during the month</th>
                            <th rowSpan="3" className="col-insp">Nos. of sleepers inspected & Process Inspection Completed</th>
                            <th rowSpan="3" className="col-rej-proc">Nos. of sleepers rejected in process inspection during the month</th>
                            <th rowSpan="3" className="col-ic-qty">IC Issued Qty.</th>
                            <th rowSpan="3" className="col-ic-cnt">No. of IC issued in the month</th>
                            <th rowSpan="3" className="col-ic-date">Last Date of IC Issued</th>
                            <th colSpan="6" className="rejection-main-header">No. of sleepers rejected during process & final & reasons for rejection<br/>Based on IC</th>
                            <th rowSpan="3" className="col-remarks">Remarks, if any</th>
                            <th rowSpan="3" className="col-pct-rej">%age rejection</th>
                        </tr>
                        <tr>
                            <th rowSpan="2" className="col-rej-tot">Total Nos.<br/>(Process + final)</th>
                            <th colSpan="5" className="defect-sub-header">Defect Category</th>
                        </tr>
                        <tr className="defect-names-header">
                            <th>for Dimension/<br/>Toe Gauge</th>
                            <th>for End<br/>damage</th>
                            <th>Honey combing/<br/>Surface defect/Crack</th>
                            <th>Missing<br/>dowel</th>
                            <th>other defects<br/>(Insert sink/Tilt)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndGroupedData.map((rlyGroup, rIdx) => {
                            // Calculate total rows for this railway group to know rowspan
                            const totalRowsInGroup = rlyGroup.cspsList.reduce((acc, csp) => acc + csp.items.length, 0);
                            let isFirstRowForRailway = true;

                            return (
                                <React.Fragment key={rIdx}>
                                    {rlyGroup.cspsList.map((cspGroup, cIdx) => {
                                        let isFirstRowForCsp = true;

                                        return cspGroup.items.map((item, iIdx) => {
                                            const renderRailwayCell = isFirstRowForRailway;
                                            const renderCspCell = isFirstRowForCsp;

                                            isFirstRowForRailway = false;
                                            isFirstRowForCsp = false;

                                            const currentRejPercentage = item.icIssuedQty > 0
                                                ? ((item.totalNosRej / item.icIssuedQty) * 100).toFixed(2)
                                                : '0.00';

                                            return (
                                                <tr key={`${cIdx}-${iIdx}`} className={(rIdx + cIdx) % 2 === 0 ? 'row-even' : 'row-odd'}>
                                                    {renderRailwayCell && (
                                                        <td rowSpan={totalRowsInGroup + 1} className="text-center font-bold sticky-col col-sno">
                                                            {item.sNo}
                                                        </td>
                                                    )}
                                                    {renderRailwayCell && (
                                                        <td rowSpan={totalRowsInGroup + 1} className="text-center font-bold sticky-col col-railway">
                                                            {rlyGroup.railway}
                                                        </td>
                                                    )}
                                                    {renderCspCell && (
                                                        <td rowSpan={cspGroup.items.length} className="font-semibold sticky-col col-csp">
                                                            {cspGroup.cspName}
                                                        </td>
                                                    )}
                                                    <td className="col-type">{item.type}</td>
                                                    <td className="text-right font-medium">{item.produced.toLocaleString()}</td>
                                                    <td className="text-right text-slate-700">{item.inspected.toLocaleString()}</td>
                                                    <td className="text-right text-red-500 font-medium">{item.rejectedInProcess.toLocaleString()}</td>
                                                    <td className="text-right text-blue-600 font-bold bg-blue-50/20">{item.icIssuedQty.toLocaleString()}</td>
                                                    <td className="text-center text-blue-800 bg-blue-50/10">{item.icIssuedCount}</td>
                                                    <td className="text-center text-emerald-800 font-medium whitespace-nowrap">{item.lastIcDate}</td>
                                                    <td className="text-right font-bold text-red-600 bg-red-50/10">{item.totalNosRej.toLocaleString()}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejDimension)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejEndDamage)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejHoneyCombing)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejMissingDowel)}</td>
                                                    <td className="text-right text-slate-600">{fmtDefect(item.rejOther)}</td>
                                                    <td className="col-remarks text-slate-500 text-left font-normal" style={{ minWidth: '220px', fontSize: '11px', lineHeight: '1.3' }}>
                                                        {item.remarks || '-'}
                                                    </td>
                                                    <td className="text-right font-bold text-slate-800">
                                                        {currentRejPercentage}%
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })}
                                    {/* Zonal Subtotal Row */}
                                    <tr className="subtotal-row">
                                        <td colSpan="2" className="text-right font-bold">Sub Total ({rlyGroup.railway})</td>
                                        <td className="text-right font-bold">{rlyGroup.subTotal.produced.toLocaleString()}</td>
                                        <td className="text-right font-bold">{rlyGroup.subTotal.inspected.toLocaleString()}</td>
                                        <td className="text-right font-bold text-red-500">{rlyGroup.subTotal.rejectedInProcess.toLocaleString()}</td>
                                        <td className="text-right font-bold text-blue-600">{rlyGroup.subTotal.icIssuedQty.toLocaleString()}</td>
                                        <td className="text-center font-bold text-blue-800">{rlyGroup.subTotal.icIssuedCount}</td>
                                        <td></td>
                                        <td className="text-right font-bold text-red-600">{rlyGroup.subTotal.totalNosRej.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejDimension.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejEndDamage.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejHoneyCombing.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejMissingDowel.toLocaleString()}</td>
                                        <td className="text-right font-semibold">{rlyGroup.subTotal.rejOther.toLocaleString()}</td>
                                        <td></td>
                                        <td className="text-right font-bold text-slate-800">{rlyGroup.subTotal.percentage}%</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}

                        {/* Grand Total Row */}
                        {filteredAndGroupedData.length > 0 && (
                            <tr className="grand-total-row">
                                <td colSpan="3" className="text-center font-bold sticky-col" style={{ left: 0 }}>Grand Total</td>
                                <td></td>
                                <td className="text-right font-bold">{grandTotal.produced.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.inspected.toLocaleString()}</td>
                                <td className="text-right font-bold text-red-500">{grandTotal.rejectedInProcess.toLocaleString()}</td>
                                <td className="text-right font-bold text-blue-600">{grandTotal.icIssuedQty.toLocaleString()}</td>
                                <td className="text-center font-bold text-blue-800">{grandTotal.icIssuedCount}</td>
                                <td></td>
                                <td className="text-right font-bold text-red-600">{grandTotal.totalNosRej.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejDimension.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejEndDamage.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejHoneyCombing.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejMissingDowel.toLocaleString()}</td>
                                <td className="text-right font-bold">{grandTotal.rejOther.toLocaleString()}</td>
                                <td></td>
                                <td className="text-right font-bold text-slate-900">{grandTotal.percentage}%</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SleeperQualityReport;
