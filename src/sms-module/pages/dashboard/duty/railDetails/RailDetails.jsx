/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { useParams } from "react-router-dom";
import { Spin, Alert } from "antd";
import SubHeader from '../../../../components/DKG_SubHeader';
import { apiCall } from "../../../../utils/CommonFunctions";
import { useSelector } from "react-redux";
import TableComponent from '../../../../components/DKG_Table';
import Btn from '../../../../components/DKG_Btn';
import QuickAccess from '../../../../components/DKG_QuickAccess';

const cameraNameMap = {
  "40522378": "HT",
  "40525413": "BST",
  "40522337": "BSB",
  "40522346": "FB",
  "40522366": "NBSB",
  "40522375": "NBST"
};

function clubContinuousRanges(numbers) {
  if (!Array.isArray(numbers)) return [];

  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const result = [];

  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 10) {
      end = sorted[i];
    } else {
      result.push(start === end ? `${start}` : `${start} - ${end}`);
      start = end = sorted[i];
    }
  }

  result.push(start === end ? `${start}` : `${start} - ${end}`);
  return result;
}

const RailDetails = () => {
    const { railId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataSource, setDataSource] = useState([]);
    const [dataSourceSec, setDataSourceSec] = useState([]);
    const { token } = useSelector((state) => state.auth);

    const [showTable, setShowTable] = useState(false);

    const processData = (data) => {
      if (!Array.isArray(data)) {
        console.error("Invalid data passed to processData:", data);
        return [];
      }
    
      const filteredData = data.filter((item) => item.resultStatus === "fail");
      const groupedData = {};
    
      filteredData.forEach((item) => {
        const key = item.cameraId;
    
        if (!groupedData[key]) {
          groupedData[key] = {
            railId: item.railId || '',
            cameraId: item.cameraId || '',
            cameraName: item.cameraName || '',
            clubbedDefectType: new Set(Array.isArray(item.defectType) ? item.defectType : []),
            clubbedDistanceFromHead: new Set(item?.distanceFromHead ? [item.distanceFromHead] : []),
            defects: [item],
          };
        } else {
          const defectTypeArray = Array.isArray(item.defectType) ? item.defectType : [];
          const distanceFromHead = item?.distanceFromHead ? [item.distanceFromHead] : [];
    
          defectTypeArray.forEach((defect) => groupedData[key].clubbedDefectType.add(defect));
          distanceFromHead.forEach((distance) => groupedData[key].clubbedDistanceFromHead.add(distance));
          groupedData[key].defects.push(item);
        }
      });
    
      return Object.values(groupedData).map((item) => ({
        ...item,
        clubbedDefectType: Array.from(item.clubbedDefectType || []),
        clubbedDistanceFromHead: Array.from(item.clubbedDistanceFromHead || []),
      }));
    };    

    const tableData = processData(dataSource).map((item, index) => ({
      key: index,
      ...item,
    }));

    // const summarizeFailData = (data) => {
    //   const summary = {};
  
    //   data.forEach((item) => {
    //     if (item.resultStatus === "fail") {
    //       if (!summary[item.cameraId]) {
    //         summary[item.cameraId] = {
    //           cameraId: item.cameraId,
    //           cameraName: item.cameraName,
    //           clubbedDefectType: [],
    //         };
    //       }
          
    //       if (!summary[item.cameraId].clubbedDefectType.includes(item.defectType)) {
    //         summary[item.cameraId].clubbedDefectType.push(item.defectType);
    //       }
    //     }
    //   });
  
    //   return Object.values(summary);
    // };

    // const summarizedData = summarizeFailData(dataSource);

    useEffect(() => {
      const fetchRailDetails = async () => {
        try {
          setLoading(true);
          const { data } = await apiCall(
            "GET",
            `/dashboard/getDimensionalInspectionDtlByRailId?railId=${railId}`,
            token
          );
    
          const updatedData = (data?.responseData || []).map(item => ({
            ...item,
            cameraName: cameraNameMap[item.cameraId] || item.cameraName || ''
          }));
    
          setDataSource(updatedData);
        } catch (error) {
          setError(error.message || "Failed to fetch rail details.");
        } finally {
          setLoading(false);
        }
      };
    
      const fetchRailDetailsSec = async () => {
        try {
          setLoading(true);
          const { data } = await apiCall(
            "GET",
            `/dashboard/getSurfaceInspectionDtlByRailId?railId=${railId}`,
            token
          );
    
          const updatedDataSec = (data?.responseData || []).map(item => ({
            ...item,
            cameraName: cameraNameMap[item.cameraId] || item.cameraName || ''
          }));
    
          setDataSourceSec(updatedDataSec);
        } catch (error) {
          setError(error.message || "Failed to fetch rail details.");
        } finally {
          setLoading(false);
        }
      };
    
      fetchRailDetails();
      fetchRailDetailsSec();
    }, [railId, token]);    

    if (loading) {
        return <Spin tip="Loading rail details..." />;
    }
    
    if (error) {
       return <Alert message="Error" description={error} type="error" showIcon />;
    }

    const columns = [
      {
        title: "Camera",
        dataIndex: "cameraId",
        key: "cameraId",
        filterable: true, 
      },
      {
        title: "Camera Name",
        dataIndex: "cameraName",
        key: "cameraName",
        filterable: true, 
      },
      {
        title: "Edge Diff",
        dataIndex: "edgeDiff",
        key: "edgeDiff", 
      },
      {
        title: "Image Diff",
        dataIndex: "imageDiff",
        key: "imageDiff", 
      },
      {
        title: "Dimension Deviation",
        dataIndex: "dimensionDeviation",
        key: "dimensionDeviation", 
      },
      {
        title: "Actual Status",
        dataIndex: "actualStatus",
        key: "actualStatus",
        filterable: true,
      },
      {
        title: "Result Status",
        dataIndex: "resultStatus",
        key: "resultStatus",
        filterable: true,
      },
      {
        title: "Defect Type",
        dataIndex: "defectType",
        key: "defectType",
        filterable: true,
      },
      {
        title: "No of Dimension Variation",
        dataIndex: "noOfDimensionVariation",
        key: "noOfDimensionVariation",
      }
    ];

    const columnsSec = [
      {
        title: "Camera",
        dataIndex: "cameraId",
        key: "cameraId",
        filterable: true, 
      },
      {
        title: "Camera Name",
        dataIndex: "cameraName",
        key: "cameraName",
        filterable: true, 
      },
      {
        title: "Distance",
        dataIndex: "distance",
        key: "distance", 
      },
      {
        title: "Label Index",
        dataIndex: "labelIndex",
        key: "labelIndex", 
      },
      {
        title: "Label Name",
        dataIndex: "labelName",
        key: "labelName", 
        filterable: true,
      },
      {
        title: "Confidence",
        dataIndex: "confidence",
        key: "confidence"
      },
      {
        title: "AI Status",
        dataIndex: "aiStatus",
        key: "aiStatus",
        filterable: true,
      },
      {
        title: "Admin Status",
        dataIndex: "adminStatus",
        key: "adminStatus",
        filterable: true
      }
    ];

    const clubbedColumns = [
      { title: "Rail ID", dataIndex: "railId", key: "railId" },
      { title: "Camera ID", dataIndex: "cameraId", key: "cameraId" },
      { title: "Camera Name", dataIndex: "cameraName", key: "cameraName" },
      {
        title: "Distances from Head",
        dataIndex: "clubbedDistanceFromHead",
        key: "clubbedDistanceFromHead",
        render: (distances) => {
          const ranges = clubContinuousRanges(distances);
          return (
            <div className="space-x-2">
              {ranges.map((range, idx) => (
                <span key={idx} className="bg-gray-200 px-2 py-1 rounded">
                  {range}
                </span>
              ))}
            </div>
          );
        },
      },            
    ];

  return (
    <div className="flex flex-col gap-4 md:gap-2 bg-white p-4 w-full min-h-screen">
      <QuickAccess />
      <SubHeader title="Dimensional Summary" link="/" />
      <TableComponent dataSource={dataSource} columns={columns} bordered/>

      <div className='flex justify-center'>
        <Btn type="primary" className='w-36' onClick={() => setShowTable((prev) => !prev)}>Summarized Data</Btn>
      </div>

      {showTable && (
        <TableComponent
          dataSource={tableData.map((item, index) => ({ ...item, key: index }))}
          columns={clubbedColumns}
          rowKey={(record) => record.cameraId}
          pagination={false}
          bordered
        />
      )}

      <SubHeader title="Surface Summary" link="/" />
      <TableComponent dataSource={dataSourceSec} columns={columnsSec} bordered/>
    </div>
  )
}

export default RailDetails