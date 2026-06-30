/* eslint-disable */
// QCT Sample List page - COMMENTED OUT - Not displayed in any role
// This page has been hidden from navigation and routing but code is preserved for future use
import React, { useEffect, useState } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer';
import SubHeader from '../../../../../components/DKG_SubHeader';
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import data from "../../../../../utils/frontSharedData/qct/qct.json";
import FormBody from '../../../../../components/DKG_FormBody';
import { useNavigate } from 'react-router-dom';
import FormDropdownItem from '../../../../../components/DKG_FormDropdownItem';
import { Table, Divider, Form, Button } from 'antd';
import Btn from '../../../../../components/DKG_Btn';
import { FilterFilled, CloseCircleOutlined } from "@ant-design/icons";
import { apiCall } from '../../../../../utils/CommonFunctions';
import { useSelector } from 'react-redux';
import TableComponent from '../../../../../components/DKG_Table';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import { qctTestList } from '../../../../../utils/Constants';
// Removed endQctDuty import - no longer needed

const { millDropdownList, railSectionList, railGradeList } = data;

const columns = [
  {
    title: "S No.",
    dataIndex: "sNo",
    render: (_, __, index) => index+1,
  },
  {
    title: "QCT",
    dataIndex: "qctType",
    filterable: true
  },
  {
    title: "Mill",
    dataIndex: "mill",
    filterable: true
  },

  {
    title: "Rail Grade and Rail Section",
    dataIndex: "rg",
    render: (_, row) => row.railGrade + " , " + row.railSection,
    filterable: true
  },
  {
    title: "Sample Month",
    dataIndex: "sampleMonth",
    filterable: true
  },
  {
    title: "No. Of Samples",
    dataIndex: "sampleCount",
    filterable: true
  },
]

const QctSampleList = () => {
  const navigate = useNavigate();

  const [tableData, setTableData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [loading, setLoading] = useState(false);


  const [filters, setFilters] = useState({
    mill: null,
    railSection: null,
    railGrade: null,
    qct: null
  });

  const [form] = Form.useForm();



  const handleFilterChange = (fieldName, value) => {
    setFilters(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }

  const applyFilters = (currentFilters, data) => {
    let filtered = [...data];

    if (currentFilters.mill) {
      filtered = filtered.filter(record => record.mill === currentFilters.mill);
    }

    if (currentFilters.railSection) {
      filtered = filtered.filter(record => record.railSection === currentFilters.railSection);
    }

    if (currentFilters.railGrade) {
      filtered = filtered.filter(record => record.railGrade === currentFilters.railGrade);
    }

    if (currentFilters.qct) {
      filtered = filtered.filter(record => record.qctType === currentFilters.qct);
    }

    setFilteredTableData(filtered);
  };

  const handleFinish = () => {
    setLoading(true);
    applyFilters(filters, tableData);
    setLoading(false);
  };

  const handleReset = () => {
    const resetFilters = {
      mill: null,
      railSection: null,
      railGrade: null,
      qct: null
    };
    setFilters(resetFilters);
    setFilteredTableData(tableData);
    form.resetFields();
  };

  console.log("Tabledata: ", tableData)

  const handleClick = () => {
    navigate('/sms/qct/newSampleDeclaration')
  }

  const {token} = useSelector(state => state.auth)

  const populateData = async () => {
    try {
      setLoading(true);
      const {data} = await apiCall("GET", "/qct/getPendingTestSummary", token)
      const responseData = data?.responseData || [];
      setTableData(responseData);
      setFilteredTableData(responseData);
    }
    catch(error){
      console.error("Error fetching data:", error);
    }
    finally {
      setLoading(false);
    }
  }

  // Remove end duty functionality - not needed anymore
  // const dispatch = useDispatch();
  // const handleFormSubmit = async () => {
  //     await dispatch(endQctDuty(formData)).unwrap();
  //     navigate('/')
  //   }

  useEffect(() => {
    populateData();
  }, []);

  // Apply filters when tableData changes
  useEffect(() => {
    setFilteredTableData(tableData);
  }, [tableData]);

  // QCT uses provided duty ID (no manual duty start required)
  const qctGeneralInfo = {
    date: new Date().toLocaleDateString('en-GB'),
    shift: 'A', // Default shift
    dutyId: 'QCT280825001' // Use provided duty ID for QCT operations
  }

  return (
    <FormContainer>
      <SubHeader title='QCT - Sample List' link='/' />
      <GeneralInfo data={qctGeneralInfo} />

      {/* <FormBody initialValues={formData}> */}
        {/* <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <div className='flex items-center gap-x-2'>
            <FilterFilled />
            <FormDropdownItem label='Mill' name='mill' dropdownArray={millDropdownList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
          </div>

          <div className='flex items-center gap-x-2'>
            <FilterFilled />         
            <FormDropdownItem label ='Rail Section' name='railSection' dropdownArray={railSectionList} valueField='key' visibleField='value' onChange = {handleChange} className='w-full' />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 sm:grid-cols-2 gap-x-4'>
          <div className='flex items-center gap-x-2'>
            <FilterFilled />
            <FormDropdownItem label='Rail Grade' name='railGrade' dropdownArray={railGradeList} valueField='key' visibleField='value' onChange={handleChange} className='w-full' />
          </div>

          <div className='flex items-center gap-x-2'>
            <FilterFilled />          
            <FormDropdownItem label ='QCT' name='qct' dropdownArray={qctList} valueField='key' visibleField='value' onChange = {handleChange} className='w-full' />
          </div>
        </div> */}
        <Form
          initialValues={filters}
          form={form}
          layout="vertical"
          onFinish={handleFinish}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <FormDropdownItem
              label="Mill"
              name="mill"
              formField="mill"
              dropdownArray={millDropdownList}
              valueField="key"
              visibleField="value"
              onChange={(fieldName, value) =>
                handleFilterChange(fieldName, value)
              }
              className="w-full"
            />
            <FormDropdownItem
              label="Rail Section"
              name="railSection"
              formField="railSection"
              dropdownArray={railSectionList}
              visibleField="value"
              valueField="key"
              onChange={(fieldName, value) =>
                handleFilterChange(fieldName, value)
              }
              className="w-full"
            />
            <FormDropdownItem
              label="Rail Grade"
              name="railGrade"
              formField="railGrade"
              dropdownArray={railGradeList}
              visibleField="value"
              valueField="key"
              onChange={(fieldName, value) =>
                handleFilterChange(fieldName, value)
              }
              className="w-full"
            />
            <FormDropdownItem
              label="QCT"
              name="qct"
              formField="qct"
              dropdownArray={qctTestList}
              valueField="key"
              visibleField="value"
              onChange={(fieldName, value) =>
                handleFilterChange(fieldName, value)
              }
              className="w-full"
            />

            <Btn htmlType="submit" text="Search" className="w-full" />
            <Button
              className="flex gap-2 items-center border-darkBlue text-darkBlue"
              onClick={handleReset}
            >
              <span>
                <CloseCircleOutlined />
              </span>
              <span>Reset</span>
            </Button>
          </div>
        </Form>

        <Divider className=''>Samples Declared Pending for Testing</Divider>

        {/* Results Counter */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">
              Showing {filteredTableData.length} of {tableData.length} samples
            </span>
            {filteredTableData.length !== tableData.length && (
              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Filtered results
              </span>
            )}
          </div>
          {Object.values(filters).some(val => val !== null && val !== "") && (
            <div className="text-xs text-gray-500">
              Active filters: {Object.values(filters).filter(val => val !== null && val !== "").length}
            </div>
          )}
        </div>

        <TableComponent
          hideExport
          hideManageColumns
          dataSource={filteredTableData}
          columns={columns}
          scroll={{ x: true }}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} samples`,
          }}
        />

        <div className='flex justify-center mt-4'>
          <Btn onClick={handleClick}>Declare New Sample for Testing</Btn>
        </div>
        <div className="mb-8"></div> {/* Add this for extra space after the button */}
      {/* </FormBody> */}

      
    </FormContainer>
  )
}

export default QctSampleList