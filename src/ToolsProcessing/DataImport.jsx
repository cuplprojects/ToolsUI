import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Upload,
  Button,
  Typography,
  Space,
  Table,
  Tabs,
  Modal,
  Divider,
} from 'antd';
import { useToast } from '../hooks/useToast';
import { CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { motion } from 'framer-motion';
import DuplicateTool from './DuplicateTool';
import API from '../hooks/api';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const DataImport = () => {
  const { showToast } = useToast();
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [expectedFields, setExpectedFields] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [excelData, setExcelData] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [conflictSelections, setConflictSelections] = useState({});
  const [showData, setShowData] = useState(false);
  const [existingData, setExistingData] = useState([]); // ✅ default to []
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(false); // ✅ added
  const [activeTab, setActiveTab] = useState("1");
  const token = localStorage.getItem('token');

  // Load projects
  useEffect(() => {
    axios.get(`${url}/Project`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setProjects(res.data))
      .catch(err => console.error("Failed to fetch projects", err));
  }, []);

  // Fetch fields + existing data when project changes
  useEffect(() => {
    if (!project) return;
    fetchExistingData(project);
    API.get(`/Fields`)
      .then(res => setExpectedFields(res.data))
      .catch(err => console.error("Failed to fetch fields", err));
  }, [project]);

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
    if (!project) {
      showToast("Please select a project first.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/NRDatas/ErrorReport?ProjectId=${project}`);
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
      await API.put(`/NRDatas?ProjectId=${project}`, payload, {
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

  const readExcel = (file) => {
    if (existingData.length > 0) {   // ✅ fixed
      setPendingFile(file);
      setIsModalVisible(true);
    } else {
      proceedWithReading(file);
    }
  };

  // Upload file logic
  const beforeUpload = (file) => {
    readExcel(file);
    return false; // prevent auto upload
  };

  const handleOk = () => {
    if (pendingFile) {
      proceedWithReading(pendingFile);
      setPendingFile(null);
    }
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setPendingFile(null);
    setIsModalVisible(false);
  };

  const isAnyFieldMapped = () => {
    return expectedFields.some(field => fieldMappings[field.fieldId]);
  };
  const resetForm = () => {
    setProject(null);
    setFileHeaders([]);
    setFieldMappings({});
    setExcelData([]);
    setProcessingStarted(false);
    setExpectedFields([]);
    setViewConflicts(false);
    setConflicts(null);
  };

  const handleUpload = () => {
    const mappedData = getMappedData();
    const payload = {
      projectId: project,
      data: mappedData
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
    if (!project) {
      return <Text type="warning">Please select a project to view data.</Text>;
    }
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



  return (
    <div style={{ padding: 24 }}>
      <Modal
        title="Existing Data Found"
        open={isModalVisible} // ✅ `open` instead of `visible` in AntD v5
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>Data already exists for this project. Do you want to overwrite it?</p>
      </Modal>

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
            <Card title="Data Import" bordered={true} style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>Select Project</Text>
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder="Choose a project..."
                    onChange={setProject}
                    value={project}
                  >
                    <Option value="">Choose a Project...</Option>
                    {projects.map(p => (
                      <Option key={p.projectId} value={p.projectId}>{p.name}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} md={12}>
                  <Upload.Dragger
                    name="file"
                    accept=".xls,.xlsx,.csv"
                    beforeUpload={beforeUpload}
                    maxCount={1}
                  >
                    <p className="ant-upload-drag-icon">📤</p>
                    <p className="ant-upload-text">Upload Excel or CSV file</p>
                    <Button icon={<UploadOutlined />}>Choose File</Button>
                  </Upload.Dragger>
                </Col>
              </Row>

              <Divider />
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

              ) : (
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
              <Card title="Actions" bordered={true} style={{ marginTop: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <Button block onClick={fetchConflictReport}>
                  Load Conflict
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
              <Card title="Duplicate Tool" bordered={true} style={{ marginTop: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <DuplicateTool project={project} />
              </Card></motion.div>
          </Col>
        )}
      </Row>
    </div >
  );
};

export default DataImport;
