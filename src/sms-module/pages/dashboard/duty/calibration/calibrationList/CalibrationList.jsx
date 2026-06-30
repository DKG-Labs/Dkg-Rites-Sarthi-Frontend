/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import FormContainer from '../../../../../components/DKG_FormContainer'
import SubHeader from '../../../../../components/DKG_SubHeader'
import data from "../../../../../utils/frontSharedData/calibration/calibration.json";
import { Divider, Modal, Form, Table, message } from 'antd';
import Btn from "../../../../../components/DKG_Btn"
import { useNavigate } from 'react-router-dom';
import { FilterFilled, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import IconBtn from '../../../../../components/DKG_IconBtn';
import FormInputItem from '../../../../../components/DKG_FormInputItem';
import { useDispatch, useSelector } from 'react-redux';
import { endCalibrationDuty } from '../../../../../store/slice/calibrationDutySlice';
import { apiCall } from "../../../../../utils/CommonFunctions";
import GeneralInfo from '../../../../../components/DKG_GeneralInfo';
import dayjs from "dayjs";
import { startCalibrationDuty } from '../../../../../store/slice/calibrationDutySlice';

const { instrumentMapping: sampleData } = data;

const CalibrationList = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [instrumentCategoryList, setInstrumentCategoryList] = useState([])
  const [instrumentList, setInstrumentList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate();

  const [formData, setFormData] = useState([])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const determineShift = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour < 14) return 'A';
    if (currentHour >= 14 && currentHour < 22) return 'B';
    return 'C';
  };

  const calibrationGeneralInfo = useSelector((state) => state.calibrationDuty);
  const { token, userType } = useSelector((state) => state.auth);

  // Check if user can create new calibrations (only MAIN_ADMIN and LOCAL_ADMIN)
  const canCreateNewCalibration = userType === 'MAIN_ADMIN' || userType === 'LOCAL_ADMIN';


  useEffect(() => {
    const autoStartDuty = async () => {
      if (!calibrationGeneralInfo?.dutyId) {
        const currentDate = dayjs().format("DD/MM/YYYY");
        const shift = determineShift();
  
        try {
          await dispatch(startCalibrationDuty({
            startDate: currentDate,
            shift: shift
          })).unwrap();
        } catch (error) {
          console.error("Failed to start duty:", error);
        }
      }
    };
  
    autoStartDuty();
  }, [dispatch, calibrationGeneralInfo?.dutyId]);

  const populateData = useCallback(async () => {
    const instrumentCategoryList = Object.keys(sampleData).map(inst => {
      return {
        key: inst,
        value: inst
      }
    })

    setInstrumentCategoryList([...instrumentCategoryList]);

    try {
      const { data } = await apiCall(
        "GET",
        `/calibration/getAllLatestCalibrations`,
        token
      );
      const { responseData } = data;

      setFormData(responseData || [])
    } catch (error) {}
  }, [token, calibrationGeneralInfo.dutyId]);

  useEffect(()=> {
    populateData()
  }, [populateData])

  useEffect(() => {
    form.setFieldsValue(formData);
  }, [form, formData]);

  useEffect(()=>{
    if(sampleData[formData.instrumentCategory]){
        const instrumentList = sampleData[formData.instrumentCategory].map(inst => {
        return {
            key: inst,
            value: inst
        }
        })
        setInstrumentList([...instrumentList])
    }
  }, [formData.instrumentCategory, instrumentCategoryList])

  const handleChange = (fieldName, value) => {
    setFormData(prev=>{
      return {
        ...prev,
        [fieldName]: value
      }
    })
  }

  const handleClick = () => {
    navigate('/sms/calibration/bulkCalibration');
  }

  const handleClickSec = () => {
    navigate('/sms/calibration/newModifyCalibration');
  }

  const handleClickTer = async () => {
    await dispatch(endCalibrationDuty(formData)).unwrap();
    navigate('/');
  }

  const handleDelete = async (serialNumber) => {
    try {
      await apiCall("DELETE", `/calibration/deleteCalibration?serialNumber=${serialNumber}`, token);
      message.success("Calibration record deleted successfully");
      populateData(); // Refresh the data
    } catch (error) {
      if (error.response?.status === 403) {
        message.error("Access denied. Only Main Admin and Local Admin can delete calibration instruments.");
      } else {
        message.error("Failed to delete calibration record");
      }
    }
  }

  const columns = [
    {
        title: "S.No.",
        dataIndex: "sno",
        key: "sno",
        fixed: "left",
        align: "center",
        render: (_, __, index) => (currentPage - 1) * pageSize + index + 1
    },
    {
        title: "Instrument",
        dataIndex: "instrument",
        key: "instrument",
        align: "center",
        filterable: true
    },
    {
        title: "Detail",
        dataIndex: "detail",
        key: "detail",
        align: "center",
        filterable: true
    },
    {
        title: "Rail Section",
        dataIndex: "railSection",
        key: "railSection",
        align: "center",
        filterable: true
    },
    {
        title: "Serial Number",
        dataIndex: "serialNumber",
        key: "serialNumber",
        align: "center",
        searchable: true
    },
    // {
    //     title: "Gauge Status",
    //     dataIndex: "gaugeStatus",
    //     key: "gaugeStatus",
    //     align: "center",
    //     filterable: true
    // },
    {
        title: "Calibration Due Date",
        dataIndex: "calibrationValidUpto",
        key: "calibrationValidUpto",
        align: "center",
        filterable: true
    },
    {
        title: "Calibration Date",
        dataIndex: "calibrationDate",
        key: "calibrationDate",
        align: "center",
        filterable: true
    },
    {
        title: "Notification After Days",
        dataIndex: "notificationAfterDays",
        key: "notificationAfterDays",
        align: "center",
        filterable: true
    },
    {
        title: "Result",
        dataIndex: "result",
        key: "result",
        align: "center",
        filterable: true
    },
    {
      title: "Actions",
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <div className="flex gap-2 justify-center">
          <IconBtn
            icon={EditOutlined}
            onClick={() => navigate("/calibration/newModifyCalibration",
              {
                state: {
                  serialNumber: record.serialNumber,
                  editMode: true,
                  calibrationData: record
                }
              }
            )}
            title="Edit"
          />
          {canCreateNewCalibration && (
            <IconBtn
              icon={DeleteOutlined}
              onClick={() => handleDelete(record.serialNumber)}
              title="Delete"
              className="text-red-500 hover:text-red-700"
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <FormContainer>
      <SubHeader title="Calibration - List" link="/" />
      <GeneralInfo data={calibrationGeneralInfo} />

      <Table
        dataSource={formData}
        columns={columns}
        scroll={{ x: true }}
        bordered
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          onChange: (page, size) => {
            setCurrentPage(page);
            if (size !== pageSize) {
              setPageSize(size);
              setCurrentPage(1); // Reset to first page when page size changes
            }
          },
          onShowSizeChange: (_, size) => {
            setPageSize(size);
            setCurrentPage(1); // Reset to first page when page size changes
          },
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Divider className='mt-0 mb-2' />

      {!canCreateNewCalibration && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> You can modify existing calibration instruments and perform bulk calibration.
            Only Main Admin and Local Admin can create new calibration instruments or delete existing ones.
          </p>
        </div>
      )}

      <div className={`grid ${canCreateNewCalibration ? 'grid-cols-1 md:grid-cols-2 sm:grid-cols-2' : 'grid-cols-1'}`}>
        <div className='flex justify-center'>
          <Btn onClick={handleClick} className='sm:mt-0 md:mt-0'>Bulk Calibration</Btn>
        </div>

        {canCreateNewCalibration && (
          <div className='flex justify-center'>
            <Btn onClick={handleClickSec} className='mt-2 sm:mt-0 md:mt-0'>Add New Calibration</Btn>
          </div>
        )}
      </div>
        <div className="mb-8"></div> {/* Add this for extra space after the button */}
              {/* </FormBody> */}



      

      <Modal title='Modify Calibration List' open={isModalOpen} onCancel={()=>setIsModalOpen(false)} footer={null}>
          <FormInputItem placeholder='Enter Heat Number' />
          <Btn>Add</Btn>
      </Modal>
    </FormContainer>
  )
}

export default CalibrationList