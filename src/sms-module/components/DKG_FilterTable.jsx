/* eslint-disable */
import React, { useState } from 'react';
import { Table, Divider } from 'antd';

const data = [
  {
    key: '1',
    serialNumber: '1',
    railID: 'U240524A013',
    acceptance: '117 x 1, 13 x 1',
    acceptancePlus: '',
    rejection: ''
  },
  {
    key: '2',
    serialNumber: '2',
    railID: 'U240524A015',
    acceptance: '86.67 x 1, 26 x 1',
    acceptancePlus: '',
    rejection: ''
  },
  {
    key: '3',
    serialNumber: '3',
    railID: 'U240524A102',
    acceptance: '86.67 x 1',
    acceptancePlus: '',
    rejection: '13 x 1'
  },
  {
    key: '4',
    serialNumber: '4',
    railID: 'U240524A015',
    acceptance: '65 x 1',
    acceptancePlus: '26 x 1',
    rejection: '13 x 3'
  },
];
const DKG_FilterTable = () => {
  const [filteredInfo, setFilteredInfo] = useState({});

  const handleChange = (pagination, filters) => {
    console.log('Various parameters', pagination, filters);
    setFilteredInfo(filters);
  };

  const columns = [
    {
        title: 'S.No.',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        align: "center"
    },
    {
        title: 'Rail ID',
        dataIndex: 'railID',
        key: 'railID',
        align: "center"
    },
    {
        title: 'Accp. (A)',
        dataIndex: 'acceptance',
        key: 'acceptance',
        align: "center",
        filters: [
            {
                text: '130',
                value: '130'
            },
            {
                text: '117',
                value: '117'
            },
            {
                text: '86.67',
                value: '86.67'
            },
            {
                text: '65',
                value: '65'
            },
            {
                text: '52',
                value: '52'
            },
            {
                text: '26',
                value: '26'
            },
            {
                text: '25',
                value: '25'
            },
            {
                text: '24',
                value: '24'
            },
            {
                text: '14',
                value: '14'
            },
            {
                text: '13',
                value: '13'
            },
            {
                text: '12',
                value: '12'
            },
            {
                text: '11',
                value: '11'
            },
            {
                text: '10',
                value: '10'
            },
        ],
        filteredValue: filteredInfo.acceptance || null,
        onFilter: (value, record) => record.acceptance.includes(value),
        // sorter: (a, b) => a.name.length - b.name.length,
        // sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
        ellipsis: true,
    },
    {
        title: 'Accp. (A+0.1)',
        dataIndex: 'acceptancePlus',
        key: 'acceptancePlus',
        align: "center",
        filters: [
            {
                text: '130',
                value: '130'
            },
            {
                text: '117',
                value: '117'
            },
            {
                text: '86.67',
                value: '86.67'
            },
            {
                text: '65',
                value: '65'
            },
            {
                text: '52',
                value: '52'
            },
            {
                text: '26',
                value: '26'
            },
            {
                text: '25',
                value: '25'
            },
            {
                text: '24',
                value: '24'
            },
            {
                text: '14',
                value: '14'
            },
            {
                text: '13',
                value: '13'
            },
            {
                text: '12',
                value: '12'
            },
            {
                text: '11',
                value: '11'
            },
            {
                text: '10',
                value: '10'
            },
        ],
        filteredValue: filteredInfo.acceptancePlus || null,
        onFilter: (value, record) => record.acceptancePlus.includes(value),
        // sorter: (a, b) => a.name.length - b.name.length,
        // sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
        ellipsis: true,
    },
    {
        title: 'Rejection',
        dataIndex: 'rejection',
        key: 'rejection',
        align: "center",
        filters: [
            {
                text: '13',
                value: '13'
            },
            {
                text: '12',
                value: '12'
            },
            {
                text: '11',
                value: '11'
            },
            {
                text: '10',
                value: '10'
            },
            {
                text: 'Comp',
                value: 'Comp'
            },
        ],
        filteredValue: filteredInfo.rejection || null,
        onFilter: (value, record) => record.rejection.includes(value),
        // sorter: (a, b) => a.name.length - b.name.length,
        // sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
        ellipsis: true,
    }
  ];

  return (
    <>
      <Divider>Rail Wise Data Summary</Divider>

      <Table 
            columns={columns}
            dataSource={data}
            onChange={handleChange}
            bordered
            scroll={{ x: true }}
            pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ["5", "10", "20"],
            }}
        />
    </>
  );
};
export default DKG_FilterTable;