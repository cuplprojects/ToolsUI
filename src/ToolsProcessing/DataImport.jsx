import React, { useEffect, useState } from 'react';
import '@ant-design/v5-patch-for-react-19'
import { Row, Col, Card, Select, Upload, Button, Typography, Space, Table, Tabs, Divider, Checkbox, Input, Modal } from 'antd';
import { useToast } from '../hooks/useToast';
import { CheckCircleOutlined, UploadOutlined, ToolOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import API from '../hooks/api';
import useStore from '../stores/ProjectData';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const PRIMARY_COLOR = "#1677ff";

const DataImport = () => {
  const { showToast } = useToast();
  const [fileHeaders, setFileHeaders] = useState([]);
  const [expectedFields, setExpectedFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [excelData, setExcelData] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [conflictSelections, setConflictSelections] = useState({});
  const [showData, setShowData] = useState(false);
  const [existingData, setExistingData] = useState([]); // ✅ default to []
  const [loading, setLoading] = useState(false); // ✅ added
  const [activeTab, setActiveTab] = useState("1");
  const token = localStorage.getItem('token');
  const projectId = useStore((state) => state.projectId);
  const [keepZeroQuantity, setKeepZeroQuantity] = useState(false);
  const [skipItems, setSkipItems] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const toast = useToast()
  // Load projects
  useEffect(() => {
    if (!projectId) return;
    fetchExistingData(projectId);
    API.get(`/Fields`)
      .then(res => setExpectedFields(res.data))
      .catch(err => console.error("Failed to fetch fields", err));
  }, [projectId]);

  const fetchExistingData = async (projectId) => {
    if (!projectId) return;

    setLoading(true);
    try {
      const res = await API.get(`/NRDatas/GetByProjectId/${projectId}`);
      setExistingData(res.data || []);
      setShowData(res.data && res.data.length > 0);
    } catch (err) {
      console.error("Failed to fetch existing data", err);
      setExistingData([]);
      setShowData(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchConflictReport = async () => {
    setActiveTab("2");
    setLoading(true);
    try {
      const res = await API.get(`/NRDatas/ErrorReport?ProjectId=${projectId}`);
      if (res.data?.duplicatesFound) {
        setConflicts(res.data);
        showToast("Conflict report loaded", "success");
      } else {
        setConflicts([]);
        showToast("No conflicts found", "info");
      }
    } catch (err) {
      console.error("Failed to fetch conflict report", err);
      showToast("Failed to load conflict report", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (record) => {
    const selectedValue = conflictSelections[record.catchNo];

    if (!selectedValue) {
      showToast('Please select a value before saving.', "warning");
      return;
    }

    const payload = {
      catchNo: record.catchNo,
      uniqueField: record.uniqueField,
      selectedValue: selectedValue
    };

    try {
      await API.put(`/NRDatas?ProjectId=${projectId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Resolved conflict for ${record.catchNo}`, "success");
      fetchConflictReport();
    } catch (error) {
      console.error('Error saving resolution:', error);
      showToast('Failed to resolve conflict', "error");
    }
  };
  // Update state when user selects a value from dropdown
  const handleSelectionChange = (catchNo, value) => {
    setConflictSelections((prev) => ({
      ...prev,
      [catchNo]: value,
    }));
  };


  const renderConflicts = () => {
    if (!conflicts) return <Text type="secondary">Click "Load Conflict Report" to see conflicts.</Text>;
    if (!Array.isArray(conflicts.errors) || conflicts.errors.length === 0) {
      return <Text type="success">No conflicts found 🎉</Text>;
    }

    const columns = [
      { title: "Catch No", dataIndex: "catchNo", key: "catchNo" },
      { title: "Conflicting Field", dataIndex: "uniqueField", key: "uniqueField" },
      { title: "Value 1", dataIndex: "value1", key: "value1" },
      { title: "Value 2", dataIndex: "value2", key: "value2" },
      {
        title: "Resolve Conflicts",
        key: "resolveconflicts",
        render: (_, record) => {
          const selectedValue = conflictSelections[record.catchNo];
          return (
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                style={{ width: "100%" }}
                placeholder="Select value to keep"
                value={selectedValue}
                onChange={(value) => handleSelectionChange(record.catchNo, value)} // ✅ now works
              >
                <Option value={record.value1}>{record.value1}</Option>
                <Option value={record.value2}>{record.value2}</Option>
              </Select>

              <Button
                type="primary"
                onClick={() => handleSave(record)}
                disabled={!selectedValue}  // ✅ will now enable correctly
              >
                Save
              </Button>
            </Space>
          );
        },
      },
    ];

    const dataSource = conflicts.errors.map((error, index) => ({
      key: index,
      catchNo: error.catchNo,
      uniqueField: error.uniqueField,
      value1: error.conflictingValues[0],
      value2: error.conflictingValues[1],
    }));

    return (
      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Resolve any conflicts found in the data</Text>
        <Text className='mb-3' type="secondary">Please resolve all conflicts before further processing</Text>

        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          rowKey="catchNo"
        /></div>
    );
  };

  // Excel parsing
  const proceedWithReading = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = jsonData[0];
      const rows = jsonData.slice(1).map(row => {
        let rowData = {};
        headers.forEach((header, index) => {
          const value = row[index];  // Define the value variable based on the current row's data
          rowData[header] = value;

          if (header === "ExamDate" && value) {
            rowData[header] = parseDate(value); // Parse date if it's for "ExamDate"
          }
        });

        return rowData;
      });

      setFileHeaders(headers);
      setExcelData(rows);
      setShowData(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // Upload file logic
  const beforeUpload = (file) => {
    setFileList([file]); // Show the selected file
    setFileHeaders([]);
    setFieldMappings({});
    proceedWithReading(file);
    return false; // prevent auto upload
  };

  const handleRemove = (file) => {
    setFileList([]); // Since only one file is allowed
    setFileHeaders([]);
    setFieldMappings({});
  };

  const isAnyFieldMapped = () => {
    return expectedFields.some(field => fieldMappings[field.fieldId]);
  };
  const resetForm = () => {
    setFileHeaders([]);
    setFileList([]);
    setFieldMappings({});
    setExcelData([]);
    setExpectedFields([]);
    setConflicts(null);
    setSkipItems(false)
    setQuantity(0);
    setKeepZeroQuantity(false);
  };

  const handleUpload = () => {
    if (!areRequiredFieldsMapped()) {
      showToast("Please map all required fields: CatchNo, CenterCode, NRQuantity", "error");
      return;
    }
    let mappedData = getMappedData();
    if (mappedData.length === 0) {
      showToast("Required fields cannot be empty. Check your Excel data.", "error");
      return;
    }
    setLoading(true)

    if (keepZeroQuantity) {
      mappedData = mappedData.map((row) => {
        if (row.NRQuantity === 0) {
          row.NRQuantity = quantity; // Replace with the updated quantity
        }
        return row;
      });
    }
    if (skipItems) {
      mappedData = mappedData.filter((row) => row.NRQuantity !== 0);
    }
    const payload = {
      projectId: Number(projectId),
      data: mappedData.map(row => ({
        ...row,
        ExamDate: String(row.ExamDate), // Ensure quantity is a number,
      }))
    };

    API.post(`/NRDatas`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log('Validation result:', res.data);
        showToast("Validation successful", "success");
        setExistingData(payload.data); // Set existing data immediately to show other parts of the screen
        resetForm();
        fetchExistingData();
      })
      .catch(err => {
        console.error("Validation failed", err);
        showToast("Validation failed", "error");
        resetForm();
      })
      .finally(() => {
        setLoading(false); // Stop loading after the process is finished
        setFileList([]);
      });
  };

  const areRequiredFieldsMapped = () => {
    const requiredFields = ["CatchNo", "CenterCode", "NRQuantity"];
    return requiredFields.every(fieldName => {
      const field = expectedFields.find(f => f.name === fieldName);
      return field && fieldMappings[field.fieldId];
    });
  };

  const getMappedData = () => {
    if (!excelData.length || !fileHeaders.length) return [];
    const requiredFields = ["CatchNo", "CenterCode", "NRQuantity"];
    return excelData.map((row, rowIndex) => {
      const mappedRow = {};
      let isRowValid = true;
      expectedFields.forEach((field) => {
        const column = fieldMappings[field.fieldId];  // e.g. "Name" or "Age"
        if (column) {
          let value = row[column] ?? null;

          // Check if the field is "ExamDate" and format the value as a valid date
          if (field.name === "ExamDate" && value) {
            value = formatDateForBackend(parseDate(value));
          }
          if (requiredFields.includes(field.name) && (value === null || value === "")) {
            isRowValid = false;
          }
          mappedRow[field.name] = value;
        }
      });
      return isRowValid ? mappedRow : null;
    })
      .filter(row => row !== null);
  };

  const formatDateForBackend = (date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return date; // Return the original value if it's not a valid date
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  // Render uploaded Excel preview
  const renderUploadedData = () => {
    if (!showData) return null;

    const columns = fileHeaders.map(header => ({
      title: header,
      dataIndex: header,
      key: header,
    }));

    return <Table columns={columns} dataSource={excelData} pagination={{
      ...pagination,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showQuickJumper: true,
      onChange: (page, pageSize) => {
        setPagination({ current: page, pageSize });
      },
    }} />;
  };

  const handleReset = clearFilters => {
    clearFilters();
    setSearchText('');
    confirm();
  };

  const getColumnSearchProps = dataIndex => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <div>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Search
          </Button>
          <Button onClick={() => handleReset(clearFilters, confirm)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </div>
      </div>
    ),
    filterIcon: filtered => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    render: text =>
      searchedColumn === dataIndex ? (
        <span style={{ color: '#1890ff' }}>{text}</span>
      ) : (
        text
      ),
  });

  // Add sorting to your columns

  // Columns for existing data
  const columns = existingData.length
    ? Object.keys(existingData[0]).map((col) => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
    }))
    : [];

  const enhancedColumns = columns.map(col => ({
    ...col,
    ...getColumnSearchProps(col.dataIndex),
    sorter: (a, b) => {
      const valA = a[col.dataIndex];
      const valB = b[col.dataIndex];

      // Handle undefined or null values safely
      if (valA == null) return -1;
      if (valB == null) return 1;

      // If both values are numbers → numeric sort
      if (!isNaN(valA) && !isNaN(valB)) {
        return Number(valA) - Number(valB);
      }
      // Otherwise → alphabetical sort (case-insensitive)
      return String(valA).localeCompare(String(valB), undefined, {
        sensitivity: 'base',
      });
    },
  }));


  const autoMapField = (expectedField, fileHeaders) => {
    // Skip if already manually mapped
    if (fieldMappings[expectedField.fieldId]) return null;

    const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, "");

    const normalizedExpected = normalize(expectedField.name);

    // Map expected field IDs to keywords (manual override)
    const keywordMappings = {
      catchno: ["catch", "catch number"],
      nodalcode: ["nodal", "nodal code"],
      examdate: ["date", "exam date"],
      examtime: ["time", "exam time"],
      nrquantity: ["count", "Nr", "cnt"],
      centercode: ["centre", "centre code"]
    };

    // Step 1: Try exact match (normalized)
    const exactMatch = fileHeaders.find(
      (header) => normalize(header) === normalizedExpected
    );

    if (exactMatch) {
      setFieldMappings((prev) => ({
        ...prev,
        [expectedField.fieldId]: exactMatch,
      }));
      return exactMatch;
    }

    // Step 2: Try keyword-based matching
    const possibleKeywords = keywordMappings[normalizedExpected] || [];

    const keywordMatch = fileHeaders.find((header) => {
      const normalizedHeader = normalize(header);
      return possibleKeywords.some((keyword) =>
        normalizedHeader.includes(normalize(keyword))
      );
    });

    if (keywordMatch) {
      setFieldMappings((prev) => ({
        ...prev,
        [expectedField.fieldId]: keywordMatch,
      }));
      return keywordMatch;
    }

    // No match found
    return null;
  };

  const deleteNRData = async (closeModal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Await the delete call
      await API.delete(`/NRDatas/DeleteByProject/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success message only
      showToast("NR data deleted successfully!", "success");

      // Clear local state
      setExistingData([]);
      setFileList([]);
      setFieldMappings({});
      setFileHeaders({});

      // Close modal
      if (closeModal) closeModal();

    } catch (error) {
      console.error("Error deleting NRData:", error);

      // Safely check for response data
      const errorMsg = error?.response?.data || error?.message || "Failed to delete NR data";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleKeepZeroQuantityChange = (e) => {
    setKeepZeroQuantity(e.target.checked);
    if (e.target.checked) {
      setSkipItems(false);  // Deselect skipItems if keepZeroQuantity is selected
    }
  };
  // Function to handle quantity change
  const handleQuantityChange = (e) => {
    let newQuantity = parseInt(e.target.value, 10);

    // Ensure quantity is a valid number and does not go below 0
    if (newQuantity < 0) {
      newQuantity = 0;
    }

    // Update the quantity state
    setQuantity(newQuantity);
  };


  const handleSkipItemsChange = (e) => {
    setSkipItems(e.target.checked);
    if (e.target.checked) {
      setKeepZeroQuantity(false);  // Deselect keepZeroQuantity if skipItems is selected
    }
  };
  const iconStyle = { color: PRIMARY_COLOR, marginRight: 6 };

  const parseDate = (value) => {
    // If the value is a number, it's a date stored as a number in Excel
    if (typeof value === 'number') {
      // Excel stores dates as serial numbers, so convert it to a Date object
      return new Date(Math.round((value - 25569) * 86400 * 1000)); // Convert Excel date to JS date
    }

    // If the value is a string, try to parse it as a date
    if (typeof value === 'string' && Date.parse(value)) {
      return new Date(value);  // If it's a valid date string, parse it
    }

    // If it's neither, return the value as-is
    return value;
  };

  return (
    <div style={{ padding: 24 }}>
      {/* === PAGE HEADER === */}
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        Data Import
      </Typography.Title>

      {/* === DATA IMPORT SECTION === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.01,
          boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title={
            <div>
              <span>
                <ToolOutlined style={iconStyle} /> Data Import
              </span>
              <br />
              <Text type="secondary">Upload and map your data files here</Text>
            </div>
          }
          bordered={true}
          style={{
            width: "100%",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            marginBottom: 24,
            backgroundColor: "#f5f5f5"
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Upload.Dragger
                name="file"
                accept=".xls,.xlsx,.csv"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onRemove={handleRemove}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">📤</p>
                <p className="ant-upload-text">Upload Excel or CSV file</p>
                <Button icon={<UploadOutlined />}>Choose File</Button>
              </Upload.Dragger>
            </Col>

            <Col xs={24} md={12}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Checkbox
                  checked={keepZeroQuantity}
                  onChange={handleKeepZeroQuantityChange}
                >
                  Keep items with 0 quantity and change their quantity
                </Checkbox>

                {keepZeroQuantity && (
                  <Input
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    placeholder="Enter quantity to replace 0"
                    min={0}
                  />
                )}

                <Checkbox checked={skipItems} onChange={handleSkipItemsChange}>
                  Skip items with 0 quantity
                </Checkbox>
              </Space>
            </Col>
          </Row>

          <Divider />

          {/* === FIELD MAPPING SECTION === */}
          {fileHeaders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.01,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <Card
                title="Field Mapping"
                style={{
                  border: "1px solid #d9d9d9",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 16 }}
                >
                  Map fields from your file to expected fields
                </Text>

                <Row gutter={[16, 16]}>
                  {expectedFields.map((expectedField) => {
                    const autoMappedValue = autoMapField(
                      expectedField,
                      fileHeaders
                    );

                    return (
                      <Col key={expectedField.fieldId} xs={24} md={8}>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <Text
                              style={{
                                marginRight: 8,
                                color: fieldMappings[expectedField.fieldId]
                                  ? "#006400"
                                  : "inherit",
                              }}
                            >
                              {expectedField.name}
                            </Text>
                            {fieldMappings[expectedField.fieldId] && (
                              <CheckCircleOutlined
                                style={{ color: "#006400", fontSize: 16 }}
                              />
                            )}
                          </div>
                          <Select
                            style={{
                              width: "100%",
                              borderColor: fieldMappings[expectedField.fieldId]
                                ? "#006400"
                                : undefined,
                              boxShadow: fieldMappings[expectedField.fieldId]
                                ? "0 0 5px #006400"
                                : undefined,
                            }}
                            placeholder="Select matching column from file"
                            value={
                              fieldMappings[expectedField.fieldId] ||
                              autoMappedValue
                            }
                            onChange={(value) => {
                              setFieldMappings((prev) => ({
                                ...prev,
                                [expectedField.fieldId]: value,
                              }));
                            }}
                            allowClear
                            onClear={() => {
                              setFieldMappings((prev) => {
                                const updated = { ...prev };
                                delete updated[expectedField.fieldId];
                                return updated;
                              });
                            }}
                          >
                            {fileHeaders
                              .filter(
                                (header) =>
                                  !Object.values(fieldMappings).includes(header) ||
                                  fieldMappings[expectedField.fieldId] === header
                              )
                              .map((header, index) => (
                                <Select.Option
                                  key={`${header}-${index}`}
                                  value={header}
                                >
                                  {header}
                                </Select.Option>
                              ))}
                          </Select>
                        </div>
                      </Col>
                    );
                  })}
                </Row>

                {isAnyFieldMapped() && (
                  <Space style={{ marginTop: 16, width: "100%", justifyContent: "space-between" }}>
                    <Button type="primary" onClick={handleUpload}>
                      Upload and Validate
                    </Button>

                  </Space>
                )}
              </Card>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* === DATA AND CONFLICTS SECTION === */}
      {existingData.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              marginBottom: 16,
            }}
          >
            {/* Left side: Title */}
            <Typography.Title level={4} style={{ margin: 0 }}>
              Data & Conflicts
            </Typography.Title>

            {/* Right side: Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                onClick={fetchConflictReport}
                style={{
                  backgroundColor: "#f0dc24ff",
                  borderColor: "#FFEB3B",
                  color: "#000",
                }}
              >
                ⚠️ Load Conflict
              </Button>

              <Button
                danger
                style={{
                  backgroundColor: "#ff4d4f", // full red background
                  borderColor: "#ff4d4f",
                  color: "#fff",
                }}
                onClick={() => {
                  const modal = Modal.confirm({
                    title: "Confirm Deletion",
                    content: "Are you sure you want to delete NR data for this project?",
                    okText: "Yes, Delete",
                    cancelText: "Cancel",
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await deleteNRData(() => modal.destroy());
                    },
                  });
                }}
              >
                🗑️ Delete NR Data
              </Button>
            </div>
          </div>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            <Card
              bordered
              style={{ border: "1px solid #d9d9d9", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}
            >
              <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                style={{ marginTop: 8 }}
              >
                <TabPane tab="Uploaded Data" key="1">
                  {existingData.length > 0 ? (
                    <Table
                      dataSource={existingData}
                      columns={enhancedColumns}
                      pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showQuickJumper: true,
                        onChange: (page, pageSize) => {
                          setPagination({ current: page, pageSize });
                        },
                      }}
                      rowKey="id"
                      scroll={{ x: "max-content" }}
                      loading={loading}
                    />
                  ) : (
                    <Typography.Text type="secondary">No data found</Typography.Text>
                  )}

                </TabPane>

                <TabPane tab="Conflict Report" key="2">
                  {renderConflicts()}
                </TabPane>
              </Tabs>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );

};

export default DataImport;
