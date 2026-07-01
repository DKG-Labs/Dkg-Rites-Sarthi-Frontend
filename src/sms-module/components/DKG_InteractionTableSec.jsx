/* eslint-disable */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, Popconfirm, Table } from 'antd';
import FormNumericInputItem from "./DKG_FormNumericInputItem"

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
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
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
          placeholder
          name={dataIndex}
          rules={[
            {
              required: true,
              message: `${title} is required.`,
            },
          ]}
        >
          <FormNumericInputItem ref={inputRef} onPressEnter={save} onBlur={save} />
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

const DKG_InteractionTableSec = () => {
    const [dataSource, setDataSource] = useState([
        {
            key: 1,
            haz_extent: 'Foot (L)',
            head: '',
            web: '',
            foot: '',
        },
        {
            key: 2,
            haz_extent: 'Foot (R)',
            head: '',
            web: '',
            foot: '',
         },
    ]);

    const defaultColumns = [
        {
            title: 'HAZ Extent (mm)',
            dataIndex: 'haz_extent',
            key: 'haz_extent',
            align: 'center',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Head',
            dataIndex: 'head',
            key: 'head',
            render: (text, record) => (
                <FormNumericInputItem />
            ),
        },
        {
            title: 'Web',
            dataIndex: 'web',
            key: 'web',
            render: (text, record) => (
                <FormNumericInputItem />
            ),
        },
        {
            title: 'Foot',
            dataIndex: 'foot',
            key: 'foot',
            render: (text, record) => (
                <FormNumericInputItem />
            ),
        },
    ];

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

  return (
    <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        scroll={{ x: true }}
        pagination={false}
        dataSource={dataSource}
        columns={columns}
    />
  )
}

export default DKG_InteractionTableSec