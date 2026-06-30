/* eslint-disable */
import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../../components/DKG_SubHeader'
import data from "../../../../../../utils/frontSharedData/testSampleDec/testSampleDec.json"
import GeneralInfo from '../../../../../../components/DKG_GeneralInfo';
import { Divider, Table, message, Modal, Space } from 'antd';
import IconBtn from '../../../../../../components/DKG_IconBtn';
import Btn from '../../../../../../components/DKG_Btn';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiCall } from '../../../../../../utils/CommonFunctions';
import { useSelector, useDispatch } from 'react-redux';
import { getOngoingRollingDutyDtls } from '../../../../../../store/slice/rollingDutySlice';

const { testSampleTableData } = data;

const TestSampleList = () => {
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(5);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleRowClick = (heatNo) => {
    message.success(heatNo);
  };

  const handleEdit = async (record) => {
    try {
      // Fetch detailed data for editing using rolling_test_sample_id and type
      const response = await apiCall("GET", `/rolling/getTestSampleById?rollingTestSampleId=${record.rollingTestSampleId}&type=${record.type}`, token);

      // Add the type information to the edit data
      const editData = {
        ...response.data?.responseData,
        type: record.type // Include the original type from the record
      };

      // Navigate to edit form with the fetched data
      navigate('/stage/newTestSampleDeclaration', {
        state: {
          module: state?.module,
          dutyId: state?.dutyId || generalInfo?.dutyId,
          generalInfo: generalInfo,
          editMode: true,
          editData: editData
        }
      });
    } catch (error) {
      message.error("Failed to fetch test sample details for editing.");
    }
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Test Sample',
      content: `Are you sure you want to delete the test sample for Heat Number: ${record.heatNumber} (${record.type})?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Still use heat number and type for delete as the backend expects these parameters
          await apiCall("DELETE", `/rolling/deleteTestSample?heatNumber=${record.heatNumber}&type=${record.type}`, token);
          message.success("Test sample deleted successfully.");
          populateData(); // Refresh the table data
        } catch (error) {
          message.error("Failed to delete test sample.");
        }
      }
    });
  };

  const location = useLocation();
  const {state} = location;
  const rollingDutyFromRedux = useSelector(state => state.rollingDuty);
  const [generalInfo, setGeneralInfo] = useState(state?.generalInfo || null);

  console.log("Stateee: ", location.state);

  // Fetch rolling duty details if not available in state
  useEffect(() => {
    const fetchRollingDutyDetails = async () => {
      if (!generalInfo || !generalInfo.dutyId) {
        try {
          // Try to get from Redux first
          if (rollingDutyFromRedux?.dutyId) {
            setGeneralInfo(rollingDutyFromRedux);
          } else {
            // Fetch from backend if not in Redux
            await dispatch(getOngoingRollingDutyDtls());
          }
        } catch (error) {
          console.error("Failed to fetch rolling duty details:", error);
        }
      }
    };

    fetchRollingDutyDetails();
  }, [generalInfo, rollingDutyFromRedux, dispatch]);

  // Update generalInfo when Redux state changes
  useEffect(() => {
    if (rollingDutyFromRedux?.dutyId && (!generalInfo || !generalInfo.dutyId)) {
      setGeneralInfo(rollingDutyFromRedux);
    }
  }, [rollingDutyFromRedux, generalInfo]);




  // Refresh data when generalInfo changes (when duty details are loaded)
  useEffect(() => {
    if (generalInfo?.dutyId) {
      populateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generalInfo?.dutyId]);

  const handleClick = () => {
    navigate('/stage/newTestSampleDeclaration', {state: {module: state?.module, dutyId: state?.dutyId || generalInfo?.dutyId, generalInfo: generalInfo}});
  }

  const handlePageSizeChange = (value) => {
     setTablePageSize(value);
     setCurrentTablePage(1);
  };

  const columns = [
    {
      title: "S/No",
      dataIndex: "sNo",
      key: "sNo",
      render: (_, __, index) => index+1
    },
    {
      title: "Heat No.",
      dataIndex: "heatNumber",
      key: "heatNo",
    },
    {
      title: "Timing",
      dataIndex: "createdAt",
      key: "timing",
      render: (timestamp) => {
        if (!timestamp) return "";

        // Handle different timestamp formats
        let date;

        // If it's already a valid date string or ISO format
        if (typeof timestamp === 'string' && (timestamp.includes('T') || timestamp.includes('-'))) {
          date = new Date(timestamp);
        }
        // If it's a number (epoch timestamp)
        else if (typeof timestamp === 'number') {
          // Check if it's in seconds (typical epoch) or milliseconds
          // Timestamps in seconds are typically 10 digits, in milliseconds are 13 digits
          date = timestamp.toString().length <= 10
            ? new Date(timestamp * 1000)
            : new Date(timestamp);
        }
        // Try to parse as is
        else {
          date = new Date(timestamp);
        }

        // Return formatted date or empty string if invalid
        return date && !isNaN(date.getTime()) ? date.toLocaleString() : "";
      }
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <IconBtn
            icon={EditOutlined}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <IconBtn
            icon={DeleteOutlined}
            onClick={() => handleDelete(record)}
            title="Delete"
            danger
          />
        </Space>
      ),
    },
  ];

  const [testSampleTableData, setTestSampleTableData] = useState([]);
  const token = useSelector((state) => state.auth.token);

  const populateData = async () => {
    try{
      // Use shift-based filtering for Rolling module duties
      let endpoint = "/rolling/getAllTestSamples";

      if (generalInfo?.dutyId) {
        endpoint = `/rolling/getTestSamplesByCurrentShift?dutyId=${generalInfo.dutyId}`;
      }

      const {data} = await apiCall("GET", endpoint, token);
      const responseData = data?.responseData || [];
      setTestSampleTableData(responseData)
    }
    catch(error){
      console.error("Error fetching test samples:", error);
      message.error("Error fetching test sample data. Please try again.");
    }
  }

  useEffect(() => {
    populateData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh data when navigating back to this page
  useEffect(() => {
    const handleFocus = () => {
      populateData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Also refresh when location state changes (when navigating back)
  useEffect(() => {
    if (location.state) {
      populateData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  if(!state || !state.dutyId){
    message.error("Reach the page from an ongoing duty in a module.")
    return <Navigate to="/" />
  }

  return (
    <FormContainer>
      <SubHeader title='Test Sample - Declaration' link={state?.redirectTo} />
      <GeneralInfo data={generalInfo} />

      <Divider>Rail Test Sample Record</Divider>

      <Table
        columns={columns}
        dataSource={testSampleTableData}
        scroll={{ x: true }}
        pagination={{
          current: currentTablePage,
          pageSize: tablePageSize,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
          onChange: (page) => setCurrentTablePage(page),
          onShowSizeChange: (current, size) => handlePageSizeChange(size),
        }}
      />

      <div className='flex justify-center mt-4'>
        <Btn onClick={handleClick}>Add Test Sample Declaration</Btn>
      </div>
    </FormContainer>
  )
}

export default TestSampleList