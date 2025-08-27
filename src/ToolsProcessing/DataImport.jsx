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
  message,
  Table,
  Tabs,
  Modal,
  Divider,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import DuplicateTool from './DuplicateTool';
import { div } from 'framer-motion/client';

const { Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const url = import.meta.env.VITE_API_BASE_URL;
const url1 = import.meta.env.VITE_API_URL;

const DataImport = () => {
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

    axios.get(`${url1}/Fields`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setExpectedFields(res.data))
      .catch(err => console.error("Failed to fetch fields", err));
  }, [project]);

  const fetchExistingData = async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${url1}/NRDatas?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      message.warning("Please select a project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${url1}/NRDatas/ErrorReport?ProjectId=${project}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.duplicatesFound) {
        setConflicts(res.data);
        message.success("Conflict report loaded");
      } else {
        setConflicts([]);
        message.info("No conflicts found");
      }
    } catch (err) {
      console.error("Failed to fetch conflict report", err);
      message.error("Failed to load conflict report");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (record) => {
    const selectedValue = conflictSelections[record.catchNo];

    if (!selectedValue) {
      message.warning('Please select a value before saving.');
      return;
    }

    const payload = {
      catchNo: record.catchNo,
      uniqueField: record.uniqueField,
      selectedValue: selectedValue
    };

    try {
      await axios.put(`${url1}/NRDatas?ProjectId=${project}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success(`Resolved conflict for ${record.catchNo}`);
      fetchConflictReport();
    } catch (error) {
      console.error('Error saving resolution:', error);
      message.error('Failed to resolve conflict');
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
          <Card title="Data Import" bordered={false}>
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
            {existingData.length > 0 && (
              <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)} style={{ marginTop: 16 }}>
                <TabPane tab="Uploaded Data" key="1">
                  <Card>

                    <Table
                      dataSource={existingData}
                      columns={columns}
                      pagination={{ pageSize: 10 }}
                      rowKey="id"
                      scroll={{ x: "max-content" }}
                      loading={loading}
                    />

                  </Card> </TabPane>
                <TabPane tab="Conflict Report" key="2">
                  {renderConflicts()}
                </TabPane>
              </Tabs>

            )}
          </Card>

        </Col>

        {/* Right Section */}
        <Col xs={24} md={8}>
          <Card title="Actions" bordered={false} style={{ marginTop: '10px' }}>
            <Button block onClick={fetchConflictReport}>
              Load Conflict
            </Button>
          </Card>
          <Card title="Duplicate Tool" bordered={false} style={{ marginTop: '10px' }}>
            <DuplicateTool  project={project}/>
          </Card>


        </Col>
      </Row>
    </div >
  );
};

export default DataImport;
