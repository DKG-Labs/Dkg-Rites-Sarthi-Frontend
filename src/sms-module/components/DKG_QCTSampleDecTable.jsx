/* eslint-disable */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, Popconfirm, Table } from 'antd';
import { PlusOutlined } from "@ant-design/icons";
import IconBtn from './DKG_IconBtn';

const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
  title, editable, children, dataIndex, record, handleSave, ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingInlineEnd: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

const DKG_InteractionTable = () => {
  const [dataSource, setDataSource] = useState([
    {
      key: '1',
      serialNumber: '1',
      heatNumber: '368917',
      strandNumber: '1',
      sampleID: 'MX1'
    },
  ]);

  const [count, setCount] = useState(2);

  const handleDelete = (key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  const defaultColumns = [
    {
      title: 'S.No.',
      dataIndex: 'serialNumber',
    },
    {
      title: 'Heat Number',
      dataIndex: 'heatNumber',
      editable: true
    },
    {
      title: 'Strand Number',
      dataIndex: 'strandNumber',
      editable: true
    },
    {
      title: 'Sample ID',
      dataIndex: 'sampleID',
      editable: true
    },
    {
      title: 'operation',
      fixed: 'right',
      dataIndex: 'operation',
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleAdd = () => {
    const newData = {
      key: count,
      serialNumber: `${count}`,
      heatNumber: '0',
      strandNumber: `0`,
      sampleID: '0'
    };
    setDataSource([...dataSource, newData]);
    setCount(count + 1);
  };

  const handleSave = (row) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };
  
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });
  return (
    <div>
        <IconBtn
            icon={PlusOutlined}
            text="Add Row"
            className="-mt-4 w-fit mb-4"
            onClick={handleAdd}
        />
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        scroll={{ x: true }}
        bordered
        dataSource={dataSource}
        columns={columns}
        pagination={{
          pageSize: 5,
          showSizeChanger: true, 
          pageSizeOptions: ['5', '10', '20']
        }}
      />
    </div>
  );
};
export default DKG_InteractionTable;