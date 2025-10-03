import React, { useEffect, useState } from 'react';
import { Row,Col,Card,Select,Upload,Button,Typography,Space,Table,Tabs,Divider,Checkbox,Input} from 'antd';
import { useToast } from '../hooks/useToast';
import { CheckCircleOutlined, UploadOutlined, ToolOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import DuplicateTool from './DuplicateTool';
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
          pagination={{ pageSize: 10 }}
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
          rowData[header] = row[index];
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
    proceedWithReading(file);
    return false; // prevent auto upload
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
    setLoading(true)
    let mappedData = getMappedData();
    if (keepZeroQuantity) {
      mappedData = mappedData.map((row) => {
        if (row.Quantity === 0) {
          row.Quantity = quantity; // Replace with the updated quantity
        }
        return row;
      });
    }
    if (skipItems) {
      mappedData = mappedData.filter((row) => row.Quantity !== 0);
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

  const getMappedData = () => {
    if (!excelData.length || !fileHeaders.length) return [];

    return excelData.map((row) => {
      const mappedRow = {};
      expectedFields.forEach((field) => {
        const column = fieldMappings[field.fieldId];  // e.g. "Name" or "Age"
        if (column) {
          mappedRow[field.name] = row[column] ?? null;  // ✅ directly use header name
        }
      });
      return mappedRow;
    });
  };

  // Render uploaded Excel preview
  const renderUploadedData = () => {
    if (!showData) return null;

    const columns = fileHeaders.map(header => ({
      title: header,
      dataIndex: header,
      key: header,
    }));

    return <Table columns={columns} dataSource={excelData} pagination={{ pageSize: 10 }} />;
  };

  // Columns for existing data
  const columns = existingData.length
    ? Object.keys(existingData[0]).map((col) => ({
      title: col,
      dataIndex: col,
      key: col,
      ellipsis: true,
    }))
    : [];

  const autoMapField = (expectedField, fileHeaders) => {
    // Check if manually mapped
    if (fieldMappings[expectedField.fieldId]) return null;

    // Normalize both expected field name and file headers
    const normalizedFieldName = expectedField.name.trim().toLowerCase();

    // Find the first match from the file headers
    const match = fileHeaders.find(header => header.trim().toLowerCase() === normalizedFieldName);
    if (match) {
      // Automatically update the fieldMappings state if a match is found
      setFieldMappings((prev) => ({
        ...prev,
        [expectedField.fieldId]: match,
      }));
    }
    return match || null;
  };

  const handleKeepZeroQuantityChange = (e) => {
    setKeepZeroQuantity(e.target.checked);
    if (e.target.checked) {
      setSkipItems(false);  // Deselect skipItems if keepZeroQuantity is selected
    }
  };

  const handleSkipItemsChange = (e) => {
    setSkipItems(e.target.checked);
    if (e.target.checked) {
      setKeepZeroQuantity(false);  // Deselect keepZeroQuantity if skipItems is selected
    }
  };
  const iconStyle = { color: PRIMARY_COLOR, marginRight: 6 };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {/* Left Section */}
        <Col xs={24} md={16}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
            }}
            transition={{ duration: 0.3 }}
          >
            <Card title={<div>
              <span>
                <ToolOutlined style={iconStyle} /> Data Import</span><br />
              <Text type="secondary" >
                Upload and map your data files here
              </Text>
            </div>}
              bordered={true}
              style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <div>

              </div>              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Upload.Dragger
                    name="file"
                    accept=".xls,.xlsx,.csv"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    maxCount={1}
                  >
                    <p className="ant-upload-drag-icon">📤</p>
                    <p className="ant-upload-text">Upload Excel or CSV file</p>
                    <Button icon={<UploadOutlined />}>Choose File</Button>
                  </Upload.Dragger>
                </Col>
                <Col xs={24} md={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
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
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity to replace 0"
                        disabled={!keepZeroQuantity}
                      />
                    )}

                    <Checkbox
                      checked={skipItems}
                      onChange={handleSkipItemsChange}
                    >
                      Skip items with 0 quantity
                    </Checkbox>
                  </Space>
                </Col>
              </Row>

              <Divider />
              {/* {fileHeaders.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card title="Field Mapping" style={{ marginTop: 24, border: '1px solid #d9d9d9', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <Row gutter={[16, 16]}>
                      {expectedFields.map((expectedField) => {
                        // Check for auto-mapping and update fieldMappings
                        const autoMappedValue = autoMapField(expectedField, fileHeaders);

                        return (
                          <Col key={expectedField.fieldId} xs={24} md={8}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Text
                                  style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    marginRight: 8,
                                    color: fieldMappings[expectedField.fieldId] ? '#006400' : 'inherit', // Dark green for mapped fields
                                  }}
                                >
                                  {expectedField.name}
                                </Text>
                                {fieldMappings[expectedField.fieldId] && (
                                  <CheckCircleOutlined style={{ color: '#006400', fontSize: '16px' }} />
                                )}
                              </div>
                              <Select
                                style={{
                                  width: '100%',
                                  borderColor: fieldMappings[expectedField.fieldId] ? '#006400' : undefined, // Dark green border
                                  boxShadow: fieldMappings[expectedField.fieldId] ? '0 0 5px #006400' : undefined, // Optional: dark green shadow
                                }}
                                placeholder="Select matching column from file"
                                value={fieldMappings[expectedField.fieldId] || autoMappedValue} // Automatically select if a match is found
                                onChange={(value) => {
                                  setFieldMappings((prev) => ({
                                    ...prev,
                                    [expectedField.fieldId]: value,
                                  }));
                                }}
                              >
                                {fileHeaders
                                  .filter(
                                    (header) =>
                                      !Object.values(fieldMappings).includes(header) ||
                                      fieldMappings[expectedField.fieldId] === header
                                  )
                                  .map((header, index) => (
                                    <Option key={`${header}-${index}`} value={header}>
                                      {header}
                                    </Option>
                                  ))}
                              </Select>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                    {isAnyFieldMapped() && (
                      <Button type="primary" onClick={handleUpload} loading={loading}>
                        Upload and Validate
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )} */}
              {existingData.length > 0 ? (
                <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)} style={{ marginTop: 16 }}>
                  <TabPane tab="Uploaded Data" key="1">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card style={{ border: '1px solid #d9d9d9', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                        <Table
                          dataSource={existingData}
                          columns={columns}
                          pagination={{ pageSize: 10 }}
                          rowKey="id"
                          scroll={{ x: "max-content" }}
                          loading={loading}
                        />

                      </Card>
                    </motion.div>
                  </TabPane>
                  <TabPane tab="Conflict Report" key="2">
                    {renderConflicts()}
                  </TabPane>
                </Tabs>
              ) : fileHeaders.length > 0 && (
                //FieldMappingSection
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card title="Field Mapping" style={{ marginTop: 24, border: '1px solid #d9d9d9', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Map fields from your file to expected fields</Text>
                    <Row gutter={[16, 16]}>
                      {expectedFields.map((expectedField) => {
                        // Check for auto-mapping and update fieldMappings
                        const autoMappedValue = autoMapField(expectedField, fileHeaders);

                        return (
                          <Col key={expectedField.fieldId} xs={24} md={8}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Text
                                  style={{
                                    display: 'block',
                                    marginBottom: 8,
                                    marginRight: 8,
                                    color: fieldMappings[expectedField.fieldId] ? '#006400' : 'inherit', // Dark green for mapped fields
                                  }}
                                >
                                  {expectedField.name}
                                </Text>
                                {fieldMappings[expectedField.fieldId] && (
                                  <CheckCircleOutlined style={{ color: '#006400', fontSize: '16px' }} />
                                )}
                              </div>
                              <Select
                                style={{
                                  width: '100%',
                                  borderColor: fieldMappings[expectedField.fieldId] ? '#006400' : undefined, // Dark green border
                                  boxShadow: fieldMappings[expectedField.fieldId] ? '0 0 5px #006400' : undefined, // Optional: dark green shadow
                                }}
                                placeholder="Select matching column from file"
                                value={fieldMappings[expectedField.fieldId] || autoMappedValue} // Automatically select if a match is found
                                onChange={(value) => {
                                  setFieldMappings((prev) => ({
                                    ...prev,
                                    [expectedField.fieldId]: value,
                                  }));
                                }}
                              >
                                {fileHeaders
                                  .filter(
                                    (header) =>
                                      !Object.values(fieldMappings).includes(header) ||
                                      fieldMappings[expectedField.fieldId] === header
                                  )
                                  .map((header, index) => (
                                    <Option key={`${header}-${index}`} value={header}>
                                      {header}
                                    </Option>
                                  ))}
                              </Select>
                            </div>
                          </Col>
                        );
                      })}
                    </Row>
                    {isAnyFieldMapped() && (
                      <Button type="primary" block onClick={handleUpload}>
                        Upload and Validate
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )}
            </Card> </motion.div>
        </Col>

        {/* Right Section */}
        {existingData.length > 0 && (
          <Col xs={24} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <Card title={
                <div>
                  <span>
                    <ToolOutlined style={iconStyle} /> Action
                  </span>
                  <br />
                  <Text type="secondary" >Perform additional actions on your data</Text>
                </div>
              }
                bordered={true}
                style={{ marginTop: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <Button
                  block
                  onClick={fetchConflictReport}
                  style={{
                    backgroundColor: '#f0dc24ff',  // Light yellow color
                    borderColor: '#FFEB3B',      // Ensure the border matches the background
                    color: '#000',               // Set text color to black or adjust as needed
                  }}
                >
                  🎉 Load Conflict
                </Button>
              </Card></motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <Card title={
                <div>
                  <span>
                    <ToolOutlined style={iconStyle} />Duplicate Tool
                  </span>
                  <br />
                  <Text type="secondary">Manage duplicates in your data</Text>

                </div>
              }
                bordered={true}
                style={{ marginTop: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <DuplicateTool />
              </Card></motion.div>
          </Col>
        )}
      </Row>
    </div >
  );
};

export default DataImport;
