/* eslint-disable */
import { Button, Input, Radio, Space, Table, Form, Spin, Alert, message } from 'antd'
import { useRef, useState, useEffect } from 'react'
import CustomDatePicker from '../../../components/DKG_CustomDatePicker'
import Btn from '../../../components/DKG_Btn'
import {SearchOutlined} from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import FormDropdownItem from '../../../components/DKG_FormDropdownItem'
import info from '../../../utils/frontSharedData/VisualInspection/VI.json'
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { apiCall } from '../../../utils/CommonFunctions';
import {
  setSearchCriteria,
  setDashboardData,
  setPaginationData,
  setLoading,
  setError,
  clearError,
  resetDashboard
} from '../../../store/slice/aiDashboardSlice';

const { shiftList } = info;

const AiSystem = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state with safety check
  const aiDashboardState = useSelector((state) => state.aiDashboard);
  const {
    searchCriteria = {},
    dashboardData = { allData: [], paginatedData: [] },
    pagination = { currentPage: 1, pageSize: 50, totalElements: 0 },
    loading = false,
    error = null,
    hasData = false
  } = aiDashboardState || {};

  // Local state for form inputs (initialize from Redux)
  const [timePeriod, setTimePeriod] = useState(searchCriteria.timePeriod || 'shift')
  const [startDate, setStartDate] = useState(searchCriteria.startDate || '')
  const [weekStartDate, setWeekStartDate] = useState(searchCriteria.weekStartDate || '')
  const [weekEndDate, setWeekEndDate] = useState(searchCriteria.weekEndDate || '')
  const [inspectionShift, setInspectionShift] = useState(searchCriteria.inspectionShift || '')
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [form] = Form.useForm();
  const { token } = useSelector((state) => state.auth);

  // Effect to restore form state from Redux when component mounts
  useEffect(() => {
    if (hasData) {
      // Restore form values from Redux state
      setTimePeriod(searchCriteria.timePeriod || 'shift');
      setStartDate(searchCriteria.startDate || '');
      setWeekStartDate(searchCriteria.weekStartDate || '');
      setWeekEndDate(searchCriteria.weekEndDate || '');
      setInspectionShift(searchCriteria.inspectionShift || '');

      // Update tabs with persisted data
      setTabs([
        {
          title: ["Total", "Rail IDs"],
          value: dashboardData.totalRailIds?.toString() || "0",
        },
        {
          title: ["Avg. Precision", "Surface Defect"],
          value: dashboardData.avgPrecisionSurfaceDefect || "0.00",
        },
        {
          title: ["Avg. Recall", "Surface Defect"],
          value: dashboardData.avgRecallSurfaceDefect || "0.00",
        },
        {
          title: ["Avg. Precision", "Dim. Variation"],
          value: dashboardData.avgPrecisionDimensionalVariation || "0.00",
        },
        {
          title: ["Avg. Recall", "Dim. Variation"],
          value: dashboardData.avgRecallDimensionalVariation || "0.00",
        },
        {
          title: ["OCR Accuracy", "Heat Number Match"],
          value: dashboardData.ocrAccuracy || "0%",
        },
      ]);
    }
  }, [hasData, searchCriteria, dashboardData]);
  const [tabs, setTabs] = useState([
    {
      title: ["Total", "Rail IDs"],
      value: "10",
    },
    {
      title: ["Avg. Precision", "Surface Defect"],
      value: "0.91",
    },
    {
      title: ["Avg. Recall", "Surface Defect"],
      value: "0.87",
    },
    {
      title: ["Avg. Precision", "Dim. Variation"],
      value: "0.54",
    },
    {
      title: ["Avg. Recall", "Dim. Variation"],
      value: "0.45",
    },
    {
      title: ["OCR Accuracy", "Heat Numbers"],
      value: "93%",
    },
  ]);

  const [abortController, setAbortController] = useState(null);

  // Function to handle pagination changes using Redux
  const handlePaginationChange = (page, size) => {
    if (size && size !== pagination.pageSize) {
      // Page size changed, reset to first page
      dispatch(setPaginationData({ currentPage: 1, pageSize: size }));
    } else {
      // Just page changed
      dispatch(setPaginationData({ currentPage: page }));
    }
  };

  // Function to handle reset button
  const handleReset = () => {
    dispatch(resetDashboard());
    // Reset local form state
    setTimePeriod('shift');
    setStartDate('');
    setWeekStartDate('');
    setWeekEndDate('');
    setInspectionShift('');
    form.resetFields();
  };

  const handleShiftChange = (fieldName, value) => {
    if (fieldName === 'startDate') {
      setStartDate(value)
    } else {
      setInspectionShift(value)
    }
  }

  console.log(inspectionShift)

  const handleRangeChange = (fieldName, value) => {
    if (fieldName === 'weekStartDate') {
      setWeekStartDate(value);
    } else if (fieldName === 'weekEndDate') {
      setWeekEndDate(value);
    }
  }





  const searchInput = useRef(null);
  
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleSearchReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: 'block',
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleSearchReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? '#1677ff' : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: '#ffc069',
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: 'Rail ID',
      dataIndex: 'railId',
      key: 'railId',
      align: 'center',
      ...getColumnSearchProps('railId'),
      render: (railId) => (
        <a onClick={() => navigate(`/railDetails/${railId}`)}>{railId}</a>
      )
    },
    {
      title: 'Surface Defect Detection',
      align: 'center',
      children: [
        {
          title: 'Precision',
          dataIndex: ['surfaceDefectDetection', 'precision'],
          key: 'surfacePrecision',
          align: 'center',
        },
        {
          title: 'Recall',
          dataIndex: ['surfaceDefectDetection', 'recall'],
          key: 'surfaceRecall',
          align: 'center',
        },
      ],
    },
    {
      title: 'Dimensional Variation Detection',
      align: 'center',
      children: [
        {
          title: 'Precision',
          dataIndex: ['dimensionalVariationDetection', 'precision'],
          key: 'dimensionalPrecision',
          align: 'center',
        },
        {
          title: 'Recall',
          dataIndex: ['dimensionalVariationDetection', 'recall'],
          key: 'dimensionalRecall',
          align: 'center',
        },
      ],
    },
    {
      title: 'OCR Accuracy',
      dataIndex: 'ocr',
      key: 'ocr',
      align: 'center',
      render: (value) => (
        <span style={{
          color: value === 'True' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {value}
        </span>
      ),
    },
  ];

  const tabColorList = [
    "#004B4D", // Deep Teal
    "#2E1A47", // Midnight Purple
    "#2B3A70", // Slate Blue
    "#3B3C36", // Dark Olive Green
    "#4A0C0C", // Crimson Red
    "#1E1A78", // Indigo Night
    "#003B5C", // Deep Sea Blue
    "#4A5A3D"  // Moss Green
  ];



  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <div key={index} className='p-4 border shadow-lg rounded-lg' 
        style={{ backgroundColor: tabColorList[index] }}
      >
        <div className='!text-4xl font-bold text-white text-center'>{tab.value}</div> <br />
        <div className='text-white text-center'>{tab.title[0]}</div>
        <div className='text-white text-center !text-2xl'>{tab.title[1]}</div>
      </div>
    ));
  };

  // Function to cancel ongoing request
  const cancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
      message.info('Request cancelled');
    }
  };

  const populateData = async () => {
    // Cancel any ongoing request
    if (abortController) {
      abortController.abort();
    }

    // Validate required fields
    if (timePeriod === 'shift' && (!startDate || !inspectionShift)) {
      message.error('Please select both start date and shift for shift-based filtering');
      return;
    }
    if (timePeriod === 'dateRange' && (!weekStartDate || !weekEndDate)) {
      message.error('Please select both From and To dates for date range filtering');
      return;
    }

    let payload;
    if (timePeriod === 'shift') {
      payload = {
        startDate,
        endDate: null,
        shift: inspectionShift
      };
    } else {
      payload = {
        startDate: weekStartDate,
        endDate: weekEndDate,
        shift: null
      };
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);
    dispatch(setLoading(true));
    dispatch(clearError());

    // Set a timeout for the request (30 seconds for shift/annual, 15 seconds for weekly/monthly)
    const timeoutDuration = (timePeriod === 'shift') ? 30000 : 15000;
    const timeoutId = setTimeout(() => {
      controller.abort();
      setError(`Request timed out after ${timeoutDuration / 1000} seconds. Please try with a smaller date range or contact support.`);
      setLoading(false);
    }, timeoutDuration);

    try {
      // Use the new AI accuracy metrics API with abort signal
      const response = await apiCall("POST", "/dashboard/getAiAccuracyMetrics", token, payload, controller.signal);
      clearTimeout(timeoutId);

      if (controller.signal.aborted) {
        return; // Request was cancelled
      }

      const aiData = response.data?.responseData || {};

      // Check if we got valid data
      if (!aiData || Object.keys(aiData).length === 0) {
        setError('No data found for the selected time period. Please try a different date range.');
        return;
      }

      // Map the rail details to table data format
      const railDetails = aiData.railDetails || [];
      const tableData = railDetails.map((rail, index) => ({
        key: index + 1,
        railId: rail.railId,
        surfaceDefectDetection: {
          precision: rail.surfaceDefectDetection?.precision || "N/A",
          recall: rail.surfaceDefectDetection?.recall || "N/A"
        },
        dimensionalVariationDetection: {
          precision: rail.dimensionalVariationDetection?.precision || "N/A",
          recall: rail.dimensionalVariationDetection?.recall || "N/A"
        },
        ocr: rail.ocr || "False", // OCR shows True/False based on heat number comparison
      }));

      // Store search criteria and data in Redux
      dispatch(setSearchCriteria({
        timePeriod,
        startDate,
        weekStartDate,
        weekEndDate,
        inspectionShift
      }));

      // Store dashboard data in Redux (this will handle pagination automatically)
      dispatch(setDashboardData({
        allData: tableData,
        totalRailIds: aiData.totalRailIds || 0,
        avgPrecisionSurfaceDefect: aiData.avgPrecisionSurfaceDefect || "0.00",
        avgRecallSurfaceDefect: aiData.avgRecallSurfaceDefect || "0.00",
        avgPrecisionDimensionalVariation: aiData.avgPrecisionDimensionalVariation || "0.00",
        avgRecallDimensionalVariation: aiData.avgRecallDimensionalVariation || "0.00",
        ocrAccuracy: aiData.ocrAccuracy || "0%"
      }));

      // Update metrics cards with real data from API
      setTabs([
        {
          title: ["Total", "Rail IDs"],
          value: aiData.totalRailIds?.toString() || "0",
        },
        {
          title: ["Avg. Precision", "Surface Defect"],
          value: aiData.avgPrecisionSurfaceDefect || "0.00",
        },
        {
          title: ["Avg. Recall", "Surface Defect"],
          value: aiData.avgRecallSurfaceDefect || "0.00",
        },
        {
          title: ["Avg. Precision", "Dim. Variation"],
          value: aiData.avgPrecisionDimensionalVariation || "0.00",
        },
        {
          title: ["Avg. Recall", "Dim. Variation"],
          value: aiData.avgRecallDimensionalVariation || "0.00",
        },
        {
          title: ["OCR Accuracy", "Heat Number Match"],
          value: aiData.ocrAccuracy || "0%",
        },
      ]);

      // Show success message with data count
      message.success(`Successfully loaded data for ${railDetails.length} rail(s)`);

    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error fetching AI accuracy metrics:", error);

      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred while fetching data.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 500) {
          errorMessage = 'Server error occurred. The query might be too complex or the database is overloaded. Please try with a smaller date range.';
        } else if (status === 408 || status === 504) {
          errorMessage = 'Request timed out. Please try with a smaller date range or during off-peak hours.';
        } else if (status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request parameters. Please check your date range and try again.';
        } else {
          errorMessage = `Server error (${status}). Please try again later.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
      setAbortController(null);
    }
  };
  
  return (
    <>
      <Form initialValues={{ timePeriod, startDate, weekStartDate, weekEndDate, inspectionShift }} form={form} layout='vertical' onFinish={populateData}>
        <h1 className='font-semibold mb-4 md:!text-2xl -mt-2 text-center'>AI System Accuracy Dashboard</h1> 

        <div>
          <h2 className='font-medium md:!text-xl underline'>
            Time Period
          </h2>

          <Radio.Group value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className='grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-8 mb-4'>
            <Radio value='shift'>Shift</Radio>
            <Radio value='dateRange'>Date Range</Radio>
          </Radio.Group>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-6'>
          {
            timePeriod === 'shift' &&
            <>
              <FormDropdownItem label="Shift" name="inspectionShift" formField="inspectionShift" dropdownArray={shiftList} visibleField="value" valueField="key" onChange={handleShiftChange} required />
              <CustomDatePicker label='Start Date' defaultValue={startDate} name='startDate' onChange={handleShiftChange} required/>
            </>
          }

          {
            timePeriod === 'dateRange' &&
            <>
              <CustomDatePicker label='From Date' name='weekStartDate' defaultValue={weekStartDate} onChange={handleRangeChange} required />
              <CustomDatePicker label='To Date' name='weekEndDate' defaultValue={weekEndDate} onChange={handleRangeChange} required />
            </>
          }



          <div className='mt-0 sm:mt-8 flex gap-2'>
            <Btn htmlType='submit' loading={loading} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </Btn>
            <Button onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            {loading && (
              <Button onClick={cancelRequest} danger>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Form>

      {/* Error Display */}
      {error && (
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          }
        />
      )}

      {/* Loading State for Metrics Cards */}
      <Spin spinning={loading} tip="Loading AI accuracy metrics...">
        <section className='grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 md:gap-x-8 mb-8'>
          {renderTabs()}
        </section>
      </Spin>

      {/* Loading State for Table */}
      <Spin spinning={loading} tip="Processing data...">
        <Table
          columns={columns}
          scroll={{ x: true }}
          rowKey={(record) => record.railId}
          dataSource={dashboardData.paginatedData}
          bordered
          loading={loading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalElements,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} rails`,
            onChange: handlePaginationChange,
          }}
          locale={{
            emptyText: loading ? 'Loading...' : 'No data available. Please search with different criteria.'
          }}
        />
      </Spin>
    </>
  )
}

export default AiSystem