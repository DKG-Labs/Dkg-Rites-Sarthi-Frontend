/* eslint-disable */
﻿import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import GeneralInfo from '../../../../../components/DKG_GeneralInfo'
import data from '../../../../../utils/frontSharedData/Testing/Testing.json'
import FormBody from '../../../../../components/DKG_FormBody'
import { FilterFilled, ReloadOutlined } from '@ant-design/icons';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem'
import { Checkbox, Divider, Select, Table, Form, Button, Space, Tooltip } from 'antd'
import Search from "../../../../../components/DKG_Search"
import Btn from '../../../../../components/DKG_Btn';
import { useNavigate } from "react-router-dom";
import { apiCall } from '../../../../../utils/CommonFunctions'
import { useSelector } from 'react-redux'
import { testStatusDropdown } from '../../../../../utils/Constants'
import ChemicalTest from './ChemicalTest'
import HardnessTest from './HardnessTest';

const { pendingTestSamplesData: sampleData, testingGeneralInfo, railGradeList, testCategoryList, millList } = data;


const checkBoxItems = [
    { "key": 1, "value": "Regular" },
    { "key": 2, "value": "USB" },
    { "key": 3, "value": "LOB" }
]

const checkBoxItemsSec = [
    { "key": 1, "value": "Accepting Test" },
    { "key": 2, "value": "Retest" }
]

const PendingTestSamples = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        mill: '', railGrade: '', testCategory: ''
    })

    // Helper function to convert integer to Roman numeral (for frontend display)
    const convertIntegerToRoman = (intValue) => {
        if (typeof intValue === 'string' && intValue.match(/^[IVX]+$/i)) {
            return intValue.toUpperCase(); // Already Roman numeral
        }

        const intToRoman = {
            1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
            6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
        };

        const num = parseInt(intValue);
        return intToRoman[num] || intValue; // Return original if not in range
    };
    const [tableData, setTableData] = useState([])
    const [completedTests, setCompletedTests] = useState({}) // Track completed tests by sample
    const [checkedValues, setCheckedValues] = useState([])
    const [checkedValuesSec, setCheckedValuesSec] = useState([])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)

    const {token} = useSelector(state => state.auth)

    const handleChange = (fieldName, value) => {
        setFormData(prev => {
          return {
            ...prev,
            [fieldName]: value
          }
        })
    }

    const handleClick = () => {
        navigate('/sms/testing/home')
    };

    const saveRecord = () => {
        
    }


const pendingTestSamplesColumns = (currentPage, pageSize, completedTests, navigate, token) => [
    {
        title: "S. No.",
        dataIndex: "serialNumber",
        fixed: "left",
        render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
        title: "Heat No.",
        dataIndex: "heatNo",
        key: "heatNo",
        fixed: "left",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "Strand",
        dataIndex: "strand",
        render: (value) => {
            if (!value || !value.toString().trim()) {
                return <span className="text-gray-500">N/A</span>;
            }
            return convertIntegerToRoman(value);
        }
    },
    {
        title: "Mill",
        dataIndex: "mill",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "Grade",
        dataIndex: "railGrade",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "Sample Type",
        dataIndex: "sampleType",
        key: "sampleType",
        align: "center",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "Lot",
        dataIndex: "sampleLot",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "BSP Sample ID",
        dataIndex: "sampleId",
        render: (value) => (value && value.toString().trim()) ? value : <span className="text-gray-500">N/A</span>
    },
    {
        title: "App Sample Identification",
        dataIndex: "sampleIdentification",
        key: "sampleIdentification",
        align: "center",
        render: () => "N/A"
    },
    {
        title: "Test",
        dataIndex: "testsMarked",
        key: "test",
        align: "center",
        render: (testsMarked) => {
            if (!testsMarked || !testsMarked.toString().trim()) {
                return <span className="text-gray-500">N/A</span>;
            }
            return testsMarked;
        }
    },
    {
        title: "Action",
        key: "action",
        align: "center",
        render: (_, record) => {
            console.log("Record data:", record);
            console.log("Tests marked:", record.testsMarked);
            const tests = record.testsMarked?.split(',').map(test => test.trim()).filter(test => test && test.length > 0) || [];
            console.log("Parsed tests:", tests);

            // If no tests are available, display N/A
            if (!tests || tests.length === 0 || !record.testsMarked || !record.testsMarked.toString().trim()) {
                return (
                    <div className='flex justify-center items-center text-gray-500'>
                        N/A
                    </div>
                );
            }

            // Get completed tests for this sample
            const sampleKey = `${record.heatNo}-${record.strand}-${record.sampleId}`;
            const sampleCompletedTests = completedTests[sampleKey] || {};

            console.log("Sample key:", sampleKey);
            console.log("Sample completed tests:", sampleCompletedTests);
            console.log("All completed tests:", completedTests);

            return (
                <div className='flex flex-col gap-2'>
                    {tests?.map((test, index) => {
                        let path = '';
                        let buttonText = '';

                        // Clean up the test name for better matching
                        const cleanTest = test.trim();
                        // Keep alphanumeric characters (including numbers) for test types like O2, N2
                        const cleanTestUpper = cleanTest.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        console.log("Processing test:", cleanTest, "-> cleanTestUpper:", cleanTestUpper);

                        // Check if this test is completed
                        const isCompleted = sampleCompletedTests[cleanTestUpper] || false;
                        console.log("🔍 Completion check for", cleanTestUpper, ":", isCompleted);
                        console.log("🗂️ Available completion keys:", Object.keys(sampleCompletedTests));
                        console.log("🎯 Sample completed tests object:", sampleCompletedTests);

                        // Comprehensive test name mapping with case-insensitive matching
                        const lowerTest = cleanTest.toLowerCase();

                        if (lowerTest.includes('chemical')) {
                            path = '/testing/chemical';
                            buttonText = 'Test for Chemical';
                        } else if (lowerTest.includes('n2') || lowerTest.includes('nitrogen')) {
                            path = '/testing/n2';
                            buttonText = 'Test for N2';
                        } else if (lowerTest.includes('fwt')) {
                            path = '/testing/fwt';
                            buttonText = `Test for ${cleanTest}`;
                        } else if (lowerTest.includes('mechanical')) {
                            path = '/testing/mechanical';
                            buttonText = 'Test for Mechanical';
                        } else if ((lowerTest.includes('sp') && !lowerTest.includes('bsp')) || lowerTest === 'sp') {
                            path = '/testing/sp';
                            buttonText = 'Test for SP';
                        } else if (lowerTest.includes('ir') || lowerTest.includes('inclusion rating')) {
                            path = '/testing/ir';
                            buttonText = 'Test for IR';
                        } else if (lowerTest.includes('o2') || lowerTest.includes('oxygen')) {
                            path = '/testing/o2';
                            buttonText = 'Test for O2';
                        } else if (lowerTest.includes('tensile foot') || lowerTest.includes('tensilef') || lowerTest.includes('tensile_foot')) {
                            path = '/testing/tensilefoot';
                            buttonText = 'Test for Tensile Foot';
                        } else if (lowerTest.includes('micro') || lowerTest.includes('microstructure')) {
                            path = '/testing/micro';
                            buttonText = 'Test for Micro';
                        } else if (lowerTest.includes('decarb') || lowerTest.includes('decarburization') || lowerTest.includes('deca')) {
                            path = '/testing/decarb';
                            buttonText = 'Test for Decarb';
                        } else if (lowerTest.includes('rsh') || lowerTest.includes('residual stress')) {
                            path = '/testing/rsh';
                            buttonText = 'Test for RSH';
                        } else if (lowerTest.includes('ph') || lowerTest.includes('phosphorus')) {
                            path = '/testing/ph';
                            buttonText = 'Test for PH';
                        } else if (lowerTest.includes('tensile') && !lowerTest.includes('foot')) {
                            path = '/testing/tensile';
                            buttonText = 'Test for Tensile';
                        } else if (lowerTest.includes('hardness') || lowerTest.includes('hb')) {
                            path = '/testing/hardness';
                            buttonText = 'Test for Hardness';
                        } else if (lowerTest.includes('sulphur') || lowerTest.includes('sulfur') || lowerTest.includes('s ')) {
                            path = '/testing/chemical';
                            buttonText = 'Test for Sulphur';
                        } else if (lowerTest.includes('macro') || lowerTest.includes('macrostructure')) {
                            path = '/testing/macro';
                            buttonText = 'Test for Macro';
                        } else {
                            console.warn("Unmatched test name:", cleanTest);
                            // Still create a button with generic mapping
                            path = '/testing/chemical'; // Default fallback
                            buttonText = `Test for ${cleanTest}`;
                        }

                        // Function to load completed test data for editing
                        const loadCompletedTestData = async () => {
                            try {
                                const normalizedTestType = normalizeTestType(cleanTest);
                                console.log("🔍 Loading completed test data for:", {
                                    heatNumber: record.heatNo,
                                    strandNumber: record.strand,
                                    sampleId: record.sampleId,
                                    originalTestType: cleanTest,
                                    normalizedTestType: normalizedTestType
                                });

                                const apiUrl = `/testing/getCompletedTest?heatNumber=${record.heatNo}&strandNumber=${record.strand}&sampleId=${record.sampleId}&testType=${normalizedTestType}`;
                                console.log("🌐 API URL:", apiUrl);

                                const { data } = await apiCall("GET", apiUrl, token);
                                console.log("✅ Completed test data API response:", data);

                                if (data && data.responseData) {
                                    console.log("📋 Completed test data found:", data.responseData);
                                    return data.responseData;
                                } else {
                                    console.warn("⚠️ No completed test data found in response");
                                    return null;
                                }
                            } catch (error) {
                                console.error("❌ Error loading completed test data:", error);
                                console.error("Error details:", error.response?.data || error.message);
                                return null;
                            }
                        };

                        return (
                            <Button
                                key={index}
                                type={isCompleted ? "default" : "primary"}
                                style={{
                                    backgroundColor: isCompleted ? "#52c41a" : undefined,
                                    borderColor: isCompleted ? "#52c41a" : undefined,
                                    color: isCompleted ? "white" : undefined
                                }}
                                onClick={async () => {
                                    if (isCompleted) {
                                        console.log("🟢 Clicked on completed test button:", {
                                            testName: cleanTest,
                                            testType: cleanTestUpper,
                                            path: path
                                        });

                                        // Load completed test data and navigate to edit mode
                                        const completedTestData = await loadCompletedTestData();

                                        console.log("🚀 Navigating to edit mode with data:", {
                                            path: path,
                                            completedTestData: completedTestData,
                                            navigationState: {
                                                heatNo: record.heatNo,
                                                strand: record.strand,
                                                sampleId: record.sampleId,
                                                isEditMode: true
                                            }
                                        });

                                        navigate(path, {
                                            state: {
                                                heatNo: record.heatNo,
                                                strand: record.strand,
                                                sampleId: record.sampleId,
                                                sampleLot: record.sampleLot,
                                                sampleType: record.sampleType,
                                                testName: cleanTest,
                                                testType: cleanTestUpper,
                                                isEditMode: true,
                                                completedTestData: completedTestData
                                            }
                                        });
                                    } else {
                                        console.log("🔵 Clicked on pending test, navigating to new test mode...");
                                        // Navigate to new test mode
                                        navigate(path, {
                                            state: {
                                                heatNo: record.heatNo,
                                                strand: record.strand,
                                                sampleId: record.sampleId,
                                                sampleLot: record.sampleLot,
                                                sampleType: record.sampleType,
                                                testName: cleanTest,
                                                testType: cleanTestUpper,
                                                isEditMode: false
                                            }
                                        });
                                    }
                                }}
                            >
                                {isCompleted ? `Edit ${cleanTest}` : buttonText}
                            </Button>
                        );
                    })}
                </div>
            );
        }
    }
];

    const testingGeneralInfo = useSelector((state) => state.testingDuty);

    // Function to normalize test types to match database storage
    const normalizeTestType = (testName) => {
        const upperTest = testName.toUpperCase();

        // Handle FWT variations - each FWT type is stored separately in database
        if (upperTest.includes('FWT')) {
            if (upperTest.includes('FWT (ST) - SR') || upperTest.includes('FWT(ST)-SR')) {
                return 'FWT_ST_SR';
            } else if (upperTest.includes('FWT (HS)') || upperTest.includes('FWT(HS)')) {
                return 'FWT_HS';
            } else if (upperTest.includes('FWT (ST)') || upperTest.includes('FWT(ST)')) {
                return 'FWT_ST';
            }
            // Default to FWT for any other FWT variant
            return 'FWT';
        }

        // Handle TENSILE FOOT - stored as 'TENSILE_FOOT' in database
        if (upperTest.includes('TENSILE FOOT') || upperTest.includes('TENSILE_FOOT') || upperTest.includes('TENSILEF')) {
            return 'TENSILE_FOOT';
        }

        // Handle TENSILE (but not TENSILE FOOT) - stored as 'TENSILE' in database
        if (upperTest.includes('TENSILE') && !upperTest.includes('FOOT')) {
            return 'TENSILE';
        }

        // Handle MECHANICAL - stored as 'MECHANICAL' in database
        if (upperTest.includes('MECHANICAL')) {
            return 'MECHANICAL';
        }

        // Handle MACRO - stored as 'MACRO' in database (separate from MECHANICAL)
        if (upperTest.includes('MACRO')) {
            return 'MACRO';
        }

        // Handle MICRO variations - stored as 'MICRO' in database
        if (upperTest.includes('MICROSTRUCTURE') || upperTest.includes('MICRO')) {
            return 'MICRO';
        }

        // Handle CHEMICAL variations - stored as 'CHEMICAL' in database
        if (upperTest.includes('CHEMICAL') || upperTest.includes('CHEMIC')) {
            return 'CHEMICAL';
        }

        // Handle HARDNESS - stored as 'HARDNESS' in database
        if (upperTest.includes('HARDNESS') || upperTest.includes('HARD')) {
            return 'HARDNESS';
        }

        // Handle DECARB variations - stored as 'DECARB' in database
        if (upperTest.includes('DECARB')) {
            return 'DECARB';
        }

        // For other test types, use the cleaned version
        return testName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    };

    // Function to check if a specific test is completed
    const checkCompletedTest = async (heatNumber, strandNumber, sampleId, testType) => {
        try {
            const normalizedTestType = normalizeTestType(testType);
            console.log("🔍 Checking completion for:", {
                heatNumber,
                strandNumber,
                sampleId,
                originalTestType: testType,
                normalizedTestType
            });

            const { data } = await apiCall("GET", `/testing/isTestCompleted?heatNumber=${heatNumber}&strandNumber=${strandNumber}&sampleId=${sampleId}&testType=${normalizedTestType}`, token);
            console.log("📡 API response for completion check:", data);
            console.log("🔍 Raw API response data:", JSON.stringify(data, null, 2));

            const isCompleted = data.responseData === true;
            console.log(`✅ Test ${testType} → ${normalizedTestType} completed status:`, isCompleted);

            if (testType.toUpperCase().includes('PH')) {
                console.log("🧪 PH TEST DEBUG:");
                console.log("   Original testType:", testType);
                console.log("   Normalized testType:", normalizedTestType);
                console.log("   API response:", data);
                console.log("   Is completed:", isCompleted);
            }

            return isCompleted;
        } catch (error) {
            console.error("❌ Error checking completed test:", error);
            return false;
        }
    };

    // Function to check completed tests for all samples (parallel processing for better performance)
    const checkAllCompletedTests = async (samples) => {
        const completedTestsMap = {};

        // Create all API call promises first
        const apiPromises = [];
        const promiseMetadata = [];

        for (const sample of samples) {
            const sampleKey = `${sample.heatNo}-${sample.strand}-${sample.sampleId}`;
            completedTestsMap[sampleKey] = {};

            if (sample.testsMarked) {
                const tests = sample.testsMarked.split(',').map(test => test.trim()).filter(test => test && test.length > 0);

                for (const test of tests) {
                    const cleanTest = test.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                    // Create promise and store metadata
                    const promise = checkCompletedTest(sample.heatNo, sample.strand, sample.sampleId, test);
                    apiPromises.push(promise);
                    promiseMetadata.push({ sampleKey, cleanTest });
                }
            }
        }

        // Execute all API calls in parallel
        console.log(`Making ${apiPromises.length} completion check API calls in parallel...`);
        const results = await Promise.all(apiPromises);

        // Map results back to the completedTestsMap
        console.log("📊 Processing completion check results:");
        results.forEach((isCompleted, index) => {
            const { sampleKey, cleanTest } = promiseMetadata[index];
            completedTestsMap[sampleKey][cleanTest] = isCompleted;
            console.log(`   ${sampleKey} → ${cleanTest}: ${isCompleted ? '✅ COMPLETED' : '❌ PENDING'}`);
        });

        console.log("🗺️ Final completed tests map:", completedTestsMap);
        return completedTestsMap;
    };

    const populateData = async ()  => {
        try{
            const {data}  = await apiCall("GET", "/testing/getPendingTestDtls", token)
            console.log("Pending Test Samples API Response:", data.responseData);
            const samples = data.responseData || [];
            setTableData(samples);

            // Check completed tests for all samples
            const completedTestsMap = await checkAllCompletedTests(samples);
            setCompletedTests(completedTestsMap);
        }
        catch(error){
            console.error("Error fetching pending test samples:", error);
        }
    }

    const [form] = Form.useForm();

    useEffect(() =>{
        populateData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

  return (
    <FormContainer>
        <SubHeader title="Pending Test Samples" link="/testing/home" />
        <GeneralInfo data={testingGeneralInfo} />

        {/* <FormBody initialValues={formData}>
            <div className='grid grid-cols-1 md:grid-cols-3 sm:grid-cols-3 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Rail Grade' name='railGrade' dropdownArray={railGradeList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex items-center gap-x-2'>
                    <FilterFilled />         
                    <FormDropdownItem label ='Test Category' name='testCategory' dropdownArray={testCategoryList} valueField='key' visibleField='value' onChange = {handleChange} className='w-full' />
                </div>

                <div className='flex items-center gap-x-2'>
                    <Checkbox.Group
                        options={checkBoxItems.map(item => ({key: item.key, label: item.value, value: item.key }))}
                        value={checkedValues}
                        onChange={(checkedValues) => setCheckedValues(checkedValues)}
                        className='mb-6 sm:mb-0'
                    />
                </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 sm:grid-cols-3 gap-x-4'>
                <div className='flex items-center gap-x-2'>
                    <FilterFilled />
                    <FormDropdownItem label='Mill' name='mill' dropdownArray={millList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
                </div>

                <div className='flex justify-center items-center mb-6 sm:mb-0'>
                    <Search placeholder='Search by S. No.' />
                </div>

                <div className='flex items-center gap-x-2'>
                    <Checkbox.Group
                        options={checkBoxItemsSec.map(item => ({key: item.key, label: item.value, value: item.key }))}
                        value={checkedValuesSec}
                        onChange={(checkedValuesSec) => setCheckedValuesSec(checkedValuesSec)}
                        className='mb-6 sm:mb-0'
                    />
                </div>
            </div>

            <Divider className='mt-0 mb-6' /> */}

            <Table
                dataSource={tableData}
                columns={pendingTestSamplesColumns(currentPage, pageSize, completedTests, navigate, token)}
                scroll={{ x: true }}
                bordered
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "10", "20"],
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        if (size !== pageSize) {
                            setPageSize(size);
                            setCurrentPage(1); // Reset to first page when page size changes
                        }
                    },
                    onShowSizeChange: (current, size) => {
                        setPageSize(size);
                        setCurrentPage(1); // Reset to first page when page size changes
                    },
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                }}
            />

            <div className='flex justify-center'>
                <Btn onClick={handleClick}>OK</Btn>
            </div>
        {/* </FormBody> */}

    </FormContainer>
  )
}

export default PendingTestSamples

