/* eslint-disable */
import React, { useEffect, useState } from "react";
import { Table, Input, Button, Dropdown, Checkbox } from "antd";
import { DownOutlined, ExportOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

const TableComponent = ({
  columns,
  dataSource,
  hideExport,
  hideManageColumns,
  loading = false,   // optional spinner while the parent loads data
}) => {
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [searchText, setSearchText] = useState({});
  const [filteredData, setFilteredData] = useState(dataSource);
  const [columnDropdownVisible, setColumnDropdownVisible] = useState(false);

  // Handle hiding columns
  const handleHideColumnChange = (columnKey) => {
    setHiddenColumns((prev) => {
      const updated = prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey];

      // Reset search/filter for hidden columns
      if (!prev.includes(columnKey)) {
        setSearchText((prevSearchText) => {
          const { [columnKey]: _, ...rest } = prevSearchText;
          return rest;
        });
        setFilteredData(dataSource); // Reset data
      }

      return updated;
    });
  };

  // Export filtered data and non-hidden columns to CSV
  const exportToCSV = () => {
    const filteredRows = filteredData.map((row) => {
      const filteredRow = {};
      columns
        .filter((col) => !hiddenColumns.includes(col.key))
        .forEach((col) => {
          filteredRow[col.dataIndex] = row[col.dataIndex];
        });
      return filteredRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(filteredRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, "export.csv");
  };

  // Add search and filter capability to columns
  const enhancedColumns = columns
    .map((column) => {
      if (column.searchable) {
        return {
          ...column,
          filterDropdown: () => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder={`Search ${column.title}`}
                value={searchText[column.key] || ""}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase();
                  setSearchText((prev) => ({ ...prev, [column.key]: value }));
                  setFilteredData(
                    dataSource.filter((row) =>
                      row[column.dataIndex]
                        ?.toString()
                        ?.toLowerCase()
                        .includes(value)
                    )
                  );
                }}
                style={{ marginBottom: 8, display: "block" }}
              />
            </div>
          ),
          onFilter: (value, record) =>
            record[column.dataIndex]
              ?.toString()
              ?.toLowerCase()
              .includes(searchText[column.key] || ""),
        };
      }
      if (column.filterable) {
        return {
          ...column,
          filters: [
            ...new Set(dataSource.map((item) => item[column.dataIndex])),
          ]
            .filter(Boolean)
            .map((value) => ({ text: value, value })),
          onFilter: (value, record) => record[column.dataIndex] === value,
        };
      }
      return column;
    })
    .filter((col) => !hiddenColumns.includes(col.key));

  // Dropdown to manage column visibility
  const columnOptions = {
    items: [
      ...columns.map((col) => ({
        key: col.key,
        label: (
          <Checkbox
            checked={!hiddenColumns.includes(col.key)}
            onChange={() => handleHideColumnChange(col.key)}
          >
            {col.title}
          </Checkbox>
        ),
      })),
    ],
  };
  // Long column lists scroll inside the menu; OK stays visible at the bottom
  const renderColumnMenu = (menu) => (
    <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 10px 30px rgba(15,23,42,0.10)", overflow: "hidden" }}>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {React.cloneElement(menu, { style: { boxShadow: "none" } })}
      </div>
      <div style={{ padding: 8, borderTop: "1px solid #e2e8f0" }}>
        <Button onClick={() => setColumnDropdownVisible(false)} block
          style={{ height: 36, background: "#21808d", borderColor: "#21808d", color: "#fff", fontWeight: 600 }}>
          OK
        </Button>
      </div>
    </div>
  );

  useEffect(() => {
    setFilteredData(dataSource);
  }, [dataSource]);

  return (
    <>
      <div>
        {/* <Divider className="m-0" /> */}
        {(!hideManageColumns || !hideExport) && (
          <div className="flex justify-end gap-4 my-4">
            {!hideManageColumns && (
              <Dropdown
                menu={columnOptions}
                popupRender={renderColumnMenu}
                placement="bottomRight"
                autoAdjustOverflow={false}   // always open below the button (the list scrolls inside)
                trigger={["click"]}
                open={columnDropdownVisible}
                // ticking a column must not close the list: close only on OK or a click outside
                onOpenChange={(open, info) => { if (open || info?.source !== "menu") setColumnDropdownVisible(open); }}
              >
                <Button>
                  Manage Columns <DownOutlined />
                </Button>
              </Dropdown>
            )}
            {!hideExport && (
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <span>
                  <ExportOutlined />
                </span>
                <span>Export to CSV</span>
              </Button>
            )}
          </div>
        )}
      </div>
      <Table
        dataSource={filteredData}
        columns={enhancedColumns}
        scroll={{ x: true }}
        pagination={true}
        loading={loading}
        rowKey={(record) => record.id || record.key || JSON.stringify(record)}
        bordered
      />
    </>
  );
};

export default TableComponent;
