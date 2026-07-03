/* eslint-disable */
﻿import React, { useState, useEffect, useCallback } from "react";
import SubHeader from "../../../../../components/DKG_SubHeader";
import FormContainer from "../../../../../components/DKG_FormContainer";
import GeneralInfo from "../../../../../components/DKG_GeneralInfo";
import data from "../../../../../utils/frontSharedData/VisualInspection/VI.json";
import { Divider, Table, Spin, Alert, Select } from 'antd';
import FormBody from "../../../../../components/DKG_FormBody";
import Btn from "../../../../../components/DKG_Btn";
import { useNavigate } from 'react-router-dom'
import FormDropdownItem from "../../../../../components/DKG_FormDropdownItem";
import { FilterFilled } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { apiCall } from "../../../../../utils/CommonFunctions";

const { Option } = Select;

// Import only static configuration data, not the actual data
const { lineNumberList, summaryList } = data;

// Define columns for live data tables
const acceptanceColumns = [
  { title: "Rail Class", dataIndex: "railClass", key: "railClass", align: "center" },
  { title: "Accepted Length (m)", dataIndex: "acceptedLength", key: "acceptedLength", align: "center" },
  { title: "Accepted Number", dataIndex: "acceptedNo", key: "acceptedNo", align: "center" },
  { title: "Total Length (m)", dataIndex: "totalLength", key: "totalLength", align: "center" }
];

const rejectionColumns = [
  { title: "13", dataIndex: "grade13", key: "grade13", align: "center", width: 60 },
  { title: "12", dataIndex: "grade12", key: "grade12", align: "center", width: 60 },
  { title: "11", dataIndex: "grade11", key: "grade11", align: "center", width: 60 },
  { title: "10", dataIndex: "grade10", key: "grade10", align: "center", width: 60 },
  { title: "Component", dataIndex: "component", key: "component", align: "center", width: 120 }
];

const compiledColumns = [
  { title: "", dataIndex: "description", key: "description", align: "left", width: 200 },
  { title: "Tonnes", dataIndex: "tonnes", key: "tonnes", align: "center", width: 80 }
];

// Dynamic columns will be created based on actual lengths found in data
// Defect analysis columns will be created dynamically based on defect types found in data

// Basic railwise columns structure (filters will be added dynamically inside component)
const railwiseColumns = [
  { title: "S. No.", dataIndex: "serialNo", key: "serialNo", align: "center", width: 80 },
  { title: "Rail ID", dataIndex: "railId", key: "railId", align: "center", width: 120 },
  { title: "Accp. (A)", dataIndex: "acceptanceA", key: "acceptanceA", align: "center", width: 120 },
  { title: "Accp. (A+0.1)", dataIndex: "acceptanceAPlus", key: "acceptanceAPlus", align: "center", width: 120 },
  { title: "Rejection", dataIndex: "rejectionSummary", key: "rejectionSummary", align: "center", width: 120 }
];

const VIShiftSummary = () => {
  const navigate = useNavigate();
  const viGeneralInfo = useSelector(state => state.viDuty);
  const { token } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    lineNumber: '', // Empty means all lines
    summary: 'Acceptance Summary'
  });

  // Additional state for railwise length-based filtering (multi-select)
  const [railwiseLengthFilters, setRailwiseLengthFilters] = useState({
    acceptanceA: [],
    acceptanceAPlus: [],
    rejection: []
  });
  const [filteredRailwiseData, setFilteredRailwiseData] = useState([]);
  const [availableLengths, setAvailableLengths] = useState({
    acceptanceA: [],
    acceptanceAPlus: [],
    rejection: []
  });

  // Data states
  const [loading, setLoading] = useState(false);
  const [acceptanceData, setAcceptanceData] = useState([]);
  const [lengthWiseAcceptanceData, setLengthWiseAcceptanceData] = useState([]);
  const [lengthWiseAcceptanceColumns, setLengthWiseAcceptanceColumns] = useState([]);
  const [rejectionData, setRejectionData] = useState([]);
  const [compiledData, setCompiledData] = useState([]);
  const [defectAnalysisData, setDefectAnalysisData] = useState([]);
  const [defectAnalysisColumns, setDefectAnalysisColumns] = useState([]);
  const [railwiseData, setRailwiseData] = useState([]);
  const [rawViData, setRawViData] = useState([]);

  const handleChange = (fieldName, value) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [fieldName]: value
      };
      return newFormData;
    });
  };

  // Handle railwise length filter dropdown changes (multi-select)
  const handleRailwiseLengthFilterChange = (column, values) => {
    setRailwiseLengthFilters(prev => ({
      ...prev,
      [column]: values || []
    }));
  };

  // Get railwise columns with embedded filters in headers
  const getRailwiseColumns = () => [
    { title: "S. No.", dataIndex: "serialNo", key: "serialNo", align: "center", width: 80 },
    { title: "Rail ID", dataIndex: "railId", key: "railId", align: "center", width: 120 },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Accp. (A)</div>
          <Select
            mode="multiple"
            value={railwiseLengthFilters.acceptanceA}
            onChange={(values) => handleRailwiseLengthFilterChange('acceptanceA', values)}
            style={{ width: '120px', fontSize: '12px' }}
            size="small"
            placeholder="All"
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
          >
            {availableLengths.acceptanceA.map(length => (
              <Option key={length} value={length}>{length}</Option>
            ))}
          </Select>
        </div>
      ),
      dataIndex: "acceptanceA",
      key: "acceptanceA",
      align: "center",
      width: 120
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Accp. (A+0.1)</div>
          <Select
            mode="multiple"
            value={railwiseLengthFilters.acceptanceAPlus}
            onChange={(values) => handleRailwiseLengthFilterChange('acceptanceAPlus', values)}
            style={{ width: '120px', fontSize: '12px' }}
            size="small"
            placeholder="All"
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
          >
            {availableLengths.acceptanceAPlus.map(length => (
              <Option key={length} value={length}>{length}</Option>
            ))}
          </Select>
        </div>
      ),
      dataIndex: "acceptanceAPlus",
      key: "acceptanceAPlus",
      align: "center",
      width: 120
    },
    {
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Rejection</div>
          <Select
            mode="multiple"
            value={railwiseLengthFilters.rejection}
            onChange={(values) => handleRailwiseLengthFilterChange('rejection', values)}
            style={{ width: '120px', fontSize: '12px' }}
            size="small"
            placeholder="All"
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
          >
            <Option key="Component Length" value="Component Length">Component Length</Option>
            {availableLengths.rejection.map(length => (
              <Option key={length} value={length}>{length}</Option>
            ))}
          </Select>
        </div>
      ),
      dataIndex: "rejectionSummary",
      key: "rejectionSummary",
      align: "center",
      width: 120
    }
  ];

  // Extract available lengths from railwise data
  const extractAvailableLengths = (data) => {
    const lengths = {
      acceptanceA: new Set(),
      acceptanceAPlus: new Set(),
      rejection: new Set()
    };

    data.forEach(item => {
      // Extract lengths from acceptance A data
      if (item.acceptanceA) {
        const matches = item.acceptanceA.match(/(\d+(?:\.\d+)?)\s*x/g);
        if (matches) {
          matches.forEach(match => {
            const length = parseFloat(match.replace(/\s*x/g, ''));
            lengths.acceptanceA.add(length);
          });
        }
      }

      // Extract lengths from acceptance A+0.1 data
      if (item.acceptanceAPlus) {
        const matches = item.acceptanceAPlus.match(/(\d+(?:\.\d+)?)\s*x/g);
        if (matches) {
          matches.forEach(match => {
            const length = parseFloat(match.replace(/\s*x/g, ''));
            lengths.acceptanceAPlus.add(length);
          });
        }
      }

      // Extract lengths from rejection data (ONLY regular "Y x Z" format for dropdown)
      if (item.rejectionSummary) {
        const matches = item.rejectionSummary.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+)/g);
        if (matches) {
          matches.forEach(match => {
            const parts = match.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+)/);
            if (parts) {
              const length = parseInt(parts[2]);
              lengths.rejection.add(length);
            }
          });
        }
        // NOTE: Component length format (e.g., "5.33m") is NOT added to dropdown options
        // These values are only shown when "Component Length" option is selected
      }
    });

    return {
      acceptanceA: Array.from(lengths.acceptanceA).sort((a, b) => b - a),
      acceptanceAPlus: Array.from(lengths.acceptanceAPlus).sort((a, b) => b - a),
      rejection: Array.from(lengths.rejection).sort((a, b) => b - a)
    };
  };

  // Filter railwise data based on length filters (multi-select)
  const filterRailwiseDataByLength = (data, filters) => {
    return data.filter(item => {
      let matchesFilter = false;

      // Check acceptance A filter (multi-select)
      if (filters.acceptanceA && filters.acceptanceA.length > 0) {
        const hasMatch = filters.acceptanceA.some(targetLength => {
          return item.acceptanceA && item.acceptanceA.includes(`${targetLength} x`);
        });
        if (hasMatch) matchesFilter = true;
      }

      // Check acceptance A+0.1 filter (multi-select)
      if (filters.acceptanceAPlus && filters.acceptanceAPlus.length > 0) {
        const hasMatch = filters.acceptanceAPlus.some(targetLength => {
          return item.acceptanceAPlus && item.acceptanceAPlus.includes(`${targetLength} x`);
        });
        if (hasMatch) matchesFilter = true;
      }

      // Check rejection filter (multi-select with Component Length support)
      if (filters.rejection && filters.rejection.length > 0) {
        const hasMatch = filters.rejection.some(targetValue => {
          if (targetValue === 'Component Length') {
            // Check for component length format ONLY (e.g., "5.33m", "4.33m")
            // Find all matches with 'm' suffix and ensure they're NOT part of "x length" pattern
            if (!item.rejectionSummary) return false;
            const componentMatches = item.rejectionSummary.match(/\d+(?:\.\d+)?m/g);
            if (!componentMatches) return false;

            // Verify that at least one match is a standalone component length (not "x Nm")
            return componentMatches.some(match => {
              const index = item.rejectionSummary.indexOf(match);
              const beforeMatch = item.rejectionSummary.substring(Math.max(0, index - 2), index);
              return !beforeMatch.includes('x '); // Not preceded by "x "
            });
          } else {
            // Check for regular length format ONLY (e.g., "2 x 25", "1 x 117")
            // This specifically looks for the "count x length" pattern
            return item.rejectionSummary && item.rejectionSummary.includes(`x ${targetValue}`);
          }
        });
        if (hasMatch) matchesFilter = true;
      }

      // If all filters are empty, show all data
      if ((!filters.acceptanceA || filters.acceptanceA.length === 0) &&
          (!filters.acceptanceAPlus || filters.acceptanceAPlus.length === 0) &&
          (!filters.rejection || filters.rejection.length === 0)) {
        matchesFilter = true;
      }

      return matchesFilter;
    });
  };

  const handleClick = () => {
    navigate('/sms/visual/home');
  };

  // New API function for date, shift, and mill-based filtering
  const fetchViDataByDateAndShift = async (date, shift, lineNumber = null, mill = null) => {
    try {
      const requestBody = {
        date: date,
        shift: shift,
        lineNumber: lineNumber, // null for all lines, specific number for filtered
        mill: mill // mill from ongoing duty details
      };

      const { data } = await apiCall(
        "POST",
        `/vi/getViSummaryByDateAndShift`,
        token,
        requestBody
      );
      return data?.responseData || [];
    } catch (error) {
      return [];
    }
  };

  // Fallback: Use existing API and process data to create summaries
  const fetchViData = async () => {
    try {
      const { data } = await apiCall(
        "GET",
        `/vi/getViSummary?dutyId=${viGeneralInfo.dutyId}`,
        token
      );
      return data?.responseData || [];
    } catch (error) {
      return [];
    }
  };

  // Process raw VI data to create acceptance summary
  const processAcceptanceSummary = (rawData) => {
    // With the new API, filtering is done on the backend, so we process all returned data
    // Flatten all acceptance data from all rails
    const allAcceptanceData = [];
    rawData.forEach((item) => {
      if (item.acptDataList && item.acptDataList.length > 0) {
        item.acptDataList.forEach(acpt => {
          allAcceptanceData.push({
            ...acpt,
            totalLength: (parseFloat(acpt.acceptedLength || 0) * parseInt(acpt.acceptedNo || 0)).toFixed(2)
          });
        });
      }
    });

    return allAcceptanceData;
  };

  // Process acceptance data into Length Wise Acceptance Summary (pivot table format)
  const processLengthWiseAcceptanceSummary = (rawData) => {
    // Use predefined standard rail lengths (as per your expected format)
    const standardLengths = [130, 117, 86.67, 65, 52, 26, 25, 24, 13, 12, 11, 10];
    const summaryData = {};

    // Initialize rail classes with standard lengths
    const railClasses = ['A', 'A + 0.1'];

    railClasses.forEach(railClass => {
      summaryData[railClass] = {
        key: railClass,
        railClass: railClass,
        inspected: '-' // Show dash for individual classes
      };
      // Initialize all standard length columns to 0
      standardLengths.forEach(length => {
        summaryData[railClass][`length${length}`] = 0;
      });
    });

    // Process the data
    rawData.forEach((item) => {
      if (item.acptDataList && item.acptDataList.length > 0) {
        item.acptDataList.forEach(acpt => {
          const railClass = acpt.railClass || 'A';
          const acceptedLength = parseFloat(acpt.acceptedLength || 0);
          const acceptedNo = parseInt(acpt.acceptedNo || 0);

          // Add the count to the appropriate length column if it matches a standard length
          if (acceptedLength > 0 && summaryData[railClass]) {
            const matchingLength = standardLengths.find(len => Math.abs(len - acceptedLength) < 0.01);
            if (matchingLength) {
              summaryData[railClass][`length${matchingLength}`] += acceptedNo;
            }
          }
        });
      }
    });

    // Convert to array and sort by class (A first, then A + 0.1)
    const summaryArray = Object.values(summaryData).sort((a, b) => {
      if (a.railClass === 'A') return -1;
      if (b.railClass === 'A') return 1;
      return a.railClass.localeCompare(b.railClass);
    });

    // Calculate totals
    const totals = {
      key: 'total',
      railClass: 'Total',
      inspected: 0
    };
    standardLengths.forEach(length => {
      totals[`length${length}`] = 0;
    });

    // Calculate totals by summing up the length columns
    summaryArray.forEach(row => {
      standardLengths.forEach(length => {
        totals[`length${length}`] += row[`length${length}`] || 0;
      });
    });

    // Calculate total inspected as the count of unique rail IDs
    const uniqueRailIds = new Set(rawData.map(item => item.railId));
    totals.inspected = uniqueRailIds.size; // Count of unique rail IDs inspected

    summaryArray.push(totals);

    return { data: summaryArray, lengths: standardLengths };
  };

  // Create dynamic columns based on actual lengths found in data
  const createLengthWiseAcceptanceColumns = (lengths) => {
    const columns = [
      {
        title: "Class",
        dataIndex: "railClass",
        key: "railClass",
        align: "center",
        width: 80,
        fixed: 'left'
      },
      {
        title: "Inspected",
        dataIndex: "inspected",
        key: "inspected",
        align: "center",
        width: 120
      }
    ];

    // Add columns for each unique length
    lengths.forEach(length => {
      columns.push({
        title: length.toString(),
        dataIndex: `length${length}`,
        key: `length${length}`,
        align: "center",
        width: 60
      });
    });

    return columns;
  };

  // Create dynamic columns for defect analysis pivot table
  const createDefectAnalysisColumns = (defectTypes) => {
    const columns = [
      { title: "", dataIndex: "category", key: "category", align: "center", width: 120, fixed: 'left' }
    ];

    // Add columns for each defect type
    defectTypes.forEach(type => {
      columns.push({
        title: type,
        dataIndex: type,
        key: type,
        align: "center",
        width: 80
      });
    });

    return columns;
  };

  // Process raw VI data to create rejection summary (horizontal format)
  const processRejectionSummary = (rawData) => {


    // Initialize counters for different rejection grades and component length
    let rej13Count = 0;
    let rej12Count = 0;
    let rej11Count = 0;
    let rej10Count = 0;
    let totalCompLength = 0;

    // Process all rails and their rejection data
    rawData.forEach((item) => {
      // Get rejection values from the rail data
      const rej13 = item.rej13 || 0;
      const rej12 = item.rej12 || 0;
      const rej11 = item.rej11 || 0;
      const rej10 = item.rej10 || 0;
      const rejCompLength = item.rejCompLength || 0;



      // Aggregate rejection counts
      rej13Count += rej13;
      rej12Count += rej12;
      rej11Count += rej11;
      rej10Count += rej10;
      totalCompLength += rejCompLength;
    });

    // Create the summary array in horizontal format (single row with all values)
    const summaryArray = [
      {
        key: 'rejection-summary',
        grade13: rej13Count,
        grade12: rej12Count,
        grade11: rej11Count,
        grade10: rej10Count,
        component: totalCompLength
      }
    ];


    return summaryArray;
  };

  // Process raw VI data to create defect analysis pivot table
  const processDefectAnalysis = (rawData) => {


    // Collect all defect data and organize by category and type
    const defectMatrix = {};
    const allDefectTypes = new Set();
    const allDefectCategories = new Set();

    rawData.forEach(item => {
      if (item.defectDataList && item.defectDataList.length > 0) {
        item.defectDataList.forEach(defect => {
          const type = defect.defectType;
          const category = defect.defectCategory || 'Others';

          // Skip defects without a valid defectType (don't create "Unknown" column)
          if (!type || type.trim() === '') {
            return;
          }

          allDefectTypes.add(type);
          allDefectCategories.add(category);

          if (!defectMatrix[category]) {
            defectMatrix[category] = {};
          }

          if (!defectMatrix[category][type]) {
            defectMatrix[category][type] = 0;
          }

          defectMatrix[category][type] += 1;
        });
      }
    });

    // Convert sets to sorted arrays
    const sortedDefectTypes = Array.from(allDefectTypes).sort();
    const sortedDefectCategories = Array.from(allDefectCategories).sort();



    // Create pivot table data
    const pivotData = sortedDefectCategories.map(category => {
      const rowData = {
        key: category,
        category: category
      };

      // Add count for each defect type
      sortedDefectTypes.forEach(type => {
        rowData[type] = defectMatrix[category] && defectMatrix[category][type] ? defectMatrix[category][type] : 0;
      });

      return rowData;
    });



    return {
      data: pivotData,
      defectTypes: sortedDefectTypes
    };
  };

  // Process raw VI data to create railwise summary
  const processRailwiseSummary = (rawData) => {
    // With the new API, filtering is done on the backend, so we process all returned data
    return rawData.map((item, index) => {
      // Separate acceptance data by rail class
      let acceptanceA = '';
      let acceptanceAPlus = '';

      if (item.acptDataList && item.acptDataList.length > 0) {
        const classA = item.acptDataList.filter(acpt => acpt.railClass === 'A');
        const classAPlus = item.acptDataList.filter(acpt => acpt.railClass === 'A + 0.1' || acpt.railClass === '+0.1');

        acceptanceA = classA.map(acpt => `${acpt.acceptedLength} x ${acpt.acceptedNo}`).join(', ') || '';
        acceptanceAPlus = classAPlus.map(acpt => `${acpt.acceptedLength} x ${acpt.acceptedNo}`).join(', ') || '';
      }

      // Calculate rejection summary
      const rejectionSummary = [];
      if (item.rej13 > 0) rejectionSummary.push(`${item.rej13} x 13`);
      if (item.rej12 > 0) rejectionSummary.push(`${item.rej12} x 12`);
      if (item.rej11 > 0) rejectionSummary.push(`${item.rej11} x 11`);
      if (item.rej10 > 0) rejectionSummary.push(`${item.rej10} x 10`);
      if (item.rejCompLength > 0) rejectionSummary.push(`${item.rejCompLength}m`);

      return {
        key: item.railId,
        serialNo: index + 1,
        railId: item.railId,
        acceptanceA: acceptanceA || '',
        acceptanceAPlus: acceptanceAPlus || '',
        rejectionSummary: rejectionSummary.join(', ') || '',
        // Keep original data for filtering
        acceptance: item.acptDataList?.map(acpt =>
          `${acpt.railClass}: ${acpt.acceptedLength}m x ${acpt.acceptedNo}`
        ).join(', ') || 'None',
        rejection: rejectionSummary.join(', ') || 'None'
      };
    });
  };

  // Main function to fetch all data
  const fetchAllData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Use new date/shift-based API with current duty's date and shift
        let rawData = [];
        if (viGeneralInfo.date && viGeneralInfo.shift) {
          // Convert line number: empty string to null, extract number from "Line X" format
          let lineNumberFilter = null;
          if (formData.lineNumber && formData.lineNumber !== '') {
            // Extract number from "Line X" format (e.g., "Line 1" -> 1)
            const match = formData.lineNumber.match(/Line (\d+)/);
            if (match) {
              lineNumberFilter = parseInt(match[1]);
            } else {
              // If it's already a number, use it directly
              lineNumberFilter = parseInt(formData.lineNumber);
            }
        }

        rawData = await fetchViDataByDateAndShift(viGeneralInfo.date, viGeneralInfo.shift, lineNumberFilter, viGeneralInfo.mill);
      } else if (viGeneralInfo.dutyId) {
        // Fallback to duty-based API
        rawData = await fetchViData();
      }

      setRawViData(rawData);

      // Check if there's no data for the selected line number
      if (rawData.length === 0 && formData.lineNumber && formData.lineNumber !== 'All') {
        // Display N/A data when no data is found for the selected line number
        const noDataMessage = [{
          key: 1,
          sNo: 1,
          railId: 'N/A',
          heatNo: 'N/A',
          acceptanceA: 'N/A',
          acceptanceAPlus01: 'N/A',
          acceptanceTotal: 'N/A',
          rejectionSummary: 'N/A'
        }];

        setAcceptanceData(noDataMessage);
        setLengthWiseAcceptanceData([{ key: 1, railClass: 'N/A', total: 'N/A' }]);
        setLengthWiseAcceptanceColumns([
          { title: 'Rail Class', dataIndex: 'railClass', key: 'railClass', align: 'center' },
          { title: 'Total', dataIndex: 'total', key: 'total', align: 'center' }
        ]);
        setRejectionData([{ key: 1, description: 'No Data Available', count: 'N/A' }]);
        setCompiledData([{ key: 1, description: 'No Data Available', tonnes: 'N/A' }]);
        setDefectAnalysisData([{ key: 1, defectCategory: 'N/A', total: 'N/A' }]);
        setDefectAnalysisColumns([
          { title: 'Defect Category', dataIndex: 'defectCategory', key: 'defectCategory', align: 'center' },
          { title: 'Total', dataIndex: 'total', key: 'total', align: 'center' }
        ]);
        setRailwiseData(noDataMessage);
        return;
      }

      // Process data to create different summaries
      // Note: With the new API, line filtering is done on the backend,
      // so we don't need to filter again in the frontend processing functions
      const acceptance = processAcceptanceSummary(rawData);
      const lengthWiseAcceptanceResult = processLengthWiseAcceptanceSummary(rawData);
      const lengthWiseAcceptance = lengthWiseAcceptanceResult.data;
      const dynamicColumns = createLengthWiseAcceptanceColumns(lengthWiseAcceptanceResult.lengths);
      const rejection = processRejectionSummary(rawData);
      const defectAnalysisResult = processDefectAnalysis(rawData);
      const defectAnalysis = defectAnalysisResult.data;
      const defectAnalysisColumns = createDefectAnalysisColumns(defectAnalysisResult.defectTypes);
      const railwise = processRailwiseSummary(rawData);

      // Create compiled summary from raw data with tonnage calculations
      const totalRails = rawData.length;

      // Calculate acceptance data by rail class with separate length tracking
      let railsAcceptedA = 0;
      let railsAcceptedAPlus01 = 0;
      let totalAcceptedLength = 0;
      let totalRejectedLength = 0;
      let acceptedLengthA = 0;        // Track length for A class separately
      let acceptedLengthAPlus01 = 0;  // Track length for A+0.1 class separately

      rawData.forEach(item => {
        // Process acceptance data
        if (item.acptDataList && item.acptDataList.length > 0) {
          item.acptDataList.forEach(acpt => {
            const railClass = acpt.railClass || 'A';
            const acceptedLength = parseFloat(acpt.acceptedLength || 0);
            const acceptedNo = parseInt(acpt.acceptedNo || 0);
            const totalLengthForThisEntry = acceptedLength * acceptedNo;

            if (railClass === 'A') {
              railsAcceptedA += acceptedNo;
              acceptedLengthA += totalLengthForThisEntry;
            } else if (railClass === 'A + 0.1' || railClass === '+0.1') {
              railsAcceptedAPlus01 += acceptedNo;
              acceptedLengthAPlus01 += totalLengthForThisEntry;
            }

            totalAcceptedLength += totalLengthForThisEntry;
          });
        }

        // Process rejection data (include both standard pieces and component length)
        const rej13 = item.rej13 || 0;
        const rej12 = item.rej12 || 0;
        const rej11 = item.rej11 || 0;
        const rej10 = item.rej10 || 0;
        const rejCompLength = item.rejCompLength || 0;

        // Calculate total rejected length for this rail
        const railRejectedLength = (rej13 * 13) + (rej12 * 12) + (rej11 * 11) + (rej10 * 10) + rejCompLength;
        totalRejectedLength += railRejectedLength;
      });

      const totalAcceptedRails = railsAcceptedA + railsAcceptedAPlus01;
      const totalRejectedRails = rawData.filter(item => {
        const rej13 = item.rej13 || 0;
        const rej12 = item.rej12 || 0;
        const rej11 = item.rej11 || 0;
        const rej10 = item.rej10 || 0;
        const rejCompLength = item.rejCompLength || 0;
        return rej13 > 0 || rej12 > 0 || rej11 > 0 || rej10 > 0 || rejCompLength > 0;
      }).length;

      // Dynamic rail weight calculation based on rail section (in tonnes per metre)
      const getRailWeightPerMeter = (railSection) => {
        if (!railSection) return 0.06021; // Default fallback (60.21 kg/m = 0.06021 tonnes/m)
        switch (railSection.trim().toUpperCase()) {
          case "60E1":
            return 0.06021;  // 60.21 kg/m = 0.06021 tonnes/m
          case "60E1A1":
            return 0.07297;  // 72.97 kg/m = 0.07297 tonnes/m
          case "UIC60":
            return 0.06034;  // 60.34 kg/m = 0.06034 tonnes/m
          case "136RE":
            return 0.067364; // 67.364 kg/m = 0.067364 tonnes/m
          case "52E1":
            return 0.05151;  // 51.51 kg/m = 0.05151 tonnes/m
          case "IRS52":
            return 0.05189;  // 51.89 kg/m = 0.05189 tonnes/m
          default:
            return 0.06021;  // Default for unknown sections
        }
      };

      // Get the most common rail section from the data, or use default
      const railSections = rawData.map(item => item.railSection).filter(Boolean);
      const mostCommonRailSection = railSections.length > 0
        ? railSections.reduce((a, b, i, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          )
        : null;

      const railWeightPerMeter = getRailWeightPerMeter(mostCommonRailSection);
      const totalAcceptedTonnes = totalAcceptedLength * railWeightPerMeter; // Direct calculation in tonnes
      const totalRejectedTonnes = totalRejectedLength * railWeightPerMeter; // Direct calculation in tonnes
      const totalInspectedTonnes = totalAcceptedTonnes + totalRejectedTonnes;

      // Log the rail weight being used for transparency
      console.log(`Using rail weight: ${railWeightPerMeter} tonnes/m for rail section: ${mostCommonRailSection || 'Default'}`);

      // Calculate tonnage for each class using correct formulas (direct multiplication)
      const tonnesAcceptedA = acceptedLengthA * railWeightPerMeter;
      const tonnesAcceptedAPlus01 = acceptedLengthAPlus01 * railWeightPerMeter;

      const compiled = [
        {
          key: 'rails_inspected',
          description: 'Rails Inspected',
          tonnes: totalInspectedTonnes.toFixed(3)
        },
        {
          key: 'rails_accepted_a',
          description: 'Rails Accepted (A)',
          tonnes: tonnesAcceptedA.toFixed(3)
        },
        {
          key: 'rails_accepted_a_plus_01',
          description: 'Rails Accepted (A + 0.1)',
          tonnes: tonnesAcceptedAPlus01.toFixed(3)
        },
        {
          key: 'rails_accepted_total',
          description: 'Rails Accepted (Total)',
          tonnes: totalAcceptedTonnes.toFixed(3)
        },
        {
          key: 'rails_rejected',
          description: 'Rails Rejected',
          tonnes: totalRejectedTonnes.toFixed(3)
        }
      ];

      setAcceptanceData(acceptance);
      setLengthWiseAcceptanceData(lengthWiseAcceptance);
      setLengthWiseAcceptanceColumns(dynamicColumns);
      setRejectionData(rejection);
      setCompiledData(compiled);
      setDefectAnalysisData(defectAnalysis);
      setDefectAnalysisColumns(defectAnalysisColumns);
      setRailwiseData(railwise);


    } catch (error) {
      // Handle error silently or show user-friendly message
    } finally {
      setLoading(false);
    }
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viGeneralInfo.date, viGeneralInfo.shift, viGeneralInfo.mill, formData.lineNumber, formData.summary, viGeneralInfo.dutyId, token]);

  // Initial data fetch and when filters change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Extract available lengths and filter railwise data when data or filters change
  useEffect(() => {
    if (railwiseData && railwiseData.length > 0) {
      // Extract available lengths for dropdowns
      const lengths = extractAvailableLengths(railwiseData);
      setAvailableLengths(lengths);

      // Apply length-based filtering
      const filtered = filterRailwiseDataByLength(railwiseData, railwiseLengthFilters);
      setFilteredRailwiseData(filtered);


    }
  }, [railwiseData, railwiseLengthFilters]);

  return (
    <FormContainer>
        <SubHeader title="Visual Inspection - Shift Summary" link="/visual/home" />
        <GeneralInfo data={viGeneralInfo} />

        <FormBody initialValues={formData}>
            <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem
                      label='Line Number'
                      name='lineNumber'
                      formField='lineNumber'
                      dropdownArray={[
                        { key: '', value: 'All Lines' },
                        ...lineNumberList.filter(item => item.key !== 'All lines')
                      ]}
                      valueField={'key'}
                      visibleField={'value'}
                      onChange={handleChange}
                      className='w-full'
                      value={formData.lineNumber}
                    />
                </div>

                <div className='flex items-center gap-x-2'>
                    <FormDropdownItem
                      label='Summary'
                      name='summary'
                      formField='summary'
                      dropdownArray={summaryList}
                      valueField={'key'}
                      visibleField={'value'}
                      onChange={handleChange}
                      className='w-full'
                      value={formData.summary}
                    />
                </div>
            </div>
        </FormBody>



        {formData.summary === 'Acceptance Summary' && (
            <Spin spinning={loading}>
                <Divider>
                  Length Wise Acceptance Summary
                  {viGeneralInfo.date && viGeneralInfo.shift ? ` - ${viGeneralInfo.date} Shift ${viGeneralInfo.shift}` : ''}
                  {viGeneralInfo.mill ? ` - ${viGeneralInfo.mill}` : ''}
                  {formData.lineNumber && formData.lineNumber !== '' ? ` - ${formData.lineNumber}` : ' - All Lines'}
                </Divider>

                <Table
                    dataSource={lengthWiseAcceptanceData}
                    columns={lengthWiseAcceptanceColumns}
                    scroll={{ x: true }}
                    bordered
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20", "50"],
                    }}
                    locale={{
                      emptyText: loading ? "Loading..." : "No acceptance data available"
                    }}
                />

                <Divider>
                  Rejection Summary
                </Divider>

                <Table
                    dataSource={rejectionData}
                    columns={rejectionColumns}
                    scroll={{ x: true }}
                    bordered
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20"],
                    }}
                    locale={{
                      emptyText: loading ? "Loading..." : "No rejection data available"
                    }}
                />

                <Divider>
                  Compiled Summary
                </Divider>

                <Table
                    dataSource={compiledData}
                    columns={compiledColumns}
                    scroll={{ x: true }}
                    bordered
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20"],
                    }}
                    locale={{
                      emptyText: loading ? "Loading..." : "No compiled data available"
                    }}
                />

                <div className='flex justify-center mt-4'>
                    <Btn onClick={handleClick} className='w-[25%]'>Go Home</Btn>
                </div>
            </Spin>
        )}

        {formData.summary === 'Defect Analysis Summary' && (
            <Spin spinning={loading}>
                <Divider>
                  Defect Analysis Summary
                  {viGeneralInfo.date && viGeneralInfo.shift ? ` - ${viGeneralInfo.date} Shift ${viGeneralInfo.shift}` : ''}
                  {viGeneralInfo.mill ? ` - ${viGeneralInfo.mill}` : ''}
                  {formData.lineNumber ? ` - ${formData.lineNumber}` : ' - All Lines'}
                </Divider>

                <Table
                    dataSource={defectAnalysisData}
                    columns={defectAnalysisColumns}
                    bordered
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      pageSizeOptions: ["5", "10", "20"],
                    }}
                    locale={{
                      emptyText: loading ? "Loading..." : "No defect analysis data available"
                    }}
                />

                <div className='flex justify-center mt-4'>
                    <Btn htmlType='submit' onClick={handleClick} className='w-[25%]'>Go Home</Btn>
                </div>
            </Spin>
        )}

        {formData.summary === 'Inspected Railwise Summary' && (
            <Spin spinning={loading}>
                <Divider>
                  Inspected Railwise Summary
                  {viGeneralInfo.date && viGeneralInfo.shift ? ` - ${viGeneralInfo.date} Shift ${viGeneralInfo.shift}` : ''}
                  {viGeneralInfo.mill ? ` - ${viGeneralInfo.mill}` : ''}
                  {formData.lineNumber ? ` - ${formData.lineNumber}` : ' - All Lines'}
                </Divider>

                {/* Rail Wise Data Section with Filters in Column Headers */}
                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                  <h3 style={{ margin: '16px 0 16px 0' }}>Rail Wise Data</h3>
                </div>

                <Table
                    dataSource={filteredRailwiseData}
                    columns={getRailwiseColumns()}
                    scroll={{ x: true }}
                    bordered
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                    }}
                    locale={{
                      emptyText: loading ? "Loading..." : "No railwise data available"
                    }}
                />

                <div className='flex justify-center mt-4'>
                    <Btn htmlType='submit' onClick={handleClick} className='w-[25%]'>Go Home</Btn>
                </div>
            </Spin>
        )}
    </FormContainer>
  )
}

export default VIShiftSummary